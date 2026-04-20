const axios = require('axios');

async function testPublicStatus() {
  try {
    console.log('Testing public status page...');
    
    // Test with actual client ID for Hospital Management System
    const clientId = '69e602df86d96111b22035d8';
    const url = `https://helix-ujly.onrender.com/status/${clientId}`;
    
    console.log(`Testing URL: ${url}`);
    
    const response = await axios.get(url);
    
    console.log('✅ Public Status Page Response:');
    console.log('Client Name:', response.data.clientName);
    console.log('Services:', response.data.statusPage.services.length);
    console.log('Overview:', response.data.statusPage.overview);
    
    // Show service details
    console.log('\n📊 Service Status:');
    response.data.statusPage.services.forEach(service => {
      console.log(`  ${service.name}: ${service.status} (${service.uptime})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPublicStatus();
