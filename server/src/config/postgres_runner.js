const fs = require('fs');
const path = require('path');
const net = require('net');
const EmbeddedPostgres = require('embedded-postgres').default;
const { Pool } = require('pg');

let embeddedPgInstance = null;

// Check if a TCP port is open (e.g. 5432)
function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function ensurePostgresRunning() {
  const dbPort = parseInt(process.env.PGPORT || '5432', 10);
  const dbHost = process.env.PGHOST || '127.0.0.1';
  const dbName = process.env.PGDATABASE || 'microlend';
  const dbUser = process.env.PGUSER || 'postgres';
  const dbPassword = process.env.PGPASSWORD || 'postgrespassword';

  const alreadyOpen = await isPortOpen(dbPort, dbHost);

  if (alreadyOpen) {
    console.log(`[PostgreSQL Engine] Found PostgreSQL server running on ${dbHost}:${dbPort}`);
  } else {
    console.log(`[PostgreSQL Engine] No server on port ${dbPort}. Launching native PostgreSQL 18 server...`);
    const pgDataDir = path.resolve(__dirname, '../../../.pgdata');

    embeddedPgInstance = new EmbeddedPostgres({
      databaseDir: pgDataDir,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      initialDatabase: 'postgres'
    });

    if (!fs.existsSync(path.join(pgDataDir, 'PG_VERSION'))) {
      console.log('[PostgreSQL Engine] Initializing database cluster with initdb...');
      await embeddedPgInstance.initialise();
    }

    await embeddedPgInstance.start();
    console.log(`[PostgreSQL Engine] Native PostgreSQL server successfully started on port ${dbPort}!`);
  }

  // Ensure 'microlend' database exists
  const adminPool = new Pool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres'
  });

  try {
    const res = await adminPool.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (res.rowCount === 0) {
      console.log(`[PostgreSQL Engine] Database "${dbName}" does not exist. Creating it now...`);
      await adminPool.query(`CREATE DATABASE "${dbName}";`);
      console.log(`[PostgreSQL Engine] Database "${dbName}" created.`);
    }
  } catch (err) {
    console.warn(`[PostgreSQL Engine] Notice checking/creating database "${dbName}":`, err.message);
  } finally {
    await adminPool.end();
  }

  return { host: dbHost, port: dbPort, user: dbUser, password: dbPassword, database: dbName };
}

module.exports = {
  ensurePostgresRunning,
  isPortOpen
};
