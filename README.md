# MicroLend: A Secure OLTP-Based Micro-Lending & EMI Management System

**Academic Institution:** Vidyalankar Institute of Technology (VIT), Mumbai (AY 2026–27)  
**Subject:** Database Management Systems (DBMS)  
**Project Guide:** Prof. Pankaj Vanwari  
**Student Team:**
* Shubham Jadhav (Roll No: 25102B0002)
* Jash Waghela (Roll No: 25102B0011)
* Ayush Ubhad (Roll No: 25102B0030)

---

## 1. System Overview & Motivation

**MicroLend** is an enterprise-grade Online Transaction Processing (OLTP) micro-lending and EMI management system. In microfinance, platforms must process high volumes of frequent, small-scale financial transactions—such as micro-disbursements, wallet top-ups, weekly/monthly interest accruals, amortization schedules, and periodic EMI repayments.

Unlike analytical systems or document stores (e.g., MongoDB, DynamoDB) that favor eventual consistency, financial applications cannot tolerate:
1. **Lost Updates & Race Conditions:** Concurrent loan repayments or simultaneous wallet withdrawals causing double-spending.
2. **Floating-Point Imprecision:** Binary floating-point rounding errors (`FLOAT`, `DOUBLE PRECISION`) that leak currency and violate legal accounting standards.
3. **Partial Multi-Step Failures:** A failure occurring midway through crediting a wallet and creating an amortization schedule.
4. **Audit Trail Tampering:** Retroactive alteration of historical financial balances.

MicroLend demonstrates why an **RDBMS (specifically PostgreSQL)** is indispensable for modern financial engineering through strict **Third Normal Form (3NF)** normalization, **ACID transactions**, pessimistic row-level locking (`SELECT ... FOR UPDATE`), and an **append-only immutable transaction ledger**.

---

## 2. Technology Stack (PERN Architecture)

* **Frontend:** React 19 + Vite + Tailwind CSS (Engineered using the **Vercel Geist Design System** with Geist Sans & Geist Mono typography).
* **Backend:** Node.js + Express (Modular architecture: routes, controllers, middleware, financial engine).
* **Database:** **PostgreSQL 18.4** (Strictly relational, ACID-compliant OLTP engine with connection pooling via `pg.Pool`).
* **Security:** Cryptographic password hashing (`bcrypt`), stateless JWT authentication, and database-level trigger defenses.

---

## 3. Relational Schema & 3NF Design

The database schema strictly adheres to **Third Normal Form (3NF)**:

```
 ┌──────────────┐                 1 : 1                 ┌──────────────┐
 │    USERS     ├───────────────────────────────────────┤   WALLETS    │
 └───┬──────────┘  owns                                 └──────┬───────┘
     │                                                         │
     │ 1 : M                                                   │ 1 : M
     │ borrows                                                 │ records
     ▼                                                         ▼
 ┌──────────────┐        M : 1         ┌──────────────┐ ┌──────────────┐
 │LOAN_ACCOUNTS │──────────────────────┤LOAN_PRODUCTS │ │ TRANSACTION_ │
 └───┬──────────┘  uses                └──────────────┘ │    LEDGER    │
     │                                                  └──────▲───────┘
     │ 1 : M                                                   │
     │ has                                                     │ 1 : M
     ▼                                                         │ generates
 ┌──────────────┐                                              │
 │ EMI_SCHEDULE ├──────────────────────────────────────────────┘
 └──────────────┘
```

### Relational Entities:
1. **`users`:** Customer profiles, hashed credentials (`bcrypt`), role definitions (`USER` vs `ADMIN`), and unique Aadhaar identification.
2. **`wallets`:** Authoritative digital wallet storing verified cash balances (`current_balance`), exclusively locked during financial operations.
3. **`loan_products`:** Master catalog defining interest rates (APR %), tenures (months), processing fees, and principal boundaries.
4. **`loan_accounts`:** Legally binding loan contracts instantiated between a user and a product, tracking outstanding balances and disbursement states.
5. **`emi_schedules`:** Detailed installment schedules with Principal and Interest splits per installment based on the reducing balance formula.
6. **`transaction_ledger`:** Immutable, append-only financial audit journal with pre- and post-transaction balances.

### Reconciling `User.Wallet_Balance` vs. `Wallet.Current_Balance`:
To maintain strict 3NF while fulfilling both the literal text specification and the ER diagram:
* `wallets.current_balance` is the **authoritative single source of truth**.
* An automated PostgreSQL trigger (`trg_sync_wallet_balance`) synchronizes `users.wallet_balance` whenever `wallets.current_balance` updates, preventing update anomalies and split-brain states.

---

## 4. ACID Compliance & Concurrency Control

### Pessimistic Row-Level Locking (`SELECT ... FOR UPDATE`)
To prevent the classic double-spending attack (e.g., submitting two concurrent withdrawals or payments from the same wallet), MicroLend enforces row-level locking:

