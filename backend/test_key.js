const axios = require('axios');

// Get API key from environment or command line
const apiKey = process.argv[2] || process.env.HUGGINGFACE_API_KEY;

if (!apiKey) {
  console.error('❌ ERROR: No API key provided!');
  console.error('Usage: node test_key.js <your-hf-token>\n');
  console.error('Or set HUGGINGFACE_API_KEY in .env file');
  process.exit(1);
}

console.log('🔐 Testing HuggingFace Token Authorization...\n');
console.log(`Token: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);

async function testKey() {
  // Test 1: Verify token is valid
  console.log('Step 1: Verifying token validity...');
  try {
    const resp = await axios.get('https://huggingface.co/api/whoami', {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 10000
    });
    console.log('✅ Token is VALID');
    console.log(`   User: ${resp.data.name}`);
  } catch (err) {
    console.log('❌ Token is INVALID or EXPIRED');
    console.log(`   Error: ${err.response?.status} - ${err.response?.data?.error}`);
    process.exit(1);
  }

  console.log('\n---\n');

  // Test 2: Test inference API with zero-shot classification
  console.log('Step 2: Testing Inference API with facebook/bart-large-mnli...');
  try {
    const resp = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
      {
        inputs: 'Database timeout exceeded critical failure',
        parameters: {
          candidate_labels: ['anomaly', 'normal', 'warning']
        }
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 30000
      }
    );
    console.log('✅ Inference API WORKS!');
    console.log('\nClassification Results:');
    const { labels, scores } = resp.data;
    for (let i = 0; i < labels.length; i++) {
      console.log(`   ${i + 1}. ${labels[i]}: ${(scores[i] * 100).toFixed(1)}%`);
    }
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) {
      console.log('❌ Token not authorized for Inference API');
      console.log('   Make sure you selected "Make calls to the Inference API" permission');
    } else if (status === 410) {
      console.log('❌ API endpoint deprecated - check HuggingFace documentation');
    } else {
      console.log(`❌ Error: ${status}`);
      console.log(`   ${err.response?.data?.error || err.message}`);
    }
    process.exit(1);
  }

  console.log('\n---\n');
  console.log('✅ SUCCESS! Your token is properly authorized and working!');
  console.log('\nNow update your .env file with:');
  console.log(`HUGGINGFACE_API_KEY=${apiKey}`);
}

testKey().catch(console.error);
