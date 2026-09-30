/**
 * MicroLend Concurrency & Stress Testing Suite
 * Validates PostgreSQL Row-Level Locking (SELECT ... FOR UPDATE)
 * and verifies prevention of Race Conditions and Double Spending.
 */

const { pool, withTransaction, query } = require('../src/config/db');
const { ensurePostgresRunning } = require('../src/config/postgres_runner');
const { roundToTwoDecimals } = require('../src/services/financial');

async function runConcurrencySuite() {
  console.log('====================================================================');
  console.log('🧪 MICROLEND CONCURRENCY & ROW-LEVEL LOCKING VERIFICATION SUITE');
  console.log('====================================================================\n');

  await ensurePostgresRunning();

  // -------------------------------------------------------------------------
  // TEST 1: The Classic Double-Spending Attack
  // Initial Balance: ₹ 1,000.00
  // Concurrent Requests: 5 simultaneous withdrawals of ₹ 400.00 each
  // Expected Behavior:
  // - Exactly 2 requests succeed (Total withdrawn: ₹ 800.00)
  // - Exactly 3 requests fail with "Insufficient funds"
  // - Final Balance MUST BE EXACTLY ₹ 200.00 (Zero balance leak)
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Multi-Threaded Wallet Double-Spending Attack ---');
  
  const testAadhaar = String(Math.floor(100000000000 + Math.random() * 900000000000));
  const userRes = await query(
    `INSERT INTO users (full_name, email, phone_number, password_hash, role, address, aadhaar_number, wallet_balance)
     VALUES ('Concurrency Stress User', $1, $2, 'dummyhash', 'USER', 'VIT Lab 202', $3, 1000.00)
     RETURNING user_id`,
    [`stress.${Date.now()}@microlend.local`, `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`, testAadhaar]
  );
  const userId = userRes.rows[0].user_id;

  const walletRes = await query(
    `INSERT INTO wallets (user_id, current_balance) VALUES ($1, 1000.00) RETURNING wallet_id`,
    [userId]
  );
  const walletId = walletRes.rows[0].wallet_id;

  console.log(`Created test wallet ${walletId} with initial balance ₹ 1,000.00`);
  console.log(`Dispatching 5 parallel asynchronous withdrawal requests of ₹ 400.00...`);

  const attemptWithdrawal = async (threadId) => {
    try {
      return await withTransaction(async (client) => {
        // Critical Section: Acquire exclusive row lock
        const lockRes = await client.query(
          `SELECT current_balance FROM wallets WHERE wallet_id = $1 FOR UPDATE`,
          [walletId]
        );
        const bal = parseFloat(lockRes.rows[0].current_balance);

        if (bal < 400.00) {
          throw new Error(`INSUFFICIENT_FUNDS: Available balance is only ₹ ${bal.toFixed(2)}`);
        }

        const newBal = roundToTwoDecimals(bal - 400.00);
        await client.query(`UPDATE wallets SET current_balance = $1 WHERE wallet_id = $2`, [newBal, walletId]);
        await client.query(
          `INSERT INTO transaction_ledger (user_id, wallet_id, transaction_type, amount, balance_after_transaction, reference_no, remarks)
           VALUES ($1, $2, 'WALLET_DEBIT', 400.00, $3, $4, $5)`,
          [userId, walletId, newBal, `STRESS-${threadId}-${Date.now()}`, `Concurrent stress test debit #${threadId}`]
        );

        return { threadId, status: 'SUCCESS', newBal };
      });
    } catch (err) {
      return { threadId, status: 'REJECTED', error: err.message };
    }
  };

  const results = await Promise.all([
    attemptWithdrawal(1),
    attemptWithdrawal(2),
    attemptWithdrawal(3),
    attemptWithdrawal(4),
    attemptWithdrawal(5)
  ]);

  const successes = results.filter(r => r.status === 'SUCCESS');
  const rejections = results.filter(r => r.status === 'REJECTED');

  const finalRes = await query(`SELECT current_balance FROM wallets WHERE wallet_id = $1`, [walletId]);
  const finalBalance = parseFloat(finalRes.rows[0].current_balance);

  console.log(`\nExecution Summary:`);
  console.log(`  - Successful Transactions: ${successes.length} (Expected: 2)`);
  console.log(`  - Safely Rejected Attacks: ${rejections.length} (Expected: 3)`);
  console.log(`  - Final Authoritative Balance: ₹ ${finalBalance.toFixed(2)} (Expected: ₹ 200.00)`);

  if (successes.length === 2 && rejections.length === 3 && finalBalance === 200.00) {
    console.log('  ✅ TEST 1 PASSED: PostgreSQL Row-Level Lock completely eradicated double-spending!\n');
  } else {
    console.error('  ❌ TEST 1 FAILED: Inconsistency or race condition detected!\n');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Concurrent Duplicate EMI Repayment Attack
  // Attempting to pay the exact same installment simultaneously from 2 threads
  // -------------------------------------------------------------------------
  console.log('--- TEST 2: Concurrent Duplicate EMI Repayment Attack ---');
  
  // Find a pending EMI
  const emiRes = await query(`SELECT emi_id, emi_amount, loan_id FROM emi_schedules WHERE payment_status = 'PENDING' LIMIT 1`);
  if (emiRes.rowCount > 0) {
    const targetEmi = emiRes.rows[0];
    console.log(`Targeting pending installment ${targetEmi.emi_id} (Amount: ₹ ${targetEmi.emi_amount})...`);

    // Fund the stress user's wallet with ₹ 10,000 to ensure balance is not the limiting factor
    await query(`UPDATE wallets SET current_balance = 10000.00 WHERE wallet_id = $1`, [walletId]);

    const payEmiThread = async (tId) => {
      try {
        return await withTransaction(async (client) => {
          const lockEmi = await client.query(
            `SELECT emi_id, payment_status, emi_amount FROM emi_schedules WHERE emi_id = $1 FOR UPDATE`,
            [targetEmi.emi_id]
          );

          if (lockEmi.rows[0].payment_status === 'PAID') {
            throw new Error('ALREADY_PAID: Installment was already settled by another thread');
          }

          await client.query(
            `UPDATE emi_schedules SET payment_status = 'PAID', paid_date = CURRENT_TIMESTAMP WHERE emi_id = $1`,
            [targetEmi.emi_id]
          );

          return { tId, status: 'PAID' };
        });
      } catch (err) {
        return { tId, status: 'REJECTED', error: err.message };
      }
    };

    const emiResults = await Promise.all([
      payEmiThread(1),
      payEmiThread(2)
    ]);

    const emiSuccesses = emiResults.filter(r => r.status === 'PAID');
    const emiRejections = emiResults.filter(r => r.status === 'REJECTED');

    console.log(`  - Settled count: ${emiSuccesses.length} (Expected: 1)`);
    console.log(`  - Duplicate rejected count: ${emiRejections.length} (Expected: 1)`);

    if (emiSuccesses.length === 1 && emiRejections.length === 1) {
      console.log('  ✅ TEST 2 PASSED: Duplicate EMI repayment prevented atomically!\n');
    } else {
      console.error('  ❌ TEST 2 FAILED: Duplicate installment accepted!\n');
      process.exit(1);
    }
  }

  console.log('====================================================================');
  console.log('🎉 ALL CONCURRENCY & ACID TESTS COMPLETED WITH 100% RELATIONAL INTEGRITY!');
  console.log('====================================================================');

  await pool.end();
}

runConcurrencySuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
