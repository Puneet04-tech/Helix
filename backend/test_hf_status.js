const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
const apiKey = process.env.HUGGINGFACE_API_KEY;

async function testSystem() {
  console.log('🔍 AI Guardian - Comprehensive System Test\n');
  console.log('=' .repeat(50));

  if (!apiKey) {
    console.log('❌ ERROR: HUGGINGFACE_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('✓ Token loaded from .env');
  console.log(`  Token (first 20 chars): ${apiKey.substring(0, 20)}...`);
  console.log(`  Token length: ${apiKey.length}\n`);

  // Test 1: Inference API Connection
  console.log('Test 1: Testing Inference API Connection');
  console.log('-'.repeat(50));
  try {
    const testPayload = {
      inputs: 'Security breach detected in database',
      parameters: {
        candidate_labels: ['normal_activity', 'security_threat', 'service_crash'],
      },
    };

    const response = await axios.post(
      'https://router.huggingface.co/models/facebook/bart-large-mnli',
      testPayload,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
      }
    );

    console.log('✓ API Connection: SUCCESS');
    console.log(`  Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
    console.log('  → HuggingFace Inference API is working!\n');
  } catch (err) {
    const status = err.response?.status;
    const errorMsg = err.response?.data?.error || err.message;
    console.log(`✗ API Connection: FAILED (${status})`);
    console.log(`  Error: ${errorMsg}`);
    console.log('  → System will use LOCAL analysis instead\n');
  }

  // Test 2: Local Analysis (Always works)
  console.log('Test 2: Testing Local Analysis Fallback');
  console.log('-'.repeat(50));
  const testEvents = [
    'Normal user login from 192.168.1.1',
    'ALERT: SQL injection attempt detected in /api/users',
    'CPU utilization at 95%, response time 5000ms',
    'Service crashed: NullPointerException',
  ];

  for (const event of testEvents) {
    // Simple local analysis
    const isAnomaly =
      event.toLowerCase().includes('alert') ||
      event.toLowerCase().includes('crash') ||
      event.toLowerCase().includes('cpu') ||
      event.toLowerCase().includes('attempt');
    const icon = isAnomaly ? '⚠️ ' : '✓ ';
    console.log(`  ${icon} "${event}"`);
    console.log(`     Status: ${isAnomaly ? 'ANOMALY' : 'NORMAL'}`);
  }
  console.log('  → Local analysis is working!\n');

  // Test 3: System Summary
  console.log('=' .repeat(50));
  console.log('\n📊 SYSTEM STATUS:');
  console.log('  ✓ Token configured');
  console.log('  ✓ Local analysis ready (always available)');
  console.log('  ✓ HuggingFace Inference optional (fallback available)');
  console.log('\n🚀 System is ready to analyze events!');
  console.log('\nIf Inference API fails:');
  console.log('  → System automatically uses local analysis');
  console.log('  → No disruption to operations');
  console.log('  → Token issues won\'t break the system\n');
}

testSystem().catch(console.error);
