const axios = require('axios');

async function testEquipmentIncident() {
  try {
    const response = await axios.post('http://localhost:3001/events/ingest', {
      type: 'incident_detected',
      service: 'hospital-management',
      message: 'Equipment malfunction detected',
      metadata: {
        incidentType: 'equipment',  // This should be mapped to 'equipment_failure'
        severity: 'medium',
        description: 'MRI machine is not functioning properly',
        unit: 'Radiology',
        incidentId: 'test-' + Date.now()
      }
    }, {
      headers: {
        'x-api-key': 'pk_hospital_001_default',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success! Equipment incident created:');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error creating equipment incident:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Message:', error.message);
    }
  }
}

testEquipmentIncident();
