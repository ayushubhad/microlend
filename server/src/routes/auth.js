const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, withTransaction } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Atomically registers a user and provisions their digital wallet.
 */
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone_number, password, address, aadhaar_number, initial_deposit } = req.body;

    // Strict validation
    if (!full_name || !email || !phone_number || !password || !address || !aadhaar_number) {
      return res.status(400).json({
        success: false,
        error: 'All fields (full_name, email, phone_number, password, address, aadhaar_number) are required'
      });
    }

    if (!/^\d{12}$/.test(aadhaar_number)) {
      return res.status(400).json({
        success: false,
        error: 'Aadhaar number must be exactly 12 digits'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check unique email and aadhaar before transaction
    const existing = await query(
      'SELECT email, aadhaar_number, phone_number FROM users WHERE email = $1 OR aadhaar_number = $2 OR phone_number = $3',
      [email.toLowerCase().trim(), aadhaar_number, phone_number]
    );

    if (existing.rowCount > 0) {
      const match = existing.rows[0];
      if (match.email === email.toLowerCase().trim()) {
        return res.status(409).json({ success: false, error: 'A user with this email address already exists' });
      }
      if (match.aadhaar_number === aadhaar_number) {
        return res.status(409).json({ success: false, error: 'A user with this Aadhaar number already exists' });
      }
      if (match.phone_number === phone_number) {
        return res.status(409).json({ success: false, error: 'A user with this phone number already exists' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const startingBalance = parseFloat(initial_deposit) > 0 ? parseFloat(initial_deposit) : 0.00;

    // ATOMIC REGISTRATION + WALLET PROVISIONING
    const result = await withTransaction(async (client) => {
      // 1. Insert User
      const userRes = await client.query(
        `INSERT INTO users (full_name, email, phone_number, password_hash, role, address, aadhaar_number, wallet_balance)
         VALUES ($1, $2, $3, $4, 'USER', $5, $6, $7)
         RETURNING user_id, full_name, email, phone_number, role, address, aadhaar_number, created_at`,
        [full_name.trim(), email.toLowerCase().trim(), phone_number.trim(), password_hash, address.trim(), aadhaar_number, startingBalance]
      );
      const user = userRes.rows[0];

      // 2. Insert Wallet
      const walletRes = await client.query(
        `INSERT INTO wallets (user_id, current_balance)
         VALUES ($1, $2)
         RETURNING wallet_id, current_balance, created_at`,
        [user.user_id, startingBalance]
      );
      const wallet = walletRes.rows[0];

      // 3. If initial deposit was made, create initial ledger transaction
      if (startingBalance > 0) {
        await client.query(
          `INSERT INTO transaction_ledger (user_id, wallet_id, transaction_type, amount, balance_after_transaction, reference_no, remarks)
           VALUES ($1, $2, 'WALLET_CREDIT', $3, $4, $5, $6)`,
          [
            user.user_id,
            wallet.wallet_id,
            startingBalance,
            startingBalance,
            `TXN-INIT-${Date.now()}`,
            'Initial onboarding wallet deposit'
          ]
        );
      }

      return { user, wallet };
    });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: result.user.user_id,
        email: result.user.email,
        role: result.user.role,
        fullName: result.user.full_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered and wallet provisioned successfully',
      token,
      user: {
        userId: result.user.user_id,
        fullName: result.user.full_name,
        email: result.user.email,
        role: result.user.role,
        walletBalance: parseFloat(result.wallet.current_balance),
        walletId: result.wallet.wallet_id
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, error: 'Registration failed: ' + err.message });
  }
});

/**
 * POST /api/auth/login
 * Verifies credentials, computes current balance, and returns JWT.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const userRes = await query(
      `SELECT u.user_id, u.full_name, u.email, u.phone_number, u.password_hash, u.role, u.address, u.aadhaar_number,
              w.wallet_id, w.current_balance
       FROM users u
       LEFT JOIN wallets w ON u.user_id = w.user_id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone_number,
        role: user.role,
        address: user.address,
        aadhaarNumber: user.aadhaar_number,
        walletId: user.wallet_id,
        walletBalance: parseFloat(user.current_balance || '0.00')
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, error: 'Login failed: ' + err.message });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user and real-time wallet balance.
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userRes = await query(
      `SELECT u.user_id, u.full_name, u.email, u.phone_number, u.role, u.address, u.aadhaar_number, u.created_at,
              w.wallet_id, w.current_balance, w.last_updated
       FROM users u
       LEFT JOIN wallets w ON u.user_id = w.user_id
       WHERE u.user_id = $1`,
      [req.user.userId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = userRes.rows[0];
    res.json({
      success: true,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone_number,
        role: user.role,
        address: user.address,
        aadhaarNumber: user.aadhaar_number,
        createdAt: user.created_at,
        walletId: user.wallet_id,
        walletBalance: parseFloat(user.current_balance || '0.00'),
        walletLastUpdated: user.last_updated
      }
    });
  } catch (err) {
    console.error('Auth /me Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
