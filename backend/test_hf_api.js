const axios = require('axios');

const apiKey = 'YOUR_HUGGINGFACE_API_KEY';

async function testHuggingFace() {
  console.log('=== Testing HuggingFace API ===\n');

  // Test 1: Simple sentiment analysis model
  const model1 = 'distilbert-base-uncased-finetuned-sst-2-english';
  const url1 = `https://api-inference.huggingface.co/models/${model1}`;
  const payload1 = {
    inputs: 'This is a crisis situation with security threats and failures'
  };

  console.log(`Model 1: ${model1}`);
  try {
    const resp = await axios.post(url1, payload1, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 30000
    });
    console.log('✓ SUCCESS');
    console.log('Response:', JSON.stringify(resp.data, null, 2));
  } catch (error) {
    const status = error.response?.status || 'unknown';
    console.log(`✗ FAILED (${status})`);
    console.log('Error:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 2: Zero-shot classification
  const model2 = 'facebook/bart-large-mnli';
  const url2 = `https://api-inference.huggingface.co/models/${model2}`;
  const payload2 = {
    inputs: 'Database timeout exceeded critical failure',
    parameters: {
      candidate_labels: ['anomaly', 'normal', 'warning']
    }
  };

  console.log(`Model 2: ${model2}`);
  try {
    const resp = await axios.post(url2, payload2, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 30000
    });
    console.log('✓ SUCCESS');
    console.log('Response:', JSON.stringify(resp.data, null, 2));
  } catch (error) {
    const status = error.response?.status || 'unknown';
    console.log(`✗ FAILED (${status})`);
    console.log('Error:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 3: Try a simpler model that definitely works
  const model3 = 'gpt2';
  const url3 = `https://api-inference.huggingface.co/models/${model3}`;
  const payload3 = {
    inputs: 'There is a database'
  };

  console.log(`Model 3: ${model3}`);
  try {
    const resp = await axios.post(url3, payload3, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 30000
    });
    console.log('✓ SUCCESS');
    console.log('Response (first 200 chars):', JSON.stringify(resp.data).substring(0, 200));
  } catch (error) {
    const status = error.response?.status || 'unknown';
    console.log(`✗ FAILED (${status})`);
    console.log('Error:', error.response?.data || error.message);
  }
}

testHuggingFace().catch(console.error);
