const express = require('express');
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const productsRes = await query(
      `SELECT product_id, product_name, interest_rate, loan_term_months, 
              processing_fee, min_loan_amount, max_loan_amount, created_at
       FROM loan_products 
       ORDER BY product_id ASC`
    );

    const formatted = productsRes.rows.map(p => ({
      productId: p.product_id,
      productName: p.product_name,
      interestRate: parseFloat(p.interest_rate),
      loanTermMonths: p.loan_term_months,
      processingFee: parseFloat(p.processing_fee),
      minLoanAmount: parseFloat(p.min_loan_amount),
      maxLoanAmount: parseFloat(p.max_loan_amount),
      createdAt: p.created_at
    }));

    res.json({ success: true, products: formatted });
  } catch (err) {
    console.error('Fetch Loan Products Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch loan products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const productRes = await query(
      `SELECT product_id, product_name, interest_rate, loan_term_months, 
              processing_fee, min_loan_amount, max_loan_amount, created_at
       FROM loan_products 
       WHERE product_id = $1`,
      [req.params.id]
    );

    if (productRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Loan product not found' });
    }

    const p = productRes.rows[0];
    res.json({
      success: true,
      product: {
        productId: p.product_id,
        productName: p.product_name,
        interestRate: parseFloat(p.interest_rate),
        loanTermMonths: p.loan_term_months,
        processingFee: parseFloat(p.processing_fee),
        minLoanAmount: parseFloat(p.min_loan_amount),
        maxLoanAmount: parseFloat(p.max_loan_amount),
        createdAt: p.created_at
      }
    });
  } catch (err) {
    console.error('Fetch Product Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

// POST /api/products
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const {
      product_name,
      interest_rate,
      loan_term_months,
      processing_fee,
      min_loan_amount,
      max_loan_amount
    } = req.body;

    if (!product_name || interest_rate === undefined || !loan_term_months || !min_loan_amount || !max_loan_amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: product_name, interest_rate, loan_term_months, min_loan_amount, max_loan_amount'
      });
    }

    const rate = parseFloat(interest_rate);
    const months = parseInt(loan_term_months, 10);
    const fee = processing_fee !== undefined ? parseFloat(processing_fee) : 0.00;
    const minAmt = parseFloat(min_loan_amount);
    const maxAmt = parseFloat(max_loan_amount);

    if (rate < 0) return res.status(400).json({ success: false, error: 'Interest rate cannot be negative' });
    if (months <= 0) return res.status(400).json({ success: false, error: 'Term months must be positive' });
    if (minAmt <= 0) return res.status(400).json({ success: false, error: 'Minimum loan amount must be > 0' });
    if (maxAmt < minAmt) return res.status(400).json({ success: false, error: 'Max loan amount cannot be less than min loan amount' });

    const insertRes = await query(
      `INSERT INTO loan_products 
       (product_name, interest_rate, loan_term_months, processing_fee, min_loan_amount, max_loan_amount)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING product_id, product_name, interest_rate, loan_term_months, processing_fee, min_loan_amount, max_loan_amount, created_at`,
      [product_name.trim(), rate, months, fee, minAmt, maxAmt]
    );

    const created = insertRes.rows[0];
    res.status(201).json({
      success: true,
      message: 'Loan product created successfully',
      product: {
        productId: created.product_id,
        productName: created.product_name,
        interestRate: parseFloat(created.interest_rate),
        loanTermMonths: created.loan_term_months,
        processingFee: parseFloat(created.processing_fee),
        minLoanAmount: parseFloat(created.min_loan_amount),
        maxLoanAmount: parseFloat(created.max_loan_amount),
        createdAt: created.created_at
      }
    });
  } catch (err) {
    console.error('Create Product Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
