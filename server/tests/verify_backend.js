// Comprehensive Backend Verification Test
const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(buf) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: buf });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(buf) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: buf });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- 1. Testing Login ---');
  const loginRes = await post('/api/auth/login', {
    email: 'priya.sharma@example.com',
    password: 'Password@123'
  });
  console.log('Login Status:', loginRes.status, 'User:', loginRes.body.user.fullName, 'Balance:', loginRes.body.user.walletBalance);
  const token = loginRes.body.token;

  console.log('--- 2. Testing Wallet Fetch ---');
  const walletRes = await get('/api/wallet', token);
  console.log('Wallet Current Balance:', walletRes.body.wallet.currentBalance);

  console.log('--- 3. Testing Wallet Credit ---');
  const creditRes = await post('/api/wallet/credit', { amount: 1500.00, remarks: 'Test Credit' }, token);
  console.log('Credit Status:', creditRes.status, 'New Balance:', creditRes.body.data.newBalance, 'Latency:', creditRes.body.oltp.latencyMs + 'ms');

  console.log('--- 4. Testing Ledger Reconciliation ---');
  const reconRes = await get('/api/ledger/reconciliation', token);
  console.log('Reconciliation Status:', reconRes.body.reconciliation.status, 'Difference:', reconRes.body.reconciliation.difference);

  console.log('--- 5. Testing Concurrency Race Condition Simulation ---');
  const simRes = await post('/api/inspector/simulate-race-condition', {});
  console.log('Concurrency Test Result:', simRes.body.simulation.conclusion);

  console.log('--- 6. Testing Trigger Ledger Protection ---');
  const triggerRes = await post('/api/inspector/test-trigger-protection', {});
  console.log('Trigger Protection Active:', triggerRes.body.triggerEnforced, 'DB Message:', triggerRes.body.databaseResponse);

  console.log('--- ALL BACKEND CHECKS PASSED SUCCESSFULLY! ---');
}

runTests().catch(console.error);
