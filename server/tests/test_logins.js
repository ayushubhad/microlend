const http = require('http');

function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(data) });
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function verifyAll() {
  const credentials = [
    { email: 'priya@gmail.com', pass: 'Priya123', expectedRole: 'USER', expectedName: 'Priya Sharma' },
    { email: 'arvind@gmail.com', pass: 'Arvind123', expectedRole: 'USER', expectedName: 'Dr. Arvind Rao' },
    { email: 'admin@gov.in', pass: 'Admin123', expectedRole: 'ADMIN', expectedName: 'System Administrator' },
  ];

  console.log('=== VERIFYING VALID LOGINS ===');
  for (const c of credentials) {
    const res = await testLogin(c.email, c.pass);
    console.log(`[PASS] ${c.email}: HTTP ${res.status}, Name: '${res.body.user.fullName}', Role: '${res.body.user.role}', Wallet: INR ${res.body.user.walletBalance}`);
    if (res.status !== 200 || !res.body.success || res.body.user.role !== c.expectedRole || res.body.user.fullName !== c.expectedName) {
      throw new Error(`Failed valid login for ${c.email}`);
    }
  }

  console.log('\n=== VERIFYING INVALID PASSWORD REJECTION ===');
  for (const c of credentials) {
    const res = await testLogin(c.email, 'WrongPass!99');
    console.log(`[REJECT] ${c.email} with bad pass: HTTP ${res.status}, Error: '${res.body.error}'`);
    if (res.status !== 401) {
      throw new Error(`Failed rejection check for ${c.email}`);
    }
  }

  console.log('\n=== VERIFYING UNKNOWN USER REJECTION ===');
  const unknown = await testLogin('nobody@unknown.com', 'Random123');
  console.log(`[REJECT] nobody@unknown.com: HTTP ${unknown.status}, Error: '${unknown.body.error}'`);
  if (unknown.status !== 401) {
    throw new Error('Failed unknown user rejection');
  }

  console.log('\nALL LOGIN VERIFICATIONS PASSED WITH 100% ACCURACY!');
}

verifyAll().catch(e => { console.error('FAILED:', e); process.exit(1); });
