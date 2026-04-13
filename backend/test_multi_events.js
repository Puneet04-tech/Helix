const axios = require('axios');

const events = [
  {
    projectId: 'test-project-001',
    type: 'security_alert',
    severity: 'high',
    source: 'wifi_network',
    title: 'SSH Brute Force Attack',
    description: 'SSH port 22 receiving multiple failed login attempts from external IP 203.0.113.45. Pattern matches known bot attack.',
    metadata: {
      ipAddress: '203.0.113.45',
      attemptCount: 25,
      port: 22,
      protocol: 'SSH'
    }
  },
  {
    projectId: 'test-project-001',
    type: 'security_alert',
    severity: 'critical',
    source: 'database',
    title: 'SQL Injection Attempt Detected',
    description: 'Malicious SQL query detected in database logs. Query attempts to access sensitive user data.',
    metadata: {
      query: 'SELECT * FROM users WHERE 1=1 OR 1=1',
      sourceIP: '192.168.1.50',
      timestamp: new Date().toISOString()
    }
  },
  {
    projectId: 'test-project-001',
    type: 'performance_anomaly',
    severity: 'high',
    source: 'api_gateway',
    title: 'API Response Time Spike',
    description: 'API /users endpoint experiencing 5000ms+ response times. 99th percentile latency at 8000ms.',
    metadata: {
      endpoint: '/api/users',
      p99Latency: 8000,
      errorRate: 0.15,
      requestsPerSecond: 450
    }
  }
];

async function sendEvents() {
  const apiKey = 'ag_5064ccdf-ecf6-4700-88d0-25eeafd2b3b6';
  
  for (let i = 0; i < events.length; i++) {
    try {
      console.log(`\n📤 Sending event ${i + 1}/${events.length}...`);
      console.log(`Title: ${events[i].title}`);
      
      const response = await axios.post('http://localhost:5000/events/ingest', events[i], {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        timeout: 15000
      });
      
      console.log(`✓ Response: analyzed=${response.data.analyzed}, reason=${response.data.reason}`);
      
      // Wait a bit between events
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`✗ Error: ${error.response?.data?.message || error.message}`);
    }
  }
  
  console.log('\n\n✅ All events sent! Check your dashboard for incidents created by Groq analysis.');
}

sendEvents();
