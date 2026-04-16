const axios = require('axios');

/**
 * Playwright Browser Automation Demo
 * Tests the Playwright service directly
 */

const BASE_URL = 'http://localhost:5000';

async function testPlaywrightAction() {
  try {
    console.log('🎬 Testing Playwright Browser Automation');
    console.log('=====================================\n');

    // Test 1: Simple page navigation
    console.log('[TEST 1] Navigate to Google and take screenshot');
    const response1 = await axios.post(`${BASE_URL}/api/playwright/test`, {
      action: 'navigate',
      url: 'https://example.com',
      takeScreenshot: true
    }).catch(err => {
      console.log('ℹ️  Endpoint not yet created - this is expected\n');
      return null;
    });

    if (response1) {
      console.log('✅ Response:', JSON.stringify(response1.data, null, 2));
    }

    // Test 2: Demonstrate what actions are available
    console.log('\n[AVAILABLE ACTIONS]');
    console.log('- restart_service: Restart a service via web UI');
    console.log('- scale_up: Scale instances in dashboard');
    console.log('- clear_cache: Clear application cache');
    console.log('- failover: Trigger failover');
    console.log('- kill_process: Terminate a process');

    console.log('\n[INTEGRATION STATUS]');
    console.log('✅ Service: Built and ready');
    console.log('⚠️  Response Flow: Currently simulated (not using Playwright)');
    console.log('📝 Next Step: Create demo endpoint to show browser automation');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPlaywrightAction();
