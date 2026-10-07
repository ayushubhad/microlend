const express = require('express');
const { query, withTransaction } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { roundToTwoDecimals } = require('../services/financial');

const router = express.Router();

/**
 * GET /api/wallet
 * Fetches the authenticated user's current verified balance from PostgreSQL.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const walletRes = await query(
      `SELECT wallet_id, user_id, current_balance, created_at, last_updated 
       FROM wallets 
       WHERE user_id = $1`,
      [req.user.userId]
    );

    if (walletRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Wallet not found for this account' });
    }

    const wallet = walletRes.rows[0];
    res.json({
      success: true,
      wallet: {
        walletId: wallet.wallet_id,
        currentBalance: parseFloat(wallet.current_balance),
        lastUpdated: wallet.last_updated,
        createdAt: wallet.created_at
      }
    });
  } catch (err) {
    console.error('Fetch Wallet Error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve wallet information' });
  }
});

/**
 * POST /api/wallet/credit
 * Atomically adds funds to the user's wallet with PostgreSQL row-level locking (FOR UPDATE)
 * and appends a verified record to the immutable transaction ledger.
 */
router.post('/credit', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  try {
    if (req.user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Administrative loan officers cannot conduct personal wallet transactions.'
      });
    }

    const amount = parseFloat(req.body.amount);
    const rawRemarks = req.body.remarks || 'Digital wallet deposit';
    const remarks = String(rawRemarks).replace(/₹/g, 'INR ').replace(/[^\x00-\x7F]/g, '');

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Deposit amount must be a positive decimal number greater than 0.00'
      });
    }

    const referenceNo = `TXN-CRD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await withTransaction(async (client) => {
      // 1. Acquire EXCLUSIVE ROW-LEVEL LOCK on the wallet row
      const lockRes = await client.query(
        `SELECT wallet_id, current_balance 
         FROM wallets 
         WHERE user_id = $1 
         FOR UPDATE`,
        [req.user.userId]
      );

      if (lockRes.rowCount === 0) {
        throw new Error('Wallet not found');
      }

      const wallet = lockRes.rows[0];
      const previousBalance = parseFloat(wallet.current_balance);
      const newBalance = roundToTwoDecimals(previousBalance + amount);

      // 2. Update wallet balance
      await client.query(
        `UPDATE wallets 
         SET current_balance = $1, last_updated = CURRENT_TIMESTAMP 
         WHERE wallet_id = $2`,
        [newBalance, wallet.wallet_id]
      );

      // 3. Append to immutable transaction ledger
      const ledgerRes = await client.query(
        `INSERT INTO transaction_ledger 
         (user_id, wallet_id, loan_id, transaction_type, amount, balance_after_transaction, reference_no, remarks)
         VALUES ($1, $2, NULL, 'WALLET_CREDIT', $3, $4, $5, $6)
         RETURNING transaction_id, transaction_date`,
        [req.user.userId, wallet.wallet_id, amount, newBalance, referenceNo, remarks]
      );

      return {
        walletId: wallet.wallet_id,
        previousBalance,
        newBalance,
        transactionId: ledgerRes.rows[0].transaction_id,
        transactionDate: ledgerRes.rows[0].transaction_date,
        referenceNo
      };
    });

    const latency = Date.now() - startTime;

    res.json({
      success: true,
      message: `Successfully credited INR ${amount.toFixed(2)} to wallet`,
      data: result,
      oltp: {
        lockType: 'ROW_EXCLUSIVE (SELECT ... FOR UPDATE)',
        isolation: 'READ COMMITTED',
        latencyMs: latency
      }
    });
  } catch (err) {
    console.error('Wallet Credit Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/wallet/debit
 * Atomically withdraws funds from the wallet.
 * Enforces PostgreSQL row-level locking and prevents balance from going negative.
 */
router.post('/debit', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  try {
    if (req.user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Administrative loan officers cannot conduct personal wallet transactions.'
      });
    }

    const amount = parseFloat(req.body.amount);
    const rawRemarks = req.body.remarks || 'Digital wallet withdrawal';
    const remarks = String(rawRemarks).replace(/₹/g, 'INR ').replace(/[^\x00-\x7F]/g, '');

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Withdrawal amount must be a positive decimal number greater than 0.00'
      });
    }

    const referenceNo = `TXN-WDR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await withTransaction(async (client) => {
      // 1. Acquire EXCLUSIVE ROW LOCK
      const lockRes = await client.query(
        `SELECT wallet_id, current_balance 
         FROM wallets 
         WHERE user_id = $1 
         FOR UPDATE`,
        [req.user.userId]
      );

      if (lockRes.rowCount === 0) {
        throw new Error('Wallet not found');
      }

      const wallet = lockRes.rows[0];
      const currentBalance = parseFloat(wallet.current_balance);

      // 2. Check sufficient balance inside the lock
      if (currentBalance < amount) {
        const error = new Error(`Insufficient funds: Available balance is INR ${currentBalance.toFixed(2)}, required INR ${amount.toFixed(2)}`);
        error.statusCode = 400;
        throw error;
      }

      const newBalance = roundToTwoDecimals(currentBalance - amount);

      // 3. Update wallet balance
      await client.query(
        `UPDATE wallets 
         SET current_balance = $1, last_updated = CURRENT_TIMESTAMP 
         WHERE wallet_id = $2`,
        [newBalance, wallet.wallet_id]
      );

      // 4. Append to transaction ledger
      const ledgerRes = await client.query(
        `INSERT INTO transaction_ledger 
         (user_id, wallet_id, loan_id, transaction_type, amount, balance_after_transaction, reference_no, remarks)
         VALUES ($1, $2, NULL, 'WALLET_DEBIT', $3, $4, $5, $6)
         RETURNING transaction_id, transaction_date`,
        [req.user.userId, wallet.wallet_id, amount, newBalance, referenceNo, remarks]
      );

      return {
        walletId: wallet.wallet_id,
        previousBalance: currentBalance,
        newBalance,
        transactionId: ledgerRes.rows[0].transaction_id,
        transactionDate: ledgerRes.rows[0].transaction_date,
        referenceNo
      };
    });

    const latency = Date.now() - startTime;

    res.json({
      success: true,
      message: `Successfully withdrawn INR ${amount.toFixed(2)} from wallet`,
      data: result,
      oltp: {
        lockType: 'ROW_EXCLUSIVE (SELECT ... FOR UPDATE)',
        isolation: 'READ COMMITTED',
        latencyMs: latency
      }
    });
  } catch (err) {
    console.error('Wallet Debit Error:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

module.exports = router;
