const express = require('express');
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/metrics
router.get('/metrics', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const [loansRes, borrowersRes, pendingRes, ledgerRes] = await Promise.all([
      query(`
        SELECT 
          COALESCE(SUM(CASE WHEN loan_status IN ('ACTIVE', 'CLOSED') THEN loan_amount ELSE 0 END), 0.00) as total_disbursed,
          COALESCE(SUM(CASE WHEN loan_status = 'ACTIVE' THEN outstanding_balance ELSE 0 END), 0.00) as active_portfolio_debt,
          COUNT(CASE WHEN loan_status = 'ACTIVE' THEN 1 END) as active_loans_count
        FROM loan_accounts
      `),
      query(`
        SELECT COUNT(*) as borrower_count 
        FROM users 
        WHERE role = 'USER'
      `),
      query(`
        SELECT COUNT(*) as pending_count 
        FROM loan_accounts 
        WHERE loan_status = 'PENDING'
      `),
      query(`
        SELECT 
          COALESCE(SUM(amount), 0.00) as total_turnover,
          COUNT(*) as total_transactions
        FROM transaction_ledger
      `)
    ]);

    const loansData = loansRes.rows[0];
    const borrowersCount = parseInt(borrowersRes.rows[0].borrower_count, 10);
    const pendingCount = parseInt(pendingRes.rows[0].pending_count, 10);
    const ledgerData = ledgerRes.rows[0];

    res.json({
      success: true,
      metrics: {
        totalDisbursed: parseFloat(loansData.total_disbursed),
        activePortfolioDebt: parseFloat(loansData.active_portfolio_debt),
        activeLoansCount: parseInt(loansData.active_loans_count, 10),
        borrowersCount,
        pendingApprovalsCount: pendingCount,
        totalTurnover: parseFloat(ledgerData.total_turnover),
        totalTransactions: parseInt(ledgerData.total_transactions, 10)
      }
    });
  } catch (err) {
    console.error('Admin metrics error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/borrowers
router.get('/borrowers', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const borrowersRes = await query(`
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.phone_number,
        u.address,
        u.created_at as registered_at,
        COALESCE(w.current_balance, 0.00) as wallet_balance,
        COUNT(l.loan_id) as total_loans,
        COUNT(CASE WHEN l.loan_status = 'ACTIVE' THEN 1 END) as active_loans,
        COALESCE(SUM(CASE WHEN l.loan_status = 'ACTIVE' THEN l.outstanding_balance ELSE 0 END), 0.00) as active_debt
      FROM users u
      LEFT JOIN wallets w ON u.user_id = w.user_id
      LEFT JOIN loan_accounts l ON u.user_id = l.user_id
      WHERE u.role = 'USER'
      GROUP BY u.user_id, w.current_balance
      ORDER BY u.created_at DESC
    `);

    const borrowers = borrowersRes.rows.map(b => ({
      userId: b.user_id,
      fullName: b.full_name,
      email: b.email,
      phone: b.phone_number,
      address: b.address,
      registeredAt: b.registered_at,
      walletBalance: parseFloat(b.wallet_balance),
      totalLoans: parseInt(b.total_loans, 10),
      activeLoans: parseInt(b.active_loans, 10),
      activeDebt: parseFloat(b.active_debt)
    }));

    res.json({ success: true, count: borrowers.length, borrowers });
  } catch (err) {
    console.error('Admin borrowers fetch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/borrowers/:id
router.get('/borrowers/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const borrowerId = req.params.id;

    const userRes = await query(`
      SELECT u.user_id, u.full_name, u.email, u.phone_number, u.address, u.created_at,
             w.wallet_id, w.current_balance
      FROM users u
      LEFT JOIN wallets w ON u.user_id = w.user_id
      WHERE u.user_id = $1 AND u.role = 'USER'
    `, [borrowerId]);

    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Borrower profile not found' });
    }

    const user = userRes.rows[0];

    const [loansRes, txnsRes] = await Promise.all([
      query(`
        SELECT l.loan_id, l.loan_amount, l.interest_rate, l.emi_amount, 
               l.outstanding_balance, l.loan_status, l.loan_start_date, l.created_at,
               p.product_name
        FROM loan_accounts l
        JOIN loan_products p ON l.product_id = p.product_id
        WHERE l.user_id = $1
        ORDER BY l.created_at DESC
      `, [borrowerId]),
      query(`
        SELECT transaction_id, transaction_type, amount, balance_after_transaction, 
               transaction_date, reference_no, remarks
        FROM transaction_ledger
        WHERE user_id = $1
        ORDER BY transaction_date DESC
        LIMIT 20
      `, [borrowerId])
    ]);

    res.json({
      success: true,
      borrower: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone_number,
        address: user.address,
        registeredAt: user.created_at,
        walletBalance: parseFloat(user.current_balance || '0.00'),
        loans: loansRes.rows.map(l => ({
          loanId: l.loan_id,
          productName: l.product_name,
          loanAmount: parseFloat(l.loan_amount),
          interestRate: parseFloat(l.interest_rate),
          emiAmount: parseFloat(l.emi_amount),
          outstandingBalance: parseFloat(l.outstanding_balance),
          loanStatus: l.loan_status,
          createdAt: l.created_at
        })),
        recentTransactions: txnsRes.rows.map(t => ({
          transactionId: t.transaction_id,
          transactionType: t.transaction_type,
          amount: parseFloat(t.amount),
          balanceAfter: parseFloat(t.balance_after_transaction),
          transactionDate: t.transaction_date,
          referenceNo: t.reference_no,
          remarks: t.remarks
        }))
      }
    });
  } catch (err) {
    console.error('Admin borrower detail error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
