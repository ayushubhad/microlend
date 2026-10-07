const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgrespassword',
  database: process.env.PGDATABASE || 'microlend',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err);
});

// Query Execution
const query = (text, params) => pool.query(text, params);

// Transaction Wrapper
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[Transaction Rollback Error]', rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction
};
