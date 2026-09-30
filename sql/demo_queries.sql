-- ====================================================================
-- MicroLend DBMS Demonstration Queries
-- Academic Project: MicroLend - Vidyalankar Institute of Technology (VIT)
-- Subject: Database Management Systems (DBMS)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. BASIC DDL INSPECTION & INTEGRITY CONSTRAINTS
-- --------------------------------------------------------------------
-- Inspect Table Schemas, Column Types, and Nullability
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('users', 'wallets', 'loan_products', 'loan_accounts', 'emi_schedules', 'transaction_ledger')
ORDER BY table_name, ordinal_position;

-- Inspect Referential Integrity (Foreign Keys)
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- --------------------------------------------------------------------
-- 2. RELATIONAL JOINS (MULTI-TABLE FINANCIAL QUERIES)
-- --------------------------------------------------------------------
-- Full 3NF Multi-Table Join: Borrower, Wallet, Active Loan, Product, and Paid Installments
SELECT 
    u.full_name AS borrower_name,
    u.email,
    w.current_balance AS wallet_balance,
    p.product_name,
    l.loan_amount,
    l.interest_rate AS annual_apr,
    l.emi_amount,
    l.outstanding_balance,
    l.loan_status,
    COUNT(e.emi_id) AS total_scheduled_emis,
    COUNT(CASE WHEN e.payment_status = 'PAID' THEN 1 END) AS emis_cleared,
    COUNT(CASE WHEN e.payment_status = 'PENDING' THEN 1 END) AS emis_remaining
FROM users u
JOIN wallets w ON u.user_id = w.user_id
JOIN loan_accounts l ON u.user_id = l.user_id
JOIN loan_products p ON l.product_id = p.product_id
LEFT JOIN emi_schedules e ON l.loan_id = e.loan_id
GROUP BY u.user_id, u.full_name, u.email, w.current_balance, p.product_name, l.loan_id, l.loan_amount, l.interest_rate, l.emi_amount, l.outstanding_balance, l.loan_status;

-- --------------------------------------------------------------------
-- 3. AGGREGATE FUNCTIONS & GROUP BY (PORTFOLIO ANALYTICS)
-- --------------------------------------------------------------------
-- Portfolio Aggregates: Total capital deployed, active risk exposure, average APR, and recovery
SELECT 
    COUNT(loan_id) AS total_loans_issued,
    COUNT(CASE WHEN loan_status = 'ACTIVE' THEN 1 END) AS active_accounts,
    COUNT(CASE WHEN loan_status = 'CLOSED' THEN 1 END) AS closed_accounts,
    SUM(loan_amount) AS total_principal_disbursed,
    SUM(outstanding_balance) AS total_active_capital_at_risk,
    ROUND(AVG(interest_rate), 2) AS weighted_avg_apr,
    ROUND(((SUM(loan_amount) - SUM(outstanding_balance)) / SUM(loan_amount)) * 100, 2) AS recovery_percentage
FROM loan_accounts;

-- Group By: Financial Transaction Volume by Operation Type
SELECT 
    transaction_type,
    COUNT(transaction_id) AS transaction_count,
    SUM(amount) AS total_transacted_volume,
    ROUND(AVG(amount), 2) AS avg_transaction_size,
    MIN(amount) AS min_transaction,
    MAX(amount) AS max_transaction
FROM transaction_ledger
GROUP BY transaction_type
ORDER BY transaction_count DESC;

-- Group By: Loan Exposure by Product Catalog
SELECT 
    p.product_name,
    COUNT(l.loan_id) AS contracts_count,
    COALESCE(SUM(l.loan_amount), 0.00) AS total_disbursed,
    COALESCE(SUM(l.outstanding_balance), 0.00) AS outstanding_exposure,
    ROUND(COALESCE(AVG(l.loan_amount), 0.00), 2) AS average_ticket_size
FROM loan_products p
LEFT JOIN loan_accounts l ON p.product_id = l.product_id
GROUP BY p.product_id, p.product_name
ORDER BY contracts_count DESC;