```sql
BEGIN;

  -- 1. Acquire exclusive lock on borrower wallet
  SELECT wallet_id, current_balance FROM wallets WHERE user_id = $1 FOR UPDATE;

  -- 2. Deduct EMI from wallet
  UPDATE wallets SET current_balance = current_balance - $2 WHERE wallet_id = $3;

  -- 3. Amortize loan balance and mark installment paid
  UPDATE emi_schedules SET payment_status = 'PAID', paid_date = CURRENT_TIMESTAMP WHERE emi_id = $4;
  UPDATE loan_accounts SET outstanding_balance = outstanding_balance - $5 WHERE loan_id = $6;

  -- 4. Append immutable entry to transaction ledger (Trigger-Protected)
  INSERT INTO transaction_ledger (user_id, wallet_id, loan_id, transaction_type, amount, balance_after_transaction, reference_no)
  VALUES ($1, $3, $6, 'EMI_PAYMENT', $2, $7, $8);

COMMIT;
```

### Deadlock Avoidance Protocol
Whenever multiple records must be locked, locks are acquired in a strict global hierarchy:
$$\text{Lock Order: } \mathbf{wallets} \longrightarrow \mathbf{loan\_accounts} \longrightarrow \mathbf{emi\_schedules}$$

---

## 5. Financial Mathematics Engine

### Reducing Balance Amortization Formula
$$\text{Monthly Rate: } r = \frac{\text{APR}}{12 \times 100}$$

$$\text{Equated Monthly Installment (EMI): } E = P \times \frac{r(1 + r)^n}{(1 + r)^n - 1}$$

* **Monthly Interest Component:** $I_m = \text{round}(\text{Balance}_{m-1} \times r, 2)$
* **Monthly Principal Component:** $P_m = E - I_m$
* **Final Month Adjustment:** On month $n$, $P_n$ is adjusted so the remaining ending balance reaches exactly **₹0.00**.

---

## 6. Pre-Configured Demo Accounts & Login Flow

For immediate evaluation and live demonstration, the system comes seeded with three specific user personas:

| Role | Name | Email | Password | Pre-Configured State |
| :--- | :--- | :--- | :--- | :--- |
| **Active Borrower** | Priya Sharma | `priya@gmail.com` | `Priya123` | Active Loan of ₹45,000, 12-Month Amortization, ₹26,000 wallet balance |
| **Clean-Slate Borrower** | Dr. Arvind Rao | `arvind@gmail.com` | `Arvind123` | ₹15,000 wallet balance, 0 active loans, pre-verified Aadhaar |
| **System Administrator** | System Administrator | `admin@gov.in` | `Admin123` | Loan Officer Console: Underwrite loans, inspect borrower directory, institutional ledger |

### User Experience & Authentication Features:
1. **Homepage with Quick Persona Sign In:** Unauthenticated visitors land directly on the Homepage featuring 3 one-click persona cards that pre-fill credentials for fast sign in.
2. **Instant Re-Prompt on Sign Out:** Signing out automatically returns to the Homepage and opens the sign-in modal.
3. **Role-Based Views:**
   * **Borrowers** access self-service dashboards, loan applications, EMI repayment buttons, wallet management, and their personal ledger.
   * **System Administrators** access the **Officer Console**, complete with approval/rejection workflows, borrower directory oversight, and institutional ledger audit.

---

## 7. How to Run MicroLend Locally

### Prerequisites
* **Node.js** (v18+)

### Step 1: Install Dependencies
```bash
# In the project root directory
npm install
npm --prefix client install
```

### Step 2: Start the System (One Command)
```bash
npm run dev
```
* **Frontend:** `http://localhost:3000`
* **Backend:** `http://localhost:5000`
* **PostgreSQL Engine:** Runs natively on port `5432` automatically on server launch.

---

## 8. Automated Testing & Verification

### 1. Verify User Logins (100% Accuracy Check):
```bash
node server/tests/test_logins.js
```
* Authenticates all 3 seeded user credentials (`priya@gmail.com`, `arvind@gmail.com`, `admin@gov.in`) against PostgreSQL bcrypt hashes.
* Verifies rejection of invalid passwords and non-existent users.

### 2. Run Concurrency Stress Test (Double-Spending Attack Simulation):
```bash
npm run test:concurrency
```
* Spawns parallel concurrent withdrawal requests against the same wallet.
* Proves that `SELECT ... FOR UPDATE` serializes the requests and eliminates race conditions.
* Spawns simultaneous duplicate EMI payments on the same installment and proves only 1 succeeds.

### 3. Run Comprehensive Backend Verification:
```bash
npm run test:verify
```
* Tests authentication, wallet deposit, withdrawal, ledger reconciliation, and trigger tamper defense.

---

## 9. Syllabus Demonstration Queries

A demonstration script is provided at [`sql/demo_queries.sql`](sql/demo_queries.sql) containing:
* Multi-table `JOIN` queries connecting relational entities.
* `GROUP BY` and aggregate functions (`SUM`, `AVG`, `COUNT`, `MIN`, `MAX`).
* Explicit multi-step transaction blocks with `SELECT ... FOR UPDATE`.
* First-principles ledger summation query proving that $\text{Balance} = \sum \text{Credits} - \sum \text{Debits}$.
