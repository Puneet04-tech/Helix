const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const apiKey = process.env.HUGGINGFACE_API_KEY;

console.log('Token being used:', apiKey);
console.log('Token length:', apiKey?.length);
console.log('\n--- Testing whoami endpoint ---\n');

axios.get('https://huggingface.co/api/whoami', {
  headers: { 
    Authorization: `Bearer ${apiKey}`,
    'User-Agent': 'Node.js'
  }
}).then(res => {
  console.log('✓ SUCCESS');
  console.log(res.data);
}).catch(err => {
  console.log('✗ FAILED');
  console.log('Status:', err.response?.status);
  console.log('Status Text:', err.response?.statusText);
  console.log('Error:', err.response?.data);
  console.log('\nFull response:', err.response);
});
