const fs = require('fs');
const path = require('path');
const { ensurePostgresRunning } = require('../config/postgres_runner');
const { pool } = require('../config/db');

async function initializeDatabase() {
  console.log('[DB Initialization] Ensuring PostgreSQL server is active...');
  await ensurePostgresRunning();

  console.log('[DB Initialization] Reading schema.sql and seed.sql...');
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');

  const client = await pool.connect();
  try {
    console.log('[DB Initialization] Applying 3NF Schema DDL...');
    await client.query(schemaSql);
    console.log('[DB Initialization] Schema applied successfully!');

    console.log('[DB Initialization] Seeding initial financial data...');
    await client.query(seedSql);
    console.log('[DB Initialization] Seed data inserted successfully!');
  } catch (err) {
    console.error('[DB Initialization Error]:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialized successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Initialization failed:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
