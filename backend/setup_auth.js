const axios = require('axios');

async function setupAuth() {
  try {
    // Register a test user
    console.log('📝 Registering test user...\n');
    
    const registerRes = await axios.post('http://localhost:5000/auth/register', {
      email: 'test@helix.local',
      password: 'Test@12345',
      firstName: 'Test',
      lastName: 'User',
      organizationId: 'test-org-001'
    });
    
    console.log('✓ User registered');
    console.log('Response:', registerRes.data);
    
    // Login
    console.log('\n🔐 Logging in...\n');
    const loginRes = await axios.post('http://localhost:5000/auth/login', {
      email: 'test@helix.local',
      password: 'Test@12345'
    });
    
    console.log('✓ Login successful');
    console.log('Token:', loginRes.data.access_token);
    
    // Generate API key
    console.log('\n🔑 Generating API key...\n');
    const apiKeyRes = await axios.post(
      'http://localhost:5000/auth/api-key/generate',
      {},
      {
        headers: {
          'Authorization': `Bearer ${loginRes.data.access_token}`
        }
      }
    );
    
    console.log('✓ API key generated');
    console.log('API Key:', apiKeyRes.data.apiKey);
    console.log('\n✅ Setup complete! Use this API key for events:\n');
    console.log(`X-API-Key: ${apiKeyRes.data.apiKey}`);
    
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ User already exists');
      // Try to login
      try {
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
          email: 'test@helix.local',
          password: 'Test@12345'
        });
        console.log('✓ Login successful');
        console.log('Token:', loginRes.data.access_token);
        
        // Generate API key
        console.log('\n🔑 Generating API key...\n');
        const apiKeyRes = await axios.post(
          'http://localhost:5000/auth/api-key/generate',
          {},
          {
            headers: {
              'Authorization': `Bearer ${loginRes.data.access_token}`
            }
          }
        );
        
        console.log('✓ API key generated');
        console.log('API Key:', apiKeyRes.data.apiKey);
        console.log('\n✅ Setup complete! Use this API key for events:\n');
        console.log(`X-API-Key: ${apiKeyRes.data.apiKey}`);
      } catch (e) {
        console.error('Failed:', e.response?.data || e.message);
      }
    } else {
      console.error('Error:', error.response?.data || error.message);
    }
  }
}

setupAuth();
