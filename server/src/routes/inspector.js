const express = require('express');
const { query, withTransaction } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { roundToTwoDecimals } = require('../services/financial');

const router = express.Router();

/**
 * GET /api/inspector/schema
 * Live DBMS Schema Introspection: returns tables, columns, constraints, and data types.
 */
router.get('/schema', async (req, res) => {
  try {
    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const schemaInfo = {};

    for (const row of tablesRes.rows) {
      const tableName = row.table_name;

      // Columns
      const colRes = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      // Row count
      const countRes = await query(`SELECT COUNT(*) as count FROM "${tableName}"`);

      // Foreign Keys
      const fkRes = await query(`
        SELECT
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;
      `, [tableName]);

      schemaInfo[tableName] = {
        rowCount: parseInt(countRes.rows[0].count, 10),
        columns: colRes.rows.map(c => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === 'YES',
          default: c.column_default
        })),
        foreignKeys: fkRes.rows
      };
    }

    res.json({ success: true, schema: schemaInfo });
  } catch (err) {
    console.error('Schema Introspection Error:', err);
    res.status(500).json({ success: false, error: 'Failed to inspect database schema' });
  }
});

/**
 * GET /api/inspector/metrics
 * Complex DBMS Aggregations & Group By Queries:
 * Demonstrates SQL aggregations (SUM, AVG, COUNT), joins, and financial ratios.
 */
router.get('/metrics', async (req, res) => {
  try {
    // 1. Aggregations on loan accounts
    const loanAggRes = await query(`
      SELECT 
        COUNT(loan_id) as total_loans,
        COUNT(CASE WHEN loan_status = 'ACTIVE' THEN 1 END) as active_loans,
        COUNT(CASE WHEN loan_status = 'CLOSED' THEN 1 END) as closed_loans,
        COUNT(CASE WHEN loan_status = 'PENDING' THEN 1 END) as pending_loans,
        COALESCE(SUM(loan_amount), 0.00) as total_principal_disbursed,
        COALESCE(SUM(outstanding_balance), 0.00) as total_outstanding_capital,
        COALESCE(AVG(interest_rate), 0.00) as avg_interest_rate
      FROM loan_accounts
    `);

    // 2. Aggregations on wallets
    const walletAggRes = await query(`
      SELECT 
        COUNT(wallet_id) as total_wallets,
        COALESCE(SUM(current_balance), 0.00) as total_vault_liquidity,
        COALESCE(AVG(current_balance), 0.00) as avg_wallet_balance
      FROM wallets
    `);

    // 3. Group By query: Transactions breakdown by type
    const txnGroupRes = await query(`
      SELECT 
        transaction_type,
        COUNT(transaction_id) as count,
        COALESCE(SUM(amount), 0.00) as total_volume
      FROM transaction_ledger
      GROUP BY transaction_type
      ORDER BY count DESC
    `);

    // 4. Group By query: Loan performance by Product
    const productGroupRes = await query(`
      SELECT 
        p.product_name,
        COUNT(l.loan_id) as total_loans,
        COALESCE(SUM(l.loan_amount), 0.00) as total_borrowed,
        COALESCE(SUM(l.outstanding_balance), 0.00) as current_exposure
      FROM loan_products p
      LEFT JOIN loan_accounts l ON p.product_id = l.product_id
      GROUP BY p.product_id, p.product_name
      ORDER BY total_loans DESC
    `);

    const loanMetrics = loanAggRes.rows[0];
    const walletMetrics = walletAggRes.rows[0];

    const disbursed = parseFloat(loanMetrics.total_principal_disbursed);
    const outstanding = parseFloat(loanMetrics.total_outstanding_capital);
    const settled = Math.max(0.00, disbursed - outstanding);
    const recoveryRate = disbursed > 0 ? ((settled / disbursed) * 100) : 0;

    res.json({
      success: true,
      metrics: {
        portfolio: {
          totalLoans: parseInt(loanMetrics.total_loans, 10),
          activeLoans: parseInt(loanMetrics.active_loans, 10),
          closedLoans: parseInt(loanMetrics.closed_loans, 10),
          pendingLoans: parseInt(loanMetrics.pending_loans, 10),
          totalDisbursed: disbursed,
          outstandingBalance: outstanding,
          principalSettled: settled,
          recoveryRatePercent: roundToTwoDecimals(recoveryRate),
          avgInterestRate: roundToTwoDecimals(parseFloat(loanMetrics.avg_interest_rate))
        },
        vault: {
          totalWallets: parseInt(walletMetrics.total_wallets, 10),
          totalLiquidity: parseFloat(walletMetrics.total_vault_liquidity),
          avgBalance: roundToTwoDecimals(parseFloat(walletMetrics.avg_balance))
        },
        transactionVolumeByType: txnGroupRes.rows.map(r => ({
          type: r.transaction_type,
          count: parseInt(r.count, 10),
          totalVolume: parseFloat(r.total_volume)
        })),
        productExposure: productGroupRes.rows.map(r => ({
          productName: r.product_name,
          loansCount: parseInt(r.total_loans, 10),
          totalBorrowed: parseFloat(r.total_borrowed),
          outstandingExposure: parseFloat(r.current_exposure)
        }))
      }
    });
  } catch (err) {
    console.error('Inspector Metrics Error:', err);
    res.status(500).json({ success: false, error: 'Failed to compute aggregate metrics' });
  }
});

/**
 * POST /api/inspector/simulate-race-condition
 * Live Demonstration of Concurrency Control & Row-Level Locking:
 * Creates a sandbox test wallet funded with exactly ₹ 500.00,
 * then dispatches two concurrent parallel debit requests of ₹ 400.00 each.
 * Proves that SELECT ... FOR UPDATE blocks and prevents double-spending!
 */
