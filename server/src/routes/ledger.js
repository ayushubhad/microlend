const express = require('express');
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/ledger/my-history
router.get('/my-history', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    let queryText = `
      SELECT t.transaction_id, t.user_id, u.full_name as user_name, u.email as user_email,
             t.wallet_id, t.loan_id, t.transaction_type, 
             t.amount, t.balance_after_transaction, t.transaction_date, 
             t.reference_no, t.remarks,
             p.product_name
      FROM transaction_ledger t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN loan_accounts l ON t.loan_id = l.loan_id
      LEFT JOIN loan_products p ON l.product_id = p.product_id
    `;
    const params = [];
    if (!isAdmin) {
      queryText += ` WHERE t.user_id = $1`;
      params.push(req.user.userId);
    }
    queryText += ` ORDER BY t.transaction_date DESC`;

    const ledgerRes = await query(queryText, params);

    const transactions = ledgerRes.rows.map(t => ({
      transactionId: t.transaction_id,
      userId: t.user_id,
      userName: t.user_name,
      userEmail: t.user_email,
      transactionType: t.transaction_type,
      amount: parseFloat(t.amount),
      balanceAfter: parseFloat(t.balance_after_transaction),
      transactionDate: t.transaction_date,
      referenceNo: t.reference_no,
      remarks: t.remarks,
      productName: t.product_name || null
    }));

    res.json({ success: true, count: transactions.length, transactions });
  } catch (err) {
    console.error('Fetch Ledger Error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve transaction history' });
  }
});

// GET /api/ledger/all
router.get('/all', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const ledgerRes = await query(
      `SELECT t.transaction_id, t.user_id, u.full_name as user_name, u.email as user_email,
              t.wallet_id, t.loan_id, t.transaction_type, 
              t.amount, t.balance_after_transaction, t.transaction_date, 
              t.reference_no, t.remarks,
              p.product_name
       FROM transaction_ledger t
       JOIN users u ON t.user_id = u.user_id
       LEFT JOIN loan_accounts l ON t.loan_id = l.loan_id
       LEFT JOIN loan_products p ON l.product_id = p.product_id
       ORDER BY t.transaction_date DESC`
    );

    const transactions = ledgerRes.rows.map(t => ({
      transactionId: t.transaction_id,
      userId: t.user_id,
      userName: t.user_name,
      userEmail: t.user_email,
      transactionType: t.transaction_type,
      amount: parseFloat(t.amount),
      balanceAfter: parseFloat(t.balance_after_transaction),
      transactionDate: t.transaction_date,
      referenceNo: t.reference_no,
      remarks: t.remarks,
      productName: t.product_name || null
    }));

    res.json({ success: true, count: transactions.length, transactions });
  } catch (err) {
    console.error('Fetch All Ledger Error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve institutional ledger' });
  }
});

// GET /api/ledger/audit
router.get('/audit', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT t.transaction_id, t.user_id, u.full_name, u.email, t.wallet_id, 
             t.loan_id, t.transaction_type, t.amount, t.balance_after_transaction, 
             t.transaction_date, t.reference_no, t.remarks
      FROM transaction_ledger t
      JOIN users u ON t.user_id = u.user_id
    `;
    const params = [];

    if (type) {
      params.push(type);
      queryText += ` WHERE t.transaction_type = $${params.length}`;
    }

    queryText += ` ORDER BY t.transaction_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const auditRes = await query(queryText, params);

    const formatted = auditRes.rows.map(r => ({
      transactionId: r.transaction_id,
      userId: r.user_id,
      userName: r.full_name,
      userEmail: r.email,
      transactionType: r.transaction_type,
      amount: parseFloat(r.amount),
      balanceAfter: parseFloat(r.balance_after_transaction),
      transactionDate: r.transaction_date,
      referenceNo: r.reference_no,
      remarks: r.remarks
    }));

    res.json({ success: true, count: formatted.length, auditLog: formatted });
  } catch (err) {
    console.error('Audit Ledger Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ledger/reconciliation
router.get('/reconciliation', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.user.role === 'ADMIN' && req.query.userId ? req.query.userId : req.user.userId;

    const reconRes = await query(
      `SELECT 
         w.current_balance as stored_wallet_balance,
         COALESCE(SUM(CASE 
           WHEN t.transaction_type IN ('WALLET_CREDIT', 'LOAN_DISBURSEMENT', 'REFUND') THEN t.amount
           WHEN t.transaction_type IN ('WALLET_DEBIT', 'EMI_PAYMENT', 'PENALTY') THEN -t.amount
           ELSE 0 
         END), 0.00) as computed_ledger_balance,
         COUNT(t.transaction_id) as total_ledger_entries
       FROM wallets w
       LEFT JOIN transaction_ledger t ON w.wallet_id = t.wallet_id
       WHERE w.user_id = $1
       GROUP BY w.wallet_id, w.current_balance`,
      [targetUserId]
    );

    if (reconRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    const row = reconRes.rows[0];
    const stored = parseFloat(row.stored_wallet_balance);
    const computed = parseFloat(row.computed_ledger_balance);
    const difference = Math.abs(stored - computed);
    const isReconciled = difference < 0.001;

    res.json({
      success: true,
      reconciliation: {
        storedWalletBalance: stored,
        computedLedgerBalance: computed,
        difference,
        isReconciled,
        totalTransactionsAudited: parseInt(row.total_ledger_entries, 10),
        status: isReconciled ? 'PERFECT_INTEGRITY' : 'DISCREPANCY_DETECTED',
        auditStandard: 'ACID Conservative Ledger Summation'
      }
    });
  } catch (err) {
    console.error('Reconciliation Error:', err);
    res.status(500).json({ success: false, error: 'Reconciliation calculation failed' });
  }
});

module.exports = router;
