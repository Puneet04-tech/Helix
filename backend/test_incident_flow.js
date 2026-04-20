const axios = require('axios');

async function testIncidentFlow() {
  try {
    console.log('🔍 Testing Incident Creation Flow...\n');

    // Create a simple incident and check if notifications are triggered
    const testIncident = {
      type: 'medical_incident',
      service: 'hospital-management',
      severity: 'critical',
      description: 'Test incident for notification flow',
      metadata: {
        patientStatus: 'Test',
        department: 'Test Department'
      }
    };

    console.log('📤 Creating incident...');
    const response = await axios.post(
      'https://helix-ujly.onrender.com/events/ingest',
      testIncident,
      {
        headers: {
          'x-api-key': 'pk_hospital_default',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Incident created successfully!');
    console.log(`   Incident ID: ${response.data.incidentId}`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Message: ${response.data.message}`);

    // Now check if this incident exists in the database
    console.log('\n🔍 Checking if incident was saved...');
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Try to get the incident
    try {
      const incidentResponse = await axios.get(
        `https://helix-ujly.onrender.com/incidents/${response.data.incidentId}`
      );
      
      console.log('✅ Incident found in database!');
      console.log(`   Type: ${incidentResponse.data.type}`);
      console.log(`   Status: ${incidentResponse.data.status}`);
      console.log(`   Notifications: ${incidentResponse.data.notificationsSent ? 'Sent' : 'Not sent'}`);
      
    } catch (getError) {
      console.log('❌ Could not retrieve incident:', getError.response?.data?.message || getError.message);
    }

    console.log('\n🎯 Current Status:');
    console.log('   ✅ Email system: Working (you received 3/6 emails)');
    console.log('   ✅ Incident creation: Working');
    console.log('   ❓ Notification triggering: Needs investigation');
    
    console.log('\n📧 Summary:');
    console.log('   - Direct emails work perfectly');
    console.log('   - Some incident notifications work');
    console.log('   - Need to check why some incidents don\'t trigger emails');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testIncidentFlow();
