const axios = require('axios');

async function testRealIncidentEmails() {
  try {
    console.log('🏢 Testing REAL Hotel & Hospital Incident Emails...\n');

    // Test Hospital Medical Incident
    console.log('🏥 Testing HOSPITAL Medical Incident:');
    const hospitalIncident = {
      type: 'medical_incident',
      service: 'hospital-management',
      severity: 'critical',
      description: 'Patient emergency - cardiac arrest detected',
      metadata: {
        patientStatus: 'Critical',
        department: 'Emergency Room',
        equipment: 'Defibrillator',
        patientId: 'HOSP-00123',
        hospitalName: 'City General Hospital'
      }
    };

    try {
      const hospitalResponse = await axios.post(
        'https://helix-ujly.onrender.com/events/ingest',
        hospitalIncident,
        {
          headers: {
            'x-api-key': 'pk_hospital_default',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   ✅ Hospital incident created');
      console.log(`   📧 Incident ID: ${hospitalResponse.data.incidentId}`);
      console.log('   📧 CHECK EMAIL for: "🚨 Medical Emergency Alert"');
      
    } catch (error) {
      console.log('   ❌ Hospital test failed:', error.response?.data?.message || error.message);
    }

    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test Hotel Equipment Failure
    console.log('\n🏨 Testing HOTEL Equipment Failure:');
    const hotelIncident = {
      type: 'equipment_failure',
      service: 'hotel-management',
      severity: 'warning',
      description: 'HVAC system failure affecting guest rooms',
      metadata: {
        equipmentType: 'HVAC System',
        equipmentId: 'HVAC-MAIN-01',
        location: 'Main Building - Floor 2-5',
        failureMode: 'Compressor failure',
        hotelName: 'Grand Plaza Hotel',
        affectedRooms: '201-235'
      }
    };

    try {
      const hotelResponse = await axios.post(
        'https://helix-ujly.onrender.com/events/ingest',
        hotelIncident,
        {
          headers: {
            'x-api-key': 'hotel_management_api_key_12345',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   ✅ Hotel incident created');
      console.log(`   📧 Incident ID: ${hotelResponse.data.incidentId}`);
      console.log('   📧 CHECK EMAIL for: "🔧 Equipment Failure Alert"');
      
    } catch (error) {
      console.log('   ❌ Hotel test failed:', error.response?.data?.message || error.message);
    }

    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test Security Threat
    console.log('\n🔒 Testing SECURITY Threat:');
    const securityIncident = {
      type: 'security_threat',
      service: 'hotel-management',
      severity: 'critical',
      description: 'Unauthorized access attempt detected',
      metadata: {
        threatType: 'SQL Injection Attempt',
        sourceIP: '192.168.1.100',
        target: 'Guest Management Database',
        blocked: true,
        hotelName: 'Grand Plaza Hotel'
      }
    };

    try {
      const securityResponse = await axios.post(
        'https://helix-ujly.onrender.com/events/ingest',
        securityIncident,
        {
          headers: {
            'x-api-key': 'hotel_management_api_key_12345',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   ✅ Security incident created');
      console.log(`   📧 Incident ID: ${securityResponse.data.incidentId}`);
      console.log('   📧 CHECK EMAIL for: "🚨 Security Threat Alert"');
      
    } catch (error) {
      console.log('   ❌ Security test failed:', error.response?.data?.message || error.message);
    }

    console.log('\n📧 EMAILS TO CHECK IN YOUR INBOX:');
    console.log('   🏥 "🚨 Medical Emergency Alert" (Hospital)');
    console.log('   🔧 "🔧 Equipment Failure Alert" (Hotel)');
    console.log('   🔒 "🚨 Security Threat Alert" (Security)');
    
    console.log('\n🎯 Each email will have DIFFERENT content:');
    console.log('   🏥 Hospital: Patient status, department, medical equipment');
    console.log('   🏨 Hotel: Location, affected rooms, guest impact');
    console.log('   🔒 Security: Threat type, source IP, blocked status');
    
    console.log('\n⏰ Emails should arrive within 1-2 minutes');
    console.log('📬 Check Primary inbox, Spam folder, and All Mail');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRealIncidentEmails();
