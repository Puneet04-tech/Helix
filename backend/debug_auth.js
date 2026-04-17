const axios = require('axios');

async function test() {
  console.log('Debugging auth issue...\n');
  
  try {
    // Register
    const email = `debug-${Date.now()}@test.com`;
    const password = 'TestPass123!';
    
    console.log('[1] Registering user:', email);
    const reg = await axios.post('https://helix-ujly.onrender.com/auth/register', {
      email,
      password,
      firstName: 'Debug',
      lastName: 'User',
      organizationId: 'debug-org'
    }, { timeout: 10000 });
    console.log('✅ Registered');

    // Login
    console.log('\n[2] Logging in...');
    const login = await axios.post('https://helix-ujly.onrender.com/auth/login', {
      email,
      password
    }, { timeout: 10000 });
    
    console.log('✅ Login response:');
    console.log('Token:', login.data.access_token.substring(0, 50) + '...');
    console.log('Token length:', login.data.access_token.length);

    const token = login.data.access_token;

    // Test with token
    console.log('\n[3] Testing endpoint WITH token...');
    try {
      const res = await axios.get(
        'https://helix-ujly.onrender.com/api/agents/playwright/status',
        { 
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000 
        }
      );
      console.log('✅ Success! Response:');
      console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.log('❌ Error with auth:');
      console.log('Status:', e.response?.status);
      console.log('Headers sent:', { 'Authorization': `Bearer ${token.substring(0, 20)}...` });
      console.log('Error:', e.response?.data);
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
  }
}

test();
