const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

const env = require('../src/config/env');
const { server } = require('../server');

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
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
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

async function runTests() {
  console.log('=== Running Backend Security & Pairing Tests ===');
  let parentToken = null;
  let pairingCode = null;
  let deviceId = null;
  let rawAuthToken = null;

  try {
    // Test 1: Parent endpoint rejected without auth
    console.log('[Test 1] Unauthenticated parent request rejection...');
    const unauthGen = await makeRequest('POST', '/api/pairing/generate');
    assert.strictEqual(unauthGen.status, 401, 'Generate code without auth must return 401');

    const unauthDev = await makeRequest('GET', '/api/devices');
    assert.strictEqual(unauthDev.status, 401, 'Get devices without auth must return 401');
    console.log('✔ Passed');

    // Test 2: Valid parent login
    console.log('[Test 2] Parent login with valid env credentials...');
    const loginRes = await makeRequest('POST', '/api/parent/login', {
      username: env.PARENT_USERNAME,
      password: env.PARENT_PASSWORD
    });
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.data.success, true);
    assert.ok(loginRes.data.token, 'Must issue parent session token');
    parentToken = loginRes.data.token;
    console.log('✔ Passed');

    // Test 3: Generate temporary pairing code
    console.log('[Test 3] Generate 6-digit one-time pairing code...');
    const genRes = await makeRequest('POST', '/api/pairing/generate', null, {
      'x-parent-token': parentToken
    });
    assert.strictEqual(genRes.status, 200);
    assert.strictEqual(genRes.data.success, true);
    assert.strictEqual(typeof genRes.data.code, 'string');
    assert.strictEqual(genRes.data.code.length, 6, 'Code must be 6 digits');
    pairingCode = genRes.data.code;
    console.log('✔ Passed (Generated code:', pairingCode, ')');

    // Test 4: Invalid pairing code rejected
    console.log('[Test 4] Reject invalid pairing code...');
    const invalidRes = await makeRequest('POST', '/api/pairing/validate', {
      code: '000000',
      deviceName: "Test Child Phone"
    });
    assert.strictEqual(invalidRes.status, 400);
    assert.strictEqual(invalidRes.data.success, false);
    console.log('✔ Passed');

    // Test 5: Valid pairing code succeeds & issues device credentials
    console.log('[Test 5] Valid pairing code validation & device registration...');
    const pairRes = await makeRequest('POST', '/api/pairing/validate', {
      code: pairingCode,
      deviceName: "Test Child Phone"
    });
    assert.strictEqual(pairRes.status, 200);
    assert.strictEqual(pairRes.data.success, true);
    assert.ok(pairRes.data.deviceId, 'Must issue deviceId');
    assert.ok(pairRes.data.authToken, 'Must issue raw authToken');
    deviceId = pairRes.data.deviceId;
    rawAuthToken = pairRes.data.authToken;
    console.log('✔ Passed (Registered Device ID:', deviceId, ')');

    // Test 6: One-time code reuse rejection
    console.log('[Test 6] Reject pairing code reuse...');
    const reuseRes = await makeRequest('POST', '/api/pairing/validate', {
      code: pairingCode,
      deviceName: "Imposter Phone"
    });
    assert.strictEqual(reuseRes.status, 400);
    assert.strictEqual(reuseRes.data.success, false);
    console.log('✔ Passed');

    // Test 7: Verify raw token is NOT stored in db.json
    console.log('[Test 7] Check persistent storage for raw token omission...');
    const dbPath = path.join(__dirname, '../db.json');
    if (fs.existsSync(dbPath)) {
      const dbContent = fs.readFileSync(dbPath, 'utf8');
      assert.strictEqual(dbContent.includes(rawAuthToken), false, 'Raw auth token MUST NOT be stored in db.json');
    }
    console.log('✔ Passed');

    // Test 8: Device Heartbeat with valid auth token
    console.log('[Test 8] Device heartbeat execution...');
    const hbRes = await makeRequest('POST', '/api/devices/heartbeat', null, {
      'x-device-token': rawAuthToken
    });
    assert.strictEqual(hbRes.status, 200);
    assert.strictEqual(hbRes.data.success, true);
    console.log('✔ Passed');

    // Test 9: Get registered devices list for parent
    console.log('[Test 9] Fetch real registered devices list for authenticated parent...');
    const devListRes = await makeRequest('GET', '/api/devices', null, {
      'x-parent-token': parentToken
    });
    assert.strictEqual(devListRes.status, 200);
    assert.strictEqual(devListRes.data.success, true);
    assert.ok(Array.isArray(devListRes.data.devices));
    const targetDev = devListRes.data.devices.find(d => d.id === deviceId);
    assert.ok(targetDev, 'Newly paired device must be in list');
    assert.strictEqual(targetDev.online, true, 'Device with recent heartbeat must be online');
    console.log('✔ Passed');

    // Test 10: Device revocation / unpairing
    console.log('[Test 10] Unpair and revoke device token...');
    const unpairRes = await makeRequest('POST', `/api/devices/${deviceId}/unpair`, null, {
      'x-parent-token': parentToken
    });
    assert.strictEqual(unpairRes.status, 200);
    assert.strictEqual(unpairRes.data.success, true);

    // Test 11: Heartbeat with revoked token rejected
    console.log('[Test 11] Reject heartbeat from revoked device...');
    const revokedHb = await makeRequest('POST', '/api/devices/heartbeat', null, {
      'x-device-token': rawAuthToken
    });
    assert.strictEqual(revokedHb.status, 401);
    console.log('✔ Passed');

    console.log('\n✅ ALL BACKEND AUTOMATED TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

// Allow small delay for server startup
setTimeout(runTests, 500);
