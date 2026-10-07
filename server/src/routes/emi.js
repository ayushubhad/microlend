const express = require('express');
const { query, withTransaction } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { roundToTwoDecimals } = require('../services/financial');

const router = express.Router();

// POST /api/emi/:emiId/pay
router.post('/:emiId/pay', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  try {
    const { emiId } = req.params;

    const result = await withTransaction(async (client) => {
      const emiRes = await client.query(
        `SELECT e.emi_id, e.loan_id, e.emi_number, e.due_date, e.emi_amount, 
                e.principal_component, e.interest_component, e.payment_status,
                l.user_id, l.outstanding_balance, l.loan_status
         FROM emi_schedules e
         JOIN loan_accounts l ON e.loan_id = l.loan_id
         WHERE e.emi_id = $1
         FOR UPDATE OF e, l`,
        [emiId]
      );

      if (emiRes.rowCount === 0) {
        throw new Error('EMI installment not found');
      }

      const emi = emiRes.rows[0];

      if (req.user.role !== 'ADMIN' && req.user.userId !== emi.user_id) {
        throw new Error('Forbidden: You can only pay installments for your own loan');
      }

      if (emi.payment_status === 'PAID') {
        const err = new Error(`Installment #${emi.emi_number} has already been paid`);
        err.statusCode = 400;
        throw err;
      }

      const emiAmount = parseFloat(emi.emi_amount);
      const principalComp = parseFloat(emi.principal_component);

      const walletRes = await client.query(
        `SELECT wallet_id, current_balance 
         FROM wallets 
         WHERE user_id = $1 
         FOR UPDATE`,
        [emi.user_id]
      );

      if (walletRes.rowCount === 0) {
        throw new Error('Borrower wallet not found');
      }

      const wallet = walletRes.rows[0];
      const walletBalance = parseFloat(wallet.current_balance);

      if (walletBalance < emiAmount) {
        const error = new Error(`Insufficient wallet balance: Available INR ${walletBalance.toFixed(2)}, required INR ${emiAmount.toFixed(2)}`);
        error.statusCode = 400;
        throw error;
      }

      const newWalletBalance = roundToTwoDecimals(walletBalance - emiAmount);
      const currentOutstanding = parseFloat(emi.outstanding_balance);
      const newOutstanding = Math.max(0.00, roundToTwoDecimals(currentOutstanding - principalComp));

      await client.query(
        `UPDATE wallets SET current_balance = $1, last_updated = CURRENT_TIMESTAMP WHERE wallet_id = $2`,
        [newWalletBalance, wallet.wallet_id]
      );

      await client.query(
        `UPDATE emi_schedules 
         SET payment_status = 'PAID', amount_paid = $1, paid_date = CURRENT_TIMESTAMP 
         WHERE emi_id = $2`,
        [emiAmount, emi.emi_id]
      );

      let isLoanClosed = false;
      if (newOutstanding <= 0.00) {
        const pendingCountRes = await client.query(
          `SELECT COUNT(*) FROM emi_schedules WHERE loan_id = $1 AND payment_status != 'PAID' AND emi_id != $2`,
          [emi.loan_id, emi.emi_id]
        );
        if (parseInt(pendingCountRes.rows[0].count, 10) === 0) {
          isLoanClosed = true;
        }
      }

      await client.query(
        `UPDATE loan_accounts 
         SET outstanding_balance = $1,
             loan_status = CASE WHEN $2 = true THEN 'CLOSED' ELSE loan_status END
         WHERE loan_id = $3`,
        [newOutstanding, isLoanClosed, emi.loan_id]
      );

      const referenceNo = `TXN-EMI-${emi.emi_number}-${Date.now()}`;
      const remarks = `EMI payment installment #${emi.emi_number} (Principal: INR ${principalComp.toFixed(2)}, Interest: INR ${parseFloat(emi.interest_component).toFixed(2)})`;

      await client.query(
        `INSERT INTO transaction_ledger 
         (user_id, wallet_id, loan_id, transaction_type, amount, balance_after_transaction, reference_no, remarks)
         VALUES ($1, $2, $3, 'EMI_PAYMENT', $4, $5, $6, $7)`,
        [emi.user_id, wallet.wallet_id, emi.loan_id, emiAmount, newWalletBalance, referenceNo, remarks]
      );

      return {
        emiId: emi.emi_id,
        loanId: emi.loan_id,
        installmentNumber: emi.emi_number,
        amountPaid: emiAmount,
        newWalletBalance,
        newOutstandingBalance: newOutstanding,
        loanClosed: isLoanClosed,
        referenceNo
      };
    });

    const latency = Date.now() - startTime;

    res.json({
      success: true,
      message: `EMI Installment #${result.installmentNumber} successfully paid!`,
      data: result,
      oltp: {
        lockType: 'MULTI_ROW_EXCLUSIVE (emi_schedules, loan_accounts, wallets)',
        isolation: 'READ COMMITTED',
        latencyMs: latency
      }
    });
  } catch (err) {
    console.error('EMI Payment Error:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// GET /api/emi/upcoming
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const upcomingRes = await query(
      `SELECT e.emi_id, e.loan_id, e.emi_number, e.due_date, e.emi_amount, 
              e.principal_component, e.interest_component, e.payment_status,
              p.product_name, l.outstanding_balance
       FROM emi_schedules e
       JOIN loan_accounts l ON e.loan_id = l.loan_id
       JOIN loan_products p ON l.product_id = p.product_id
       WHERE l.user_id = $1 AND e.payment_status = 'PENDING'
       ORDER BY e.due_date ASC
       LIMIT 5`,
      [req.user.userId]
    );

    const formatted = upcomingRes.rows.map(e => ({
      emiId: e.emi_id,
      loanId: e.loan_id,
      productName: e.product_name,
      installmentNumber: e.emi_number,
      dueDate: e.due_date,
      emiAmount: parseFloat(e.emi_amount),
      principalComponent: parseFloat(e.principal_component),
      interestComponent: parseFloat(e.interest_component),
      paymentStatus: e.payment_status
    }));

    res.json({ success: true, upcomingEmis: formatted });
  } catch (err) {
    console.error('Fetch Upcoming EMIs Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch upcoming EMIs' });
  }
});

module.exports = router;
