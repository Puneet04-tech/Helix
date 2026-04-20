const axios = require('axios');

async function debugAgentChain() {
  try {
    console.log('🔍 Debugging Agent Chain Execution...\n');

    // Create a simple incident
    const testIncident = {
      type: 'medical_incident',
      service: 'hospital-management',
      severity: 'critical',
      description: 'Debug agent chain execution',
      metadata: {
        patientStatus: 'Debug Test',
        department: 'Debug Department'
      }
    };

    console.log('📤 Creating incident to trigger agent chain...');
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

    // Wait progressively longer for agent chain to complete
    console.log('\n⏳ Waiting for agent chain to execute...');
    
    for (let i = 1; i <= 6; i++) {
      console.log(`   Waiting ${i * 10} seconds...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Try to get the incident and check agent execution
      try {
        const incidentResponse = await axios.get(
          `https://helix-ujly.onrender.com/incidents/${response.data.incidentId}`
        );
        
        const incident = incidentResponse.data;
        console.log(`\n📊 Check ${i}:`);
        console.log(`   Status: ${incident.status || 'unknown'}`);
        console.log(`   Detection Agent: ${incident.agentReasoning?.detectionAgent ? '✅ Executed' : '❌ Not executed'}`);
        console.log(`   Analysis Agent: ${incident.agentReasoning?.analysisAgent ? '✅ Executed' : '❌ Not executed'}`);
        console.log(`   Response Agent: ${incident.agentReasoning?.responseAgent ? '✅ Executed' : '❌ Not executed'}`);
        console.log(`   Comms Agent: ${incident.agentReasoning?.commsAgent ? '✅ Executed' : '❌ Not executed'}`);
        
        if (incident.agentReasoning?.commsAgent) {
          console.log('   🎉 Agent chain completed! Email notifications should have been sent!');
          break;
        }
        
        if (i === 6) {
          console.log('   ⚠️ Agent chain did not complete after 60 seconds');
          console.log('   🔧 This explains why no emails are sent from incidents');
        }
        
      } catch (getError) {
        console.log(`   ❌ Could not check incident: ${getError.response?.data?.message || getError.message}`);
      }
    }

  } catch (error) {
    console.error('Debug failed:', error.response?.data || error.message);
  }
}

debugAgentChain();
