const express = require('express');
const { query, withTransaction } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { calculateEMI, generateAmortizationSchedule, roundToTwoDecimals } = require('../services/financial');

const router = express.Router();

// POST /api/loans/apply
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Administrative loan officers cannot apply for personal micro-loans.'
      });
    }

    const { product_id, loan_amount } = req.body;
    const amount = parseFloat(loan_amount);

    if (!product_id || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Product ID and a valid loan amount are required' });
    }

    const productRes = await query(
      `SELECT product_id, product_name, interest_rate, loan_term_months, processing_fee, min_loan_amount, max_loan_amount
       FROM loan_products 
       WHERE product_id = $1`,
      [product_id]
    );

    if (productRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Selected loan product not found' });
    }

    const product = productRes.rows[0];
    const minAmt = parseFloat(product.min_loan_amount);
    const maxAmt = parseFloat(product.max_loan_amount);
    const rate = parseFloat(product.interest_rate);
    const term = product.loan_term_months;

    if (amount < minAmt || amount > maxAmt) {
      return res.status(400).json({
        success: false,
        error: `Loan amount must be between INR ${minAmt.toFixed(2)} and INR ${maxAmt.toFixed(2)} for ${product.product_name}`
      });
    }

    const { emi, totalPayable } = calculateEMI(amount, rate, term);

    const insertRes = await query(
      `INSERT INTO loan_accounts 
       (user_id, product_id, loan_amount, interest_rate, emi_amount, total_payable, outstanding_balance, loan_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
       RETURNING loan_id, user_id, product_id, loan_amount, interest_rate, emi_amount, total_payable, outstanding_balance, loan_status, created_at`,
      [req.user.userId, product.product_id, amount, rate, emi, totalPayable, amount]
    );

    const loan = insertRes.rows[0];

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully and is pending approval',
      loan: {
        loanId: loan.loan_id,
        productName: product.product_name,
        loanAmount: parseFloat(loan.loan_amount),
        interestRate: parseFloat(loan.interest_rate),
        emiAmount: parseFloat(loan.emi_amount),
        totalPayable: parseFloat(loan.total_payable),
        loanStatus: loan.loan_status,
        createdAt: loan.created_at
      }
    });
  } catch (err) {
    console.error('Loan Apply Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/loans/pending
router.get('/pending', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const loansRes = await query(
      `SELECT l.loan_id, l.user_id, u.full_name as borrower_name, u.email as borrower_email, u.phone_number as borrower_phone,
              p.product_id, p.product_name, p.loan_term_months, p.processing_fee,
              l.loan_amount, l.interest_rate, l.emi_amount, l.total_payable, l.created_at
       FROM loan_accounts l
       JOIN users u ON l.user_id = u.user_id
       JOIN loan_products p ON l.product_id = p.product_id
       WHERE l.loan_status = 'PENDING'
       ORDER BY l.created_at DESC`
    );

    const formatted = loansRes.rows.map(l => ({
      loanId: l.loan_id,
      borrowerId: l.user_id,
      borrowerName: l.borrower_name,
      borrowerEmail: l.borrower_email,
      borrowerPhone: l.borrower_phone,
      productId: l.product_id,
      productName: l.product_name,
      termMonths: l.loan_term_months,
      processingFee: parseFloat(l.processing_fee || '0.00'),
      loanAmount: parseFloat(l.loan_amount),
      interestRate: parseFloat(l.interest_rate),
      emiAmount: parseFloat(l.emi_amount),
      totalPayable: parseFloat(l.total_payable),
      createdAt: l.created_at
    }));

    res.json({ success: true, count: formatted.length, pendingLoans: formatted });
  } catch (err) {
    console.error('Fetch Pending Loans Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/loans/:id/approve
router.post('/:id/approve', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const loanId = req.params.id;

    const result = await withTransaction(async (client) => {
      const lockRes = await client.query(
        `SELECT loan_id, loan_status FROM loan_accounts WHERE loan_id = $1 FOR UPDATE`,
        [loanId]
      );

      if (lockRes.rowCount === 0) {
        throw new Error('Loan account not found');
      }

      if (lockRes.rows[0].loan_status !== 'PENDING') {
        throw new Error(`Cannot approve loan: Current status is '${lockRes.rows[0].loan_status}'`);
      }

      await client.query(
        `UPDATE loan_accounts SET loan_status = 'APPROVED' WHERE loan_id = $1`,
        [loanId]
      );

      return { loanId, status: 'APPROVED' };
    });

    res.json({ success: true, message: 'Loan approved successfully', data: result });
  } catch (err) {
    console.error('Loan Approval Error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/loans/:id/reject
router.post('/:id/reject', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const loanId = req.params.id;
    const { reason } = req.body;

    const result = await withTransaction(async (client) => {
      const lockRes = await client.query(
        `SELECT loan_id, loan_status FROM loan_accounts WHERE loan_id = $1 FOR UPDATE`,
        [loanId]
      );

      if (lockRes.rowCount === 0) {
        throw new Error('Loan account not found');
      }

      if (lockRes.rows[0].loan_status !== 'PENDING') {
        throw new Error(`Cannot reject loan: Current status is '${lockRes.rows[0].loan_status}'`);
      }

      await client.query(
        `UPDATE loan_accounts SET loan_status = 'REJECTED' WHERE loan_id = $1`,
        [loanId]
      );

      return { loanId, status: 'REJECTED', reason: reason || 'Application declined by Loan Officer' };
    });

    res.json({ success: true, message: 'Loan application rejected', data: result });
  } catch (err) {
    console.error('Loan Rejection Error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/loans/:id/disburse
router.post('/:id/disburse', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  try {
    const loanId = req.params.id;

    const result = await withTransaction(async (client) => {
      const loanRes = await client.query(
        `SELECT l.loan_id, l.user_id, l.product_id, l.loan_amount, l.interest_rate, l.emi_amount, 
                l.total_payable, l.loan_status, p.product_name, p.loan_term_months, p.processing_fee
         FROM loan_accounts l
         JOIN loan_products p ON l.product_id = p.product_id
         WHERE l.loan_id = $1
         FOR UPDATE OF l`,
        [loanId]
      );

      if (loanRes.rowCount === 0) {
        throw new Error('Loan account not found');
      }

      const loan = loanRes.rows[0];

      if (req.user.role !== 'ADMIN' && req.user.userId !== loan.user_id) {
        throw new Error('Unauthorized to disburse this loan');
      }

      if (loan.loan_status !== 'APPROVED' && loan.loan_status !== 'PENDING') {
        throw new Error(`Cannot disburse loan: Current status is '${loan.loan_status}'`);
      }

      const walletRes = await client.query(
        `SELECT wallet_id, current_balance FROM wallets WHERE user_id = $1 FOR UPDATE`,
        [loan.user_id]
      );

      if (walletRes.rowCount === 0) {
        throw new Error('Borrower wallet not found');
      }

      const wallet = walletRes.rows[0];
      const principal = parseFloat(loan.loan_amount);
      const processingFee = parseFloat(loan.processing_fee || '0.00');
      const netDisbursed = roundToTwoDecimals(principal - processingFee);

      const previousWalletBalance = parseFloat(wallet.current_balance);
      const newWalletBalance = roundToTwoDecimals(previousWalletBalance + netDisbursed);

      await client.query(
        `UPDATE wallets SET current_balance = $1, last_updated = CURRENT_TIMESTAMP WHERE wallet_id = $2`,
        [newWalletBalance, wallet.wallet_id]
      );

      const startDate = new Date();
      const schedule = generateAmortizationSchedule(principal, loan.interest_rate, loan.loan_term_months, startDate);

      for (const item of schedule) {
        await client.query(
          `INSERT INTO emi_schedules 
           (loan_id, emi_number, due_date, emi_amount, principal_component, interest_component, amount_paid, payment_status)
           VALUES ($1, $2, $3, $4, $5, $6, 0.00, 'PENDING')`,
          [loan.loan_id, item.emiNumber, item.dueDate, item.emiAmount, item.principalComponent, item.interestComponent]
        );
      }

      const endDate = schedule[schedule.length - 1].dueDate;
      await client.query(
        `UPDATE loan_accounts 
         SET loan_status = 'ACTIVE', 
             loan_start_date = CURRENT_DATE, 
             loan_end_date = $1, 
             outstanding_balance = $2
         WHERE loan_id = $3`,
        [endDate, principal, loan.loan_id]
      );

      const referenceNo = `TXN-DISB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const remarks = `Loan disbursement: INR ${principal.toFixed(2)} principal less INR ${processingFee.toFixed(2)} processing fee`;

      await client.query(
        `INSERT INTO transaction_ledger 
         (user_id, wallet_id, loan_id, transaction_type, amount, balance_after_transaction, reference_no, remarks)
         VALUES ($1, $2, $3, 'LOAN_DISBURSEMENT', $4, $5, $6, $7)`,
        [loan.user_id, wallet.wallet_id, loan.loan_id, netDisbursed, newWalletBalance, referenceNo, remarks]
      );

      return {
        loanId: loan.loan_id,
        principal,
        processingFee,
        netDisbursed,
        newWalletBalance,
        installmentsGenerated: schedule.length,
        referenceNo
      };
    });

    const latency = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Loan successfully disbursed, wallet credited, and EMI schedule generated',
      data: result,
      oltp: {
        atomicSteps: 6,
        lockOrder: ['loan_accounts', 'wallets'],
        latencyMs: latency
      }
    });
  } catch (err) {
    console.error('Disbursement Error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/loans/my-loans
router.get('/my-loans', authenticateToken, async (req, res) => {
  try {
    const loansRes = await query(
      `SELECT l.loan_id, l.product_id, p.product_name, l.loan_amount, l.interest_rate, 
              l.emi_amount, l.total_payable, l.outstanding_balance, l.loan_status, 
              l.loan_start_date, l.loan_end_date, l.created_at,
              COUNT(e.emi_id) as total_emis,
              COUNT(CASE WHEN e.payment_status = 'PAID' THEN 1 END) as paid_emis
       FROM loan_accounts l
       JOIN loan_products p ON l.product_id = p.product_id
       LEFT JOIN emi_schedules e ON l.loan_id = e.loan_id
       WHERE l.user_id = $1
       GROUP BY l.loan_id, p.product_name
       ORDER BY l.created_at DESC`,
      [req.user.userId]
    );

    const formatted = loansRes.rows.map(l => ({
      loanId: l.loan_id,
      productName: l.product_name,
      loanAmount: parseFloat(l.loan_amount),
      interestRate: parseFloat(l.interest_rate),
      emiAmount: parseFloat(l.emi_amount),
      totalPayable: parseFloat(l.total_payable),
      outstandingBalance: parseFloat(l.outstanding_balance),
      loanStatus: l.loan_status,
      loanStartDate: l.loan_start_date,
      loanEndDate: l.loan_end_date,
      createdAt: l.created_at,
      totalEmis: parseInt(l.total_emis, 10),
      paidEmis: parseInt(l.paid_emis, 10)
    }));

    res.json({ success: true, loans: formatted });
  } catch (err) {
    console.error('Fetch My Loans Error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve loans' });
  }
});

// GET /api/loans/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const loanRes = await query(
      `SELECT l.loan_id, l.user_id, u.full_name, u.email, l.product_id, p.product_name, 
              l.loan_amount, l.interest_rate, l.emi_amount, l.total_payable, 
              l.outstanding_balance, l.loan_status, l.loan_start_date, l.loan_end_date, l.created_at
       FROM loan_accounts l
       JOIN users u ON l.user_id = u.user_id
       JOIN loan_products p ON l.product_id = p.product_id
       WHERE l.loan_id = $1`,
      [req.params.id]
    );

    if (loanRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }

    const loan = loanRes.rows[0];

    if (req.user.role !== 'ADMIN' && req.user.userId !== loan.user_id) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this loan' });
    }

    const emiRes = await query(
      `SELECT emi_id, emi_number, due_date, emi_amount, principal_component, 
              interest_component, amount_paid, payment_status, paid_date
       FROM emi_schedules
       WHERE loan_id = $1
       ORDER BY emi_number ASC`,
      [loan.loan_id]
    );

    res.json({
      success: true,
      loan: {
        loanId: loan.loan_id,
        borrowerName: loan.full_name,
        borrowerEmail: loan.email,
        productName: loan.product_name,
        loanAmount: parseFloat(loan.loan_amount),
        interestRate: parseFloat(loan.interest_rate),
        emiAmount: parseFloat(loan.emi_amount),
        totalPayable: parseFloat(loan.total_payable),
        outstandingBalance: parseFloat(loan.outstanding_balance),
        loanStatus: loan.loan_status,
        loanStartDate: loan.loan_start_date,
        loanEndDate: loan.loan_end_date,
        createdAt: loan.created_at,
        schedule: emiRes.rows.map(e => ({
          emiId: e.emi_id,
          emiNumber: e.emi_number,
          dueDate: e.due_date,
          emiAmount: parseFloat(e.emi_amount),
          principalComponent: parseFloat(e.principal_component),
          interestComponent: parseFloat(e.interest_component),
          amountPaid: parseFloat(e.amount_paid),
          paymentStatus: e.payment_status,
          paidDate: e.paid_date
        }))
      }
    });
  } catch (err) {
    console.error('Fetch Loan Details Error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve loan details' });
  }
});

// GET /api/loans
router.get('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const loansRes = await query(
      `SELECT l.loan_id, l.user_id, u.full_name, u.email, p.product_name, 
              l.loan_amount, l.interest_rate, l.emi_amount, l.outstanding_balance, 
              l.loan_status, l.loan_start_date, l.created_at
       FROM loan_accounts l
       JOIN users u ON l.user_id = u.user_id
       JOIN loan_products p ON l.product_id = p.product_id
       ORDER BY l.created_at DESC`
    );

    const formatted = loansRes.rows.map(l => ({
      loanId: l.loan_id,
      borrowerId: l.user_id,
      borrowerName: l.full_name,
      borrowerEmail: l.email,
      productName: l.product_name,
      loanAmount: parseFloat(l.loan_amount),
      interestRate: parseFloat(l.interest_rate),
      emiAmount: parseFloat(l.emi_amount),
      outstandingBalance: parseFloat(l.outstanding_balance),
      loanStatus: l.loan_status,
      loanStartDate: l.loan_start_date,
      createdAt: l.created_at
    }));

    res.json({ success: true, loans: formatted });
  } catch (err) {
    console.error('Admin Fetch Loans Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
