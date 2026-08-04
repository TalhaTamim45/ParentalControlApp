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

async function executePhysicalPairingFlow() {
  console.log('=== Physical Pairing Test Helper ===');
  
  // 1. Parent Login
  const loginRes = await makeRequest('POST', '/api/parent/login', {
    username: env.PARENT_USERNAME,
    password: env.PARENT_PASSWORD
  });
  console.log('[Step 4 - Parent Login] Status:', loginRes.status, 'Token issued:', !!loginRes.data.token);

  if (!loginRes.data.token) {
    console.error('Parent login failed:', loginRes.data);
    return;
  }
  const parentToken = loginRes.data.token;

  // 2. Generate Pairing Code
  const genRes = await makeRequest('POST', '/api/pairing/generate', null, {
    'x-parent-token': parentToken
  });
  console.log('[Step 5 - Generate Code] Status:', genRes.status, 'Code:', genRes.data.code, 'ExpiresAt:', new Date(genRes.data.expiresAt).toLocaleTimeString());

  console.log('\n--- INSTRUCTIONS FOR USER ---');
  console.log(`Pairing Code: ${genRes.data.code}`);
}

executePhysicalPairingFlow();
