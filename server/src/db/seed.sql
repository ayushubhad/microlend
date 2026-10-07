-- MicroLend Seed Data
-- Deterministic Financial Data for MicroLend DBMS OLTP System

-- 1. CLEAN UP EXISTING DATA (In correct relational order)
TRUNCATE emi_schedules, transaction_ledger, loan_accounts, wallets, users, loan_products CASCADE;

-- 2. INSERT USERS (Admin and Sample Borrowers)
INSERT INTO users (user_id, full_name, email, phone_number, password_hash, role, address, aadhaar_number, wallet_balance)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'System Administrator', 'admin@gov.in', '+919876543210', '$2b$10$rwn0IyovIobRw0Ed4M12vuoRMyiG2/c4OmCdBkoj2LHqfeyCJAnYe', 'ADMIN', 'VIT Campus, Wadala East, Mumbai, Maharashtra 400037', '123456789012', 1000000.00),
    ('b0000000-0000-0000-0000-000000000002', 'Priya Sharma', 'priya@gmail.com', '+919820012345', '$2b$10$JgPa7MhIsyuqHoue/SQnLeamXjLgonLCk.UjUmWMVQAtEW/bacNb.', 'USER', 'B-402, Green Meadows, Andheri East, Mumbai 400069', '987654328921', 24500.00),
    ('c0000000-0000-0000-0000-000000000003', 'Dr. Arvind Rao', 'arvind@gmail.com', '+919833445566', '$2b$10$3xSrHlLsIFwkFFjb9bd.9un3V9Vqq0nA78qT3w62dfNu.Ran2YBdW', 'USER', '12/A, Sea Breeze Apartments, Dadar West, Mumbai 400028', '543210987654', 15000.00);

-- 3. INSERT WALLETS (1:1 with users)
INSERT INTO wallets (wallet_id, user_id, current_balance)
VALUES 
    ('11000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1000000.00),
    ('11000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 24500.00),
    ('11000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 15000.00);

-- 4. INSERT LOAN PRODUCTS
INSERT INTO loan_products (product_id, product_name, interest_rate, loan_term_months, processing_fee, min_loan_amount, max_loan_amount)
VALUES 
    (1, 'Micro-Biz Starter 6M', 10.50, 6, 250.00, 5000.00, 25000.00),
    (2, 'Emergency Credit 3M', 12.00, 3, 150.00, 2000.00, 15000.00),
    (3, 'Artisan Growth 12M', 9.75, 12, 500.00, 20000.00, 75000.00),
    (4, 'Green Energy Micro-Loan 9M', 8.50, 9, 300.00, 10000.00, 50000.00);

ALTER SEQUENCE loan_products_product_id_seq RESTART WITH 5;

-- 5. INSERT SAMPLE LOAN ACCOUNT FOR PRIYA SHARMA (Active Loan: 45,000 borrowed at 9.75% for 12 months)
INSERT INTO loan_accounts (loan_id, user_id, product_id, loan_amount, interest_rate, emi_amount, total_payable, outstanding_balance, loan_status, loan_start_date, loan_end_date, created_at)
VALUES (
    '21000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    3,
    45000.00,
    9.75,
    3951.15,
    47413.80,
    34155.79,
    'ACTIVE',
    CURRENT_DATE - INTERVAL '3 months',
    CURRENT_DATE + INTERVAL '9 months',
    CURRENT_TIMESTAMP - INTERVAL '3 months'
);

-- 6. INSERT EMI SCHEDULE (12 Installments for Priya Sharma's Active Loan)
INSERT INTO emi_schedules (emi_id, loan_id, emi_number, due_date, emi_amount, principal_component, interest_component, amount_paid, payment_status, paid_date)
VALUES 
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 1, CURRENT_DATE - INTERVAL '2 months', 3951.15, 3585.52, 365.63, 3951.15, 'PAID', CURRENT_TIMESTAMP - INTERVAL '2 months'),
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 2, CURRENT_DATE - INTERVAL '1 month',  3951.15, 3614.66, 336.49, 3951.15, 'PAID', CURRENT_TIMESTAMP - INTERVAL '1 month'),
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 3, CURRENT_DATE - INTERVAL '5 days',   3951.15, 3644.03, 307.12, 3951.15, 'PAID', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 4, CURRENT_DATE + INTERVAL '25 days',  3951.15, 3673.64, 277.51, 0.00,    'PENDING', NULL),
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 5, CURRENT_DATE + INTERVAL '55 days',  3951.15, 3703.49, 247.66, 0.00,    'PENDING', NULL),
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 6, CURRENT_DATE + INTERVAL '85 days',  3951.15, 3733.58, 217.57, 0.00,    'PENDING', NULL),
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 7, CURRENT_DATE + INTERVAL '115 days', 3951.15, 3763.92, 187.23, 0.00,    'PENDING', NULL),
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 8, CURRENT_DATE + INTERVAL '145 days', 3951.15, 3794.50, 156.65, 0.00,    'PENDING', NULL),
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 9, CURRENT_DATE + INTERVAL '175 days', 3951.15, 3825.33, 125.82, 0.00,    'PENDING', NULL),
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 10, CURRENT_DATE + INTERVAL '205 days', 3951.15, 3856.41, 94.74,  0.00,    'PENDING', NULL),
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 11, CURRENT_DATE + INTERVAL '235 days', 3951.15, 3887.74, 63.41,  0.00,    'PENDING', NULL),
    (gen_random_uuid(), '21000000-0000-0000-0000-000000000001', 12, CURRENT_DATE + INTERVAL '265 days', 3951.15, 3919.33, 31.82,  0.00,    'PENDING', NULL);

-- 7. INSERT TRANSACTION LEDGER RECORDS (Append-Only Audit Trail)
INSERT INTO transaction_ledger (transaction_id, user_id, wallet_id, loan_id, transaction_type, amount, balance_after_transaction, transaction_date, reference_no, remarks)
VALUES 
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', NULL, 'WALLET_CREDIT', 10000.00, 10000.00, CURRENT_TIMESTAMP - INTERVAL '95 days', 'TXN-INIT-001', 'Initial digital wallet top-up via NetBanking'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', 'LOAN_DISBURSEMENT', 44500.00, 54500.00, CURRENT_TIMESTAMP - INTERVAL '90 days', 'TXN-DISB-45000', 'Loan #2100 principal 45,000 less 500 fee credited to wallet'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', NULL, 'WALLET_DEBIT', 18146.55, 36353.45, CURRENT_TIMESTAMP - INTERVAL '70 days', 'TXN-WDRW-001', 'Vendor withdrawal for business raw materials'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', 'EMI_PAYMENT', 3951.15, 32402.30, CURRENT_TIMESTAMP - INTERVAL '60 days', 'TXN-EMI-001', 'Installment #1 of 12 for Loan #2100 (Principal: 3,585.52, Interest: 365.63)'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', 'EMI_PAYMENT', 3951.15, 28451.15, CURRENT_TIMESTAMP - INTERVAL '30 days', 'TXN-EMI-002', 'Installment #2 of 12 for Loan #2100 (Principal: 3,614.66, Interest: 336.49)'),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', 'EMI_PAYMENT', 3951.15, 24500.00, CURRENT_TIMESTAMP - INTERVAL '5 days', 'TXN-EMI-003', 'Installment #3 of 12 for Loan #2100 (Principal: 3,644.03, Interest: 307.12)'),
    (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000003', NULL, 'WALLET_CREDIT', 15000.00, 15000.00, CURRENT_TIMESTAMP - INTERVAL '10 days', 'TXN-CRD-ARVIND', 'Initial wallet funding via UPI transfer');
