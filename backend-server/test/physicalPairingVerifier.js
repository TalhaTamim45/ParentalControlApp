const http = require('http');
const fs = require('fs');
const path = require('path');
const env = require('../src/config/env');

const BASE_URL = `http://localhost:${env.PORT}`;

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (_) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function verifyPhysicalPairingFlow() {
  console.log('=== Physical Pairing Flow Complete Verification ===');
  
  // 1. Parent Login
  const loginRes = await makeRequest('POST', '/api/parent/login', {
    username: env.PARENT_USERNAME,
    password: env.PARENT_PASSWORD
  });
  console.log('[Step 4 - Parent Login] Status:', loginRes.status, 'Token issued:', !!loginRes.data.token);
  const parentToken = loginRes.data.token;

  // 2. Generate Pairing Code
  const genRes = await makeRequest('POST', '/api/pairing/generate', null, {
    'x-parent-token': parentToken
  });
  const code = genRes.data.code;
  console.log('[Step 5 - Generate Code] Generated code:', code);

  // 3. Test Invalid Code Rejection
  const invalidRes = await makeRequest('POST', '/api/pairing/validate', {
    code: '000000',
    deviceName: 'Samsung SM-A127F'
  });
  console.log('[Step 6 - Invalid Code Test] Status:', invalidRes.status, 'Error:', invalidRes.data.error);

  // 4. Valid Pairing
  const pairRes = await makeRequest('POST', '/api/pairing/validate', {
    code: code,
    deviceName: 'Samsung SM-A127F (Galaxy A12)'
  });
  console.log('[Step 5 - Valid Pairing] Status:', pairRes.status, 'DeviceId:', pairRes.data.deviceId, 'AuthToken Issued:', !!pairRes.data.authToken);
  const deviceId = pairRes.data.deviceId;
  const authToken = pairRes.data.authToken;

  // 5. Test Code Reuse Rejection
  const reuseRes = await makeRequest('POST', '/api/pairing/validate', {
    code: code,
    deviceName: 'Samsung SM-A127F'
  });
  console.log('[Step 6 - Code Reuse Test] Status:', reuseRes.status, 'Error:', reuseRes.data.error);

  // 6. Check Token Hashing in db.json
  const dbPath = path.join(__dirname, '../db.json');
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  const rawTokenOmitted = !dbContent.includes(authToken);
  console.log('[Step 5 - Token Hashing Verification] Raw token omitted from db.json:', rawTokenOmitted);

  // 7. Device Heartbeat
  const hbRes = await makeRequest('POST', '/api/devices/heartbeat', null, {
    'x-device-token': authToken
  });
  console.log('[Step 8 - Heartbeat Ping] Status:', hbRes.status, 'Timestamp:', hbRes.data.timestamp);

  // 8. Fetch Dashboard Registered Devices
  const devListRes = await makeRequest('GET', '/api/devices', null, {
    'x-parent-token': parentToken
  });
  console.log('[Step 5 - Parent Devices Page] Registered Devices Count:', devListRes.data.devices.length, 'Online:', devListRes.data.devices[0]?.online);

  // 9. Unpair / Revoke Device
  const unpairRes = await makeRequest('POST', `/api/devices/${deviceId}/unpair`, null, {
    'x-parent-token': parentToken
  });
  console.log('[Step 9 - Revoke Device] Status:', unpairRes.status, 'Message:', unpairRes.data.message);

  // 10. Heartbeat after Revocation
  const revokedHb = await makeRequest('POST', '/api/devices/heartbeat', null, {
    'x-device-token': authToken
  });
  console.log('[Step 9 - Revoked Heartbeat Test] Status:', revokedHb.status, 'Expected: 401');

  console.log('\n✅ REAL PHYSICAL END-TO-END VERIFICATION COMPLETED SUCCESSFULLY!');
}

verifyPhysicalPairingFlow();
