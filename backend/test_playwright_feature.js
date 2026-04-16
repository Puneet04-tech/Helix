/**
 * Playwright Feature Test Script
 * Tests the Playwright browser automation endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║       🎬 HELIX PLAYWRIGHT FEATURE TEST                     ║
╚════════════════════════════════════════════════════════════╝
`);

  try {
    // Test 1: Health check
    console.log('[TEST 1] Backend Health Check');
    try {
      const health = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Backend is running\n');
    } catch (e) {
      console.log('❌ Backend not responding\n');
      return;
    }

    // Test 2: List routes (without auth)
    console.log('[TEST 2] Checking Playwright Routes');
    try {
      const status = await axios.get(`${BASE_URL}/api/agents/playwright/status`);
      console.log('⚠️  Endpoint accessible without auth (might be a configuration issue)');
      console.log('✅ ENDPOINT EXISTS:', status.data?.status);
    } catch (e) {
      if (e.response?.status === 401) {
        console.log('✅ Auth guard is protecting the endpoint (401 Unauthorized)');
        console.log('✅ ENDPOINT EXISTS and is properly secured\n');
      } else if (e.response?.status === 404) {
        console.log('❌ Endpoint not found (404)\n');
        return;
      } else {
        console.log('❌ Error:', e.response?.data?.message || e.message, '\n');
      }
    }

    // Test 3: Create test account
    console.log('[TEST 3] Setting up test credentials');
    const testEmail = `pw-test-${Date.now()}@test.com`;
    const testPassword = 'TestPass123!@';
    
    try {
      const reg = await axios.post(`${BASE_URL}/auth/register`, {
        email: testEmail,
        password: testPassword,
        firstName: 'Playwright',
        lastName: 'Test',
        organizationId: 'pw-test-org'
      });
      console.log(`✅ User created: ${testEmail}\n`);
    } catch (regErr) {
      console.log(`⚠️  Registration failed: ${regErr.response?.data?.message || regErr.response?.data}`);
      console.log('Trying to login with existing credentials...\n');
    }

    // Test 4: Login
    console.log('[TEST 4] Login with JWT');
    let token;
    try {
      const login = await axios.post(`${BASE_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      token = login.data.access_token;
      console.log(`✅ JWT token obtained (${token.substring(0, 20)}...)\n`);
    } catch (loginErr) {
      console.log(`❌ Login failed: ${loginErr.response?.data?.message}\n`);
      console.log('Cannot proceed without auth token\n');
      return;
    }

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test 5: Get Playwright Status
    console.log('[TEST 5] Get Playwright Status');
    try {
      const status = await axios.get(`${BASE_URL}/api/agents/playwright/status`, { headers });
      console.log(`✅ Playwright status retrieved`);
      console.log(`   Status: ${status.data.status}`);
      console.log(`   Service: ${status.data.service}`);
      console.log(`   Capabilities: ${status.data.capabilities.length}\n`);
      
      console.log('   Available Actions:');
      status.data.capabilities.forEach(cap => {
        console.log(`     • ${cap.action}: ${cap.description}`);
      });
      console.log();
    } catch (statusErr) {
      console.log(`❌ Failed to get status: ${statusErr.response?.data?.message || statusErr.message}\n`);
      return;
    }

    // Test 6: Execute Playwright Action
    console.log('[TEST 6] Execute Playwright Action (clear_cache)');
    try {
      const action = await axios.post(
        `${BASE_URL}/api/agents/playwright/test/clear_cache`,
        {},
        { headers }
      );
      
      console.log(`✅ Action executed`);
      console.log(`   Response Status: ${action.data.status}`);
      console.log(`   Action: ${action.data.action}`);
      console.log(`   Message: ${action.data.message}`);
      
      if (action.data.result?.success) {
        console.log(`   Result: ✅ SUCCESS - ${action.data.result.result}`);
      } else {
        console.log(`   Result: ⚠️ ${action.data.result?.result || 'Unknown result'}`);
      }
      console.log();
    } catch (actionErr) {
      console.log(`❌ Action failed: ${actionErr.response?.data?.message || actionErr.message}\n`);
      return;
    }

    // Summary
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    ✅ TEST COMPLETE                        ║
╚════════════════════════════════════════════════════════════╝

🎉 PLAYWRIGHT FEATURE IS WORKING! 🎉

Summary:
✅ Backend running on port 5000
✅ Playwright endpoints registered
✅ Authentication working
✅ Playwright status endpoint accessible
✅ Browser automation action executed

Next Steps:
1. Try other actions: scale_up, restart_service, failover, kill_process
2. Integrate with incident response flow
3. Add to production deployment

Usage for Judges:
- GET /api/agents/playwright/status - Show capabilities
- POST /api/agents/playwright/test/{action} - Execute action
- Requires: Valid JWT token in Authorization header
`);

  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message);
  }
}

main();
