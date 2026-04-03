const axios = require('axios');

// Set via environment variable: HUGGINGFACE_API_KEY
const apiKey = process.env.HUGGINGFACE_API_KEY || 'YOUR_HUGGINGFACE_API_KEY';
const newEndpoint = 'https://router.huggingface.co/models/facebook/bart-large-mnli';

async function testNewEndpoint() {
  console.log('=== Testing New HuggingFace Endpoint (router.huggingface.co) ===\n');

  const payload = {
    inputs: 'Database timeout exceeded critical failure and crash',
    parameters: {
      candidate_labels: [
        'normal_activity',
        'security_threat',
        'performance_degradation',
        'service_crash',
        'unauthorized_access',
        'rate_limit_exceeded'
      ]
    }
  };

  console.log('Endpoint:', newEndpoint);
  console.log('Model: facebook/bart-large-mnli');
  console.log('Input:', 'Database timeout exceeded critical failure and crash\n');

  try {
    console.log('Calling API...');
    const resp = await axios.post(newEndpoint, payload, {
      headers: { 
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✓ SUCCESS!\n');
    console.log('Response:');
    console.log(JSON.stringify(resp.data, null, 2));
    
    const { labels, scores } = resp.data;
    console.log('\nAnalysis:');
    for (let i = 0; i < labels.length; i++) {
      console.log(`  ${i + 1}. ${labels[i]}: ${(scores[i] * 100).toFixed(1)}%`);
    }
  } catch (error) {
    const status = error.response?.status || 'unknown';
    console.log(`✗ FAILED (${status})`);
    console.log('\nError Response:');
    console.log(JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

testNewEndpoint();
