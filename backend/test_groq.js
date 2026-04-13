const axios = require('axios');

async function testGroq() {
  console.log('=== Testing Groq API ===\n');

  try {
    // First, let's test a simple Groq API call directly
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      console.error('❌ GROQ_API_KEY not set in environment');
      process.exit(1);
    }
    
    console.log('Testing Groq API directly...');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: 'What is 2+2?'
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✓ Groq API Test Passed!');
    console.log('Response:', response.data.choices[0].message.content);
  } catch (error) {
    console.log('✗ Groq API Test Failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    console.log('Message:', error.message);
  }
}

testGroq();
