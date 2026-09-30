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

* **Frontend:** React 19 + Vite + Tailwind CSS (Styled using the *Transactional Trust Engine* design system from Google Stitch).
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
1. **`users`:** Borrower identity, hashed credentials, contact information, and unique Aadhaar identification.
2. **`wallets`:** Authoritative digital wallet storing verified cash balances (`current_balance`), exclusively locked during operations.
3. **`loan_products`:** Institutional catalog defining interest rates (APR %), tenures (months), processing fees, and principal boundaries.
4. **`loan_accounts`:** Legally binding loan contracts instantiated between a user and a product, tracking outstanding balances.
5. **`emi_schedules`:** Detailed installment schedules with Principal and Interest splits per installment.
6. **`transaction_ledger`:** Immutable, append-only financial audit log with pre- and post-transaction balances.

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
SELECT current_balance FROM wallets WHERE user_id = $1 FOR UPDATE;
-- Thread B blocks and waits until Thread A commits or rolls back
UPDATE wallets SET current_balance = current_balance - $amount WHERE user_id = $1;
INSERT INTO transaction_ledger (...) VALUES (...);
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
* **Final Month Adjustment:** On month $n$, $P_n$ is set to remaining balance so ending balance reaches exactly **$0.00**.

---

## 6. Pre-Configured Demo Accounts

For immediate evaluation and live demonstration:

| Role | Name | Email | Password | Pre-Configured State |
| :--- | :--- | :--- | :--- | :--- |
| **Active Borrower** | Priya Sharma | `priya.sharma@example.com` | `Password@123` | Active Loan of ₹45,000, 3 EMIs paid, ₹24,500 wallet balance |
| **System Admin** | Admin | `admin@microlend.org` | `AdminPassword@123` | System oversight, product management, audit ledger |
| **New Borrower** | Dr. Arvind Rao | `arvind.rao@example.com` | `Password@123` | ₹15,000 wallet balance, eligible to apply |

*(You can switch between these personas instantly using the header dropdown in the top right corner!)*

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
* **PostgreSQL:** Native engine runs automatically on port `5432` with zero manual configuration.

---

## 8. Automated Testing & Academic Verification

### Run Concurrency Stress Test (Double-Spending Attack Simulation):
```bash
npm run test:concurrency
```
* Spawns 5 parallel concurrent withdrawal requests of ₹400 from a ₹1,000 wallet.
* Proves that `SELECT ... FOR UPDATE` serializes the requests: exactly 2 succeed, 3 are safely rejected, and final balance is exactly ₹200.00.
* Spawns simultaneous duplicate EMI payments on the same installment and proves only 1 succeeds.

### Run Comprehensive Backend Verification:
```bash
npm run test:verify
```
* Tests authentication, wallet deposit, withdrawal, ledger reconciliation, and trigger tamper defense.

---

## 9. Syllabus Demonstration Queries

A dedicated demonstration script is provided at [`sql/demo_queries.sql`](file:///c:/Users/ASUS/my%20codes/dbms/sql/demo_queries.sql) containing:
* Multi-table `JOIN` queries connecting 5 relational entities.
* `GROUP BY` and aggregate functions (`SUM`, `AVG`, `COUNT`, `MIN`, `MAX`).
* Explicit multi-step transaction blocks with `SELECT ... FOR UPDATE`.
* First-principles ledger summation query proving that $\text{Balance} = \sum \text{Credits} - \sum \text{Debits}$.
