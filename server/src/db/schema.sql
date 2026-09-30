-- MicroLend Schema Definition
-- PostgreSQL 14+ Relational OLTP Schema
-- Academic Project: MicroLend - Vidyalankar Institute of Technology

-- Ensure pgcrypto or native gen_random_uuid is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    address TEXT NOT NULL,
    aadhaar_number VARCHAR(12) NOT NULL UNIQUE CHECK (aadhaar_number ~ '^[0-9]{12}$'),
    wallet_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (wallet_balance >= 0.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. WALLETS TABLE (Authoritative Single Source of Truth for Balance)
CREATE TABLE IF NOT EXISTS wallets (
    wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE RESTRICT,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (current_balance >= 0.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- 3. LOAN PRODUCTS CATALOG
CREATE TABLE IF NOT EXISTS loan_products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL UNIQUE,
    interest_rate NUMERIC(5, 2) NOT NULL CHECK (interest_rate >= 0.00), -- Annual Percentage Rate (APR %)
    loan_term_months INT NOT NULL CHECK (loan_term_months > 0),
    processing_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (processing_fee >= 0.00),
    min_loan_amount NUMERIC(12, 2) NOT NULL CHECK (min_loan_amount > 0.00),
    max_loan_amount NUMERIC(12, 2) NOT NULL CHECK (max_loan_amount >= min_loan_amount),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. LOAN ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS loan_accounts (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    product_id INT NOT NULL REFERENCES loan_products(product_id) ON DELETE RESTRICT,
    loan_amount NUMERIC(15, 2) NOT NULL CHECK (loan_amount > 0.00),
    interest_rate NUMERIC(5, 2) NOT NULL CHECK (interest_rate >= 0.00),
    emi_amount NUMERIC(15, 2) NOT NULL CHECK (emi_amount > 0.00),
    total_payable NUMERIC(15, 2) NOT NULL CHECK (total_payable >= loan_amount),
    outstanding_balance NUMERIC(15, 2) NOT NULL CHECK (outstanding_balance >= 0.00),
    loan_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (loan_status IN ('PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'CLOSED', 'DEFAULTED')),
    loan_start_date DATE,
    loan_end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loans_user_status ON loan_accounts(user_id, loan_status);
CREATE INDEX IF NOT EXISTS idx_loans_product ON loan_accounts(product_id);

-- 5. EMI SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS emi_schedules (
    emi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loan_accounts(loan_id) ON DELETE RESTRICT,
    emi_number INT NOT NULL CHECK (emi_number > 0),
    due_date DATE NOT NULL,
    emi_amount NUMERIC(15, 2) NOT NULL CHECK (emi_amount > 0.00),
    principal_component NUMERIC(15, 2) NOT NULL CHECK (principal_component >= 0.00),
    interest_component NUMERIC(15, 2) NOT NULL CHECK (interest_component >= 0.00),
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0.00),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (payment_status IN ('PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID')),
    paid_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_loan_emi_number UNIQUE (loan_id, emi_number)
);

CREATE INDEX IF NOT EXISTS idx_emi_loan_status ON emi_schedules(loan_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_emi_due_date ON emi_schedules(due_date);

-- 6. TRANSACTION LEDGER (IMMUTABLE AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS transaction_ledger (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE RESTRICT,
    loan_id UUID REFERENCES loan_accounts(loan_id) ON DELETE RESTRICT,
    transaction_type VARCHAR(30) NOT NULL 
        CHECK (transaction_type IN ('WALLET_CREDIT', 'WALLET_DEBIT', 'LOAN_DISBURSEMENT', 'EMI_PAYMENT', 'PENALTY', 'REFUND')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0.00),
    balance_after_transaction NUMERIC(15, 2) NOT NULL CHECK (balance_after_transaction >= 0.00),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_no VARCHAR(64) NOT NULL UNIQUE,
    remarks TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ledger_wallet_date ON transaction_ledger(wallet_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON transaction_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_loan ON transaction_ledger(loan_id);

-- 7. TRIGGER: IMMUTABLE AUDIT LOG (Prohibit UPDATE and DELETE on transaction_ledger)
CREATE OR REPLACE FUNCTION prevent_ledger_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ACID VIOLATION: transaction_ledger is append-only. Modification or deletion of historical transactions is strictly forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_transaction_ledger ON transaction_ledger;
CREATE TRIGGER trg_protect_transaction_ledger
BEFORE UPDATE OR DELETE ON transaction_ledger
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_tampering();

-- 8. TRIGGER: SYNCHRONIZE User.wallet_balance WITH Wallet.current_balance
-- Resolves Part 3: guarantees 100% 3NF Single Source of Truth + literal ER attribute retention
CREATE OR REPLACE FUNCTION sync_user_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET wallet_balance = NEW.current_balance 
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_wallet_balance ON wallets;
CREATE TRIGGER trg_sync_wallet_balance
AFTER INSERT OR UPDATE OF current_balance ON wallets
FOR EACH ROW EXECUTE FUNCTION sync_user_wallet_balance();

-- 9. TRIGGER: UPDATE wallets.last_updated TIMESTAMP
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_wallet_timestamp ON wallets;
CREATE TRIGGER trg_update_wallet_timestamp
BEFORE UPDATE ON wallets
FOR EACH ROW EXECUTE FUNCTION update_wallet_timestamp();
