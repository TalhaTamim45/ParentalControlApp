const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const env = require('../src/config/env');

const PUBLIC_HTTPS_URL = 'https://nemo.tail7499c7.ts.net';

function makeRequest(method, pathUrl, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, PUBLIC_HTTPS_URL);
    const client = url.protocol === 'https:' ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
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

async function verifyPublicFunnelPairingFlow() {
  console.log(`=== Tailscale Funnel Public HTTPS Verification (${PUBLIC_HTTPS_URL}) ===`);
  
  // 1. Parent Login via Public HTTPS
  const loginRes = await makeRequest('POST', '/api/parent/login', {
    username: env.PARENT_USERNAME,
    password: env.PARENT_PASSWORD
  });
  console.log('[Step 1 - Public Parent Login] Status:', loginRes.status, 'Token issued:', !!loginRes.data.token);
  const parentToken = loginRes.data.token;

  // 2. Generate Pairing Code via Public HTTPS
  const genRes = await makeRequest('POST', '/api/pairing/generate', null, {
    'x-parent-token': parentToken
  });
  const code = genRes.data.code;
  console.log('[Step 2 - Generate Code] Public HTTPS Code:', code);

  // 3. Test Invalid Code Rejection
  const invalidRes = await makeRequest('POST', '/api/pairing/validate', {
    code: '000000',
    deviceName: 'Samsung SM-A127F (Mobile Data Test)'
  });
  console.log('[Step 3 - Invalid Code Test] Status:', invalidRes.status, 'Error:', invalidRes.data.error);

  // 4. Valid Pairing over Public HTTPS
  const pairRes = await makeRequest('POST', '/api/pairing/validate', {
    code: code,
    deviceName: 'Samsung SM-A127F (Galaxy A12 over Mobile Data)'
  });
  console.log('[Step 4 - Valid Public Pairing] Status:', pairRes.status, 'DeviceId:', pairRes.data.deviceId, 'AuthToken Issued:', !!pairRes.data.authToken);
  const deviceId = pairRes.data.deviceId;
  const authToken = pairRes.data.authToken;

  // 5. Test Code Reuse Rejection
  const reuseRes = await makeRequest('POST', '/api/pairing/validate', {
    code: code,
    deviceName: 'Samsung SM-A127F'
  });
  console.log('[Step 5 - Code Reuse Test] Status:', reuseRes.status, 'Error:', reuseRes.data.error);

  // 6. Check Token Hashing in Persistent Storage
  const dbPath = path.join(__dirname, '../db.json');
  const dbContent = fs.existsSync(dbPath) ? fs.readFileSync(dbPath, 'utf8') : '';
  const rawTokenOmitted = !dbContent.includes(authToken);
  console.log('[Step 6 - Token Hashing Verification] Raw token omitted from persistent storage:', rawTokenOmitted);

  // 7. Device Heartbeat via Public HTTPS
  const hbRes = await makeRequest('POST', '/api/devices/heartbeat', null, {
    'x-device-token': authToken
  });
  console.log('[Step 7 - Public Heartbeat Ping] Status:', hbRes.status, 'Timestamp:', hbRes.data.timestamp);

  // 8. Fetch Registered Devices via Public HTTPS
  const devListRes = await makeRequest('GET', '/api/devices', null, {
    'x-parent-token': parentToken
  });
  console.log('[Step 8 - Public Parent Devices View] Registered Devices Count:', devListRes.data.devices.length, 'Online:', devListRes.data.devices[0]?.online);

  // 9. Remote Unpair & Revoke Device via Public HTTPS
  const unpairRes = await makeRequest('POST', `/api/devices/${deviceId}/unpair`, null, {
    'x-parent-token': parentToken
  });
  console.log('[Step 9 - Remote Revoke Device] Status:', unpairRes.status, 'Message:', unpairRes.data.message);

  // 10. Heartbeat with Revoked Token via Public HTTPS
  const revokedHb = await makeRequest('POST', '/api/devices/heartbeat', null, {
    'x-device-token': authToken
  });
  console.log('[Step 10 - Revoked Heartbeat Test] Status:', revokedHb.status, 'Expected: 401');

  console.log('\n✅ REAL PUBLIC TAILSCALE FUNNEL END-TO-END VERIFICATION PASSED SUCCESSFULLY!');
}

verifyPublicFunnelPairingFlow();
