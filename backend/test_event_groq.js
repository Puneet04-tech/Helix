const axios = require('axios');

// Test event to trigger Groq analysis
const testEvent = {
  projectId: 'test-project-001',
  type: 'security_alert',
  severity: 'high',
  source: 'wifi_network',
  title: 'Unauthorized Access Attempt',
  description: 'Multiple failed authentication attempts detected on guest network. Potential brute force attack in progress.',
  timestamp: new Date().toISOString(),
  metadata: {
    ipAddress: '192.168.1.100',
    attemptCount: 15,
    timeWindow: '5 minutes',
    protocol: 'HTTP'
  }
};

async function sendEvent() {
  try {
    console.log('📤 Sending event to backend for Groq analysis...\n');
    console.log('Event:', JSON.stringify(testEvent, null, 2));
    
    const response = await axios.post('http://localhost:5000/events/ingest', testEvent, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'ag_5064ccdf-ecf6-4700-88d0-25eeafd2b3b6'
      },
      timeout: 15000
    });
    
    console.log('\n✓ Event sent successfully!');
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n✗ Error sending event:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

sendEvent();