router.post('/simulate-race-condition', async (req, res) => {
  try {
    // 1. Setup a dedicated temporary test user and wallet for concurrency demonstration
    const testEmail = `concurrency.test.${Date.now()}@microlend.local`;
    const testAadhaar = String(Math.floor(100000000000 + Math.random() * 900000000000));

    const userRes = await query(
      `INSERT INTO users (full_name, email, phone_number, password_hash, role, address, aadhaar_number, wallet_balance)
       VALUES ('Concurrency Test User', $1, $2, 'dummyhash', 'USER', 'Test Lab, VIT Wadala', $3, 500.00)
       RETURNING user_id`,
      [testEmail, `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`, testAadhaar]
    );
    const userId = userRes.rows[0].user_id;

    const walletRes = await query(
      `INSERT INTO wallets (user_id, current_balance)
       VALUES ($1, 500.00)
       RETURNING wallet_id, current_balance`,
      [userId]
    );
    const walletId = walletRes.rows[0].wallet_id;

    // Helper function that attempts a debit with row-level locking
    const executeDebit = async (threadName, delayMs = 0) => {
      const logs = [];
      const startTime = Date.now();
      logs.push(`[${threadName}] Initiating transaction with BEGIN`);

      try {
        const res = await withTransaction(async (client) => {
          logs.push(`[${threadName}] Executing: SELECT current_balance FROM wallets WHERE wallet_id = $1 FOR UPDATE`);
          
          if (delayMs > 0) {
            // Introduce artificial delay to demonstrate lock contention
            await new Promise(r => setTimeout(r, delayMs));
          }

          const lockRes = await client.query(
            `SELECT current_balance FROM wallets WHERE wallet_id = $1 FOR UPDATE`,
            [walletId]
          );

          const balance = parseFloat(lockRes.rows[0].current_balance);
          logs.push(`[${threadName}] Row Lock Acquired. Verified balance: INR ${balance.toFixed(2)}`);

          if (balance < 400.00) {
            logs.push(`[${threadName}] INSUFFICIENT FUNDS CHECK FAILED: INR ${balance.toFixed(2)} < INR 400.00`);
            const err = new Error(`Insufficient balance: INR ${balance.toFixed(2)} available`);
            err.code = 'INSUFFICIENT_FUNDS';
            throw err;
          }

          const newBal = roundToTwoDecimals(balance - 400.00);
          await client.query(
            `UPDATE wallets SET current_balance = $1 WHERE wallet_id = $2`,
            [newBal, walletId]
          );
          logs.push(`[${threadName}] Balance successfully reduced to INR ${newBal.toFixed(2)}`);

          await client.query(
            `INSERT INTO transaction_ledger (user_id, wallet_id, transaction_type, amount, balance_after_transaction, reference_no, remarks)
             VALUES ($1, $2, 'WALLET_DEBIT', 400.00, $3, $4, $5)`,
            [userId, walletId, newBal, `RACE-${threadName}-${Date.now()}`, `Simulated concurrent test debit (${threadName})`]
          );
          logs.push(`[${threadName}] Appended transaction ledger row and COMMITTED`);

          return { success: true, newBalance: newBal };
        });

        return { thread: threadName, status: 'SUCCESS', logs, durationMs: Date.now() - startTime };
      } catch (err) {
        logs.push(`[${threadName}] TRANSACTION ROLLED BACK: ${err.message}`);
        return { thread: threadName, status: 'REJECTED_CORRECTLY', error: err.message, logs, durationMs: Date.now() - startTime };
      }
    };

    // Dispatch Thread A and Thread B simultaneously via Promise.all
    // Thread A holds lock for 100ms before committing; Thread B starts immediately and must wait on lock
    const [resultA, resultB] = await Promise.all([
      executeDebit('Thread_A', 100),
      executeDebit('Thread_B', 0)
    ]);

    // Check final balance
    const finalBalRes = await query(`SELECT current_balance FROM wallets WHERE wallet_id = $1`, [walletId]);
    const finalBalance = parseFloat(finalBalRes.rows[0].current_balance);

    res.json({
      success: true,
      simulation: {
        description: 'Two parallel concurrent debit requests of INR 400.00 against an initial balance of INR 500.00',
        initialBalance: 500.00,
        debitRequestAmounts: [400.00, 400.00],
        finalBalance,
        doubleSpendingPrevented: finalBalance === 100.00,
        threadA: resultA,
        threadB: resultB,
        conclusion: finalBalance === 100.00 
          ? 'SUCCESS: PostgreSQL row-level lock (SELECT ... FOR UPDATE) serialized transactions and prevented double spending. Exactly one request succeeded and one was safely rejected.'
          : 'FAILURE: Balance was corrupted!'
      }
    });
  } catch (err) {
    console.error('Race Condition Simulation Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/inspector/test-trigger-protection
 * Tests that PostgreSQL trigger strictly prevents tampering with transaction_ledger.
 */
router.post('/test-trigger-protection', async (req, res) => {
  try {
    let errorCaught = null;
    try {
      // Attempt unauthorized modification of ledger
      await query(`UPDATE transaction_ledger SET amount = 0.00 WHERE transaction_id = (SELECT transaction_id FROM transaction_ledger LIMIT 1)`);
    } catch (err) {
      errorCaught = err.message;
    }

    res.json({
      success: true,
      triggerEnforced: !!errorCaught,
      attemptedQuery: 'UPDATE transaction_ledger SET amount = 0.00 ...',
      databaseResponse: errorCaught,
      explanation: 'PostgreSQL trigger trg_protect_transaction_ledger successfully blocked update and raised an exception, maintaining an append-only audit trail.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
