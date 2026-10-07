const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ensurePostgresRunning } = require('./config/postgres_runner');
const { pool, query } = require('./config/db');
const { initializeDatabase } = require('./db/init_db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Route Mounts
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/products', require('./routes/products'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/emi', require('./routes/emi'));
app.use('/api/ledger', require('./routes/ledger'));
app.use('/api/inspector', require('./routes/inspector'));
app.use('/api/admin', require('./routes/admin'));

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await query('SELECT NOW() as current_time, version()');
    res.json({
      status: 'UP',
      database: 'PostgreSQL',
      version: dbRes.rows[0].version,
      databaseTime: dbRes.rows[0].current_time
    });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

async function startServer() {
  try {
    console.log('[MicroLend Server] Checking PostgreSQL server readiness...');
    await ensurePostgresRunning();

    const checkTables = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users';
    `);

    if (parseInt(checkTables.rows[0].count, 10) === 0) {
      console.log('[MicroLend Server] Initializing database schema and seed data...');
      await initializeDatabase();
    } else {
      console.log('[MicroLend Server] Database tables verified.');
    }

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 MicroLend Backend Server Active on http://localhost:${PORT}`);
      console.log(`📊 PostgreSQL OLTP Engine Running on port 5432`);
      console.log(`🛡️  ACID Transactions & Row-Level Locking Active`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[MicroLend Server Startup Failed]:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
