const axios = require('axios');

async function testAnalyzeEndpoint() {
  try {
    console.log('Testing analyze endpoint...');
    
    // Test with a sample incident ID
    const incidentId = '69e65083b191797840e738fb';
    const url = `https://helix-ujly.onrender.com/incidents/${incidentId}/analyze`;
    
    console.log(`Testing URL: ${url}`);
    
    const response = await axios.post(url, {}, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAnalyzeEndpoint();
