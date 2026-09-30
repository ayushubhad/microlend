const EmbeddedPostgres = require('embedded-postgres').default;
const { Pool } = require('pg');

async function main() {
  console.log('Starting Embedded PostgreSQL...');
  const pg = new EmbeddedPostgres({
    databaseDir: './.pgdata',
    port: 5432,
    user: 'postgres',
    password: 'postgrespassword',
    initialDatabase: 'microlend'
  });

  const fs = require('fs');
  if (!fs.existsSync('./.pgdata/PG_VERSION')) {
    await pg.initialise();
  }
  await pg.start();
  console.log('PostgreSQL initialized and started on port 5432!');

  // Connect to default postgres db first to create microlend
  const adminPool = new Pool({
    connectionString: 'postgresql://postgres:postgrespassword@localhost:5432/postgres'
  });

  const checkDb = await adminPool.query("SELECT 1 FROM pg_database WHERE datname = 'microlend'");
  if (checkDb.rowCount === 0) {
    await adminPool.query('CREATE DATABASE microlend;');
    console.log('Database microlend created successfully!');
  }
  await adminPool.end();

  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgrespassword@localhost:5432/microlend'
  });

  const res = await pool.query('SELECT version();');
  console.log('PostgreSQL Connected Successfully!');
  console.log('PostgreSQL Version:', res.rows[0].version);

  await pool.end();
  await pg.stop();
  console.log('PostgreSQL stopped cleanly.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