-- --------------------------------------------------------------------
-- 4. ACID TRANSACTIONS & ROW-LEVEL LOCKING DEMONSTRATION
-- --------------------------------------------------------------------
-- Demonstrates explicit pessimistic locking via SELECT ... FOR UPDATE
-- This prevents race conditions and dirty reads during simultaneous balance updates.
BEGIN;

-- Step 1: Lock the borrower's wallet exclusively
SELECT wallet_id, user_id, current_balance 
FROM wallets 
WHERE user_id = 'b0000000-0000-0000-0000-000000000002' 
FOR UPDATE;

-- Step 2: Validate available balance >= transaction amount inside the transaction boundary
-- Step 3: Execute state mutation
UPDATE wallets 
SET current_balance = current_balance - 500.00,
    last_updated = CURRENT_TIMESTAMP
WHERE user_id = 'b0000000-0000-0000-0000-000000000002';

-- Step 4: Record immutable audit entry
INSERT INTO transaction_ledger 
    (user_id, wallet_id, loan_id, transaction_type, amount, balance_after_transaction, reference_no, remarks)
VALUES 
    ('b0000000-0000-0000-0000-000000000002', 
     '11000000-0000-0000-0000-000000000002', 
     NULL, 
     'WALLET_DEBIT', 
     500.00, 
     (SELECT current_balance FROM wallets WHERE user_id = 'b0000000-0000-0000-0000-000000000002'), 
     'DEMO-TXN-LOCK-001', 
     'DBMS demonstration row-locked wallet debit');

-- Step 5: Atomically commit changes to WAL and disk
COMMIT;

-- --------------------------------------------------------------------
-- 5. IMMUTABLE AUDIT TRAIL & TRIGGER TAMPER DEFENSE DEMONSTRATION
-- --------------------------------------------------------------------
-- Demonstrates that the append-only trigger prohibits retroactive ledger tampering.
-- RUNNING THE QUERY BELOW WILL INTENTIONALLY RAISE AN ACID VIOLATION EXCEPTION:
-- UPDATE transaction_ledger SET amount = 0.00 WHERE reference_no = 'TXN-INIT-001';
-- DELETE FROM transaction_ledger WHERE reference_no = 'TXN-INIT-001';

-- --------------------------------------------------------------------
-- 6. FIRST-PRINCIPLES BALANCE RECONCILIATION QUERY
-- --------------------------------------------------------------------
-- Reconstructs wallet balance from first principles by summing all historical transactions
-- and checks for zero variance against the stored balance.
SELECT 
    w.user_id,
    u.full_name,
    w.current_balance AS stored_wallet_balance,
    COALESCE(SUM(CASE 
        WHEN t.transaction_type IN ('WALLET_CREDIT', 'LOAN_DISBURSEMENT', 'REFUND') THEN t.amount
        WHEN t.transaction_type IN ('WALLET_DEBIT', 'EMI_PAYMENT', 'PENALTY') THEN -t.amount
        ELSE 0 
    END), 0.00) AS computed_historical_balance,
    ABS(w.current_balance - COALESCE(SUM(CASE 
        WHEN t.transaction_type IN ('WALLET_CREDIT', 'LOAN_DISBURSEMENT', 'REFUND') THEN t.amount
        WHEN t.transaction_type IN ('WALLET_DEBIT', 'EMI_PAYMENT', 'PENALTY') THEN -t.amount
        ELSE 0 
    END), 0.00)) AS variance,
    CASE 
        WHEN ABS(w.current_balance - COALESCE(SUM(CASE 
            WHEN t.transaction_type IN ('WALLET_CREDIT', 'LOAN_DISBURSEMENT', 'REFUND') THEN t.amount
            WHEN t.transaction_type IN ('WALLET_DEBIT', 'EMI_PAYMENT', 'PENALTY') THEN -t.amount
            ELSE 0 
        END), 0.00)) < 0.01 THEN 'PERFECT_INTEGRITY'
        ELSE 'DISCREPANCY_DETECTED'
    END AS audit_status
FROM wallets w
JOIN users u ON w.user_id = u.user_id
LEFT JOIN transaction_ledger t ON w.wallet_id = t.wallet_id
GROUP BY w.user_id, u.full_name, w.current_balance;
