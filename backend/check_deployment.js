const axios = require('axios');

async function checkDeployment() {
  try {
    console.log('🔍 Checking if fix was deployed...\n');

    // Test a simple incident to see if notifications work
    const testIncident = {
      type: 'medical_incident',
      service: 'hospital-management',
      severity: 'critical',
      description: 'Test incident after fix deployment',
      metadata: {
        patientStatus: 'Test Patient',
        department: 'Test Department'
      }
    };

    console.log('📤 Creating test incident...');
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

    console.log('✅ Incident created!');
    console.log(`   Incident ID: ${response.data.incidentId}`);
    console.log(`   Status: ${response.data.status}`);

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Try to get the incident to see if it was processed
    try {
      const incidentResponse = await axios.get(
        `https://helix-ujly.onrender.com/incidents/${response.data.incidentId}`
      );
      
      console.log('\n📊 Incident Details:');
      console.log(`   Type: ${incidentResponse.data.type}`);
      console.log(`   Status: ${incidentResponse.data.status}`);
      console.log(`   Agent Reasoning: ${incidentResponse.data.agentReasoning ? 'Yes' : 'No'}`);
      console.log(`   Comms Agent: ${incidentResponse.data.agentReasoning?.commsAgent ? 'Yes' : 'No'}`);
      
      if (incidentResponse.data.agentReasoning?.commsAgent) {
        console.log('   ✅ commsAgent was called');
        console.log('   ✅ Email notifications should have been sent');
      } else {
        console.log('   ❌ commsAgent was NOT called');
        console.log('   ❌ Email notifications were NOT sent');
      }
      
    } catch (getError) {
      console.log('❌ Could not retrieve incident:', getError.response?.data?.message || getError.message);
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

checkDeployment();
