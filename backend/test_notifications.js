const axios = require('axios');

async function testNotifications() {
  try {
    console.log('Testing notification system with different incident types...\n');

    const testIncidents = [
      {
        type: 'medical_incident',
        service: 'hospital-management',
        severity: 'critical',
        description: 'Patient emergency detected',
        metadata: {
          patientStatus: 'Critical',
          department: 'Emergency',
          equipment: 'Ventilator'
        }
      },
      {
        type: 'equipment_failure',
        service: 'hospital-management',
        severity: 'warning',
        description: 'Medical equipment malfunction',
        metadata: {
          equipmentType: 'MRI Scanner',
          equipmentId: 'MRI-001',
          location: 'Radiology Department',
          failureMode: 'Power supply failure'
        }
      },
      {
        type: 'security_threat',
        service: 'api-gateway',
        severity: 'critical',
        description: 'Unauthorized access attempt detected',
        metadata: {
          threatType: 'SQL Injection Attempt',
          sourceIP: '192.168.1.100',
          target: 'Authentication Service',
          blocked: true
        }
      },
      {
        type: 'performance_degradation',
        service: 'database',
        severity: 'warning',
        description: 'Database performance issues',
        metadata: {
          responseTime: 2500,
          cpuUsage: 85,
          memoryUsage: 92,
          errorRate: 5.2,
          throughput: 150
        }
      }
    ];

    for (const incident of testIncidents) {
      console.log(`Testing ${incident.type}...`);
      
      try {
        const response = await axios.post(
          'https://helix-ujly.onrender.com/events/ingest',
          incident,
          {
            headers: {
              'x-api-key': 'hospital-management-key-12345',
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`✅ ${incident.type} created successfully`);
        console.log(`   Incident ID: ${response.data.incidentId}`);
        console.log(`   Status: ${response.data.status}\n`);
        
        // Wait a bit between incidents
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Failed to create ${incident.type}:`, error.response?.data || error.message);
      }
    }
    
    console.log('\n🎉 Notification system test completed!');
    console.log('Check your email for role-based notifications (developer, manager, owner)');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testNotifications();
