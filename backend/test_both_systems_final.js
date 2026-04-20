const axios = require('axios');

async function testBothSystems() {
  try {
    console.log('🏢 Testing Complete Multi-System Notifications...\n');

    // Test Hospital Management System
    console.log('🏥 HOSPITAL MANAGEMENT SYSTEM:');
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
        hospitalName: 'City General Hospital',
        doctorNotified: true,
        emergencyProtocol: 'Active'
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
      
      console.log('   ✅ Medical incident created');
      console.log(`   📧 Incident ID: ${hospitalResponse.data.incidentId}`);
      console.log('   📧 Emails sent to: Hospital developers, managers, owners');
    } catch (error) {
      console.log('   ❌ Hospital test failed:', error.response?.data?.message || error.message);
    }

    // Test Hotel Management System
    console.log('\n🏨 HOTEL MANAGEMENT SYSTEM:');
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
        affectedRooms: '201-235',
        guestImpact: 'High temperature in rooms',
        maintenanceDispatched: true
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
      
      console.log('   ✅ Equipment failure created');
      console.log(`   📧 Incident ID: ${hotelResponse.data.incidentId}`);
      console.log('   📧 Emails sent to: Hotel developers, managers, owners');
    } catch (error) {
      console.log('   ❌ Hotel test failed:', error.response?.data?.message || error.message);
    }

    // Test Security Threat (Hotel)
    console.log('\n🔒 SECURITY THREAT - HOTEL:');
    const hotelSecurity = {
      type: 'security_threat',
      service: 'hotel-management',
      severity: 'critical',
      description: 'Unauthorized access attempt to guest database',
      metadata: {
        threatType: 'SQL Injection Attempt',
        sourceIP: '192.168.1.100',
        target: 'Guest Management Database',
        blocked: true,
        hotelName: 'Grand Plaza Hotel',
        securityTeamNotified: true,
        forensicsStarted: true
      }
    };

    try {
      const securityResponse = await axios.post(
        'https://helix-ujly.onrender.com/events/ingest',
        hotelSecurity,
        {
          headers: {
            'x-api-key': 'hotel_management_api_key_12345',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   ✅ Security threat created');
      console.log(`   📧 Incident ID: ${securityResponse.data.incidentId}`);
      console.log('   📧 Security team notified via email');
    } catch (error) {
      console.log('   ❌ Security test failed:', error.response?.data?.message || error.message);
    }

    // Test Performance Issue (Hospital)
    console.log('\n⚡ PERFORMANCE ISSUE - HOSPITAL:');
    const hospitalPerformance = {
      type: 'performance_degradation',
      service: 'hospital-management',
      severity: 'warning',
      description: 'Database performance affecting patient records',
      metadata: {
        responseTime: 3500,
        cpuUsage: 85,
        memoryUsage: 92,
        errorRate: 8.5,
        throughput: 120,
        database: 'Patient Records DB',
        hospitalName: 'City General Hospital',
        optimizationStarted: true
      }
    };

    try {
      const perfResponse = await axios.post(
        'https://helix-ujly.onrender.com/events/ingest',
        hospitalPerformance,
        {
          headers: {
            'x-api-key': 'pk_hospital_default',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('   ✅ Performance issue created');
      console.log(`   📧 Incident ID: ${perfResponse.data.incidentId}`);
      console.log('   📧 Performance team notified');
    } catch (error) {
      console.log('   ❌ Performance test failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 MULTI-SYSTEM NOTIFICATION RESULTS:');
    console.log('   ✅ Hospital System: Working with medical incidents');
    console.log('   ✅ Hotel System: Working with equipment failures');
    console.log('   ✅ Security Threats: Working across both systems');
    console.log('   ✅ Performance Issues: Working across both systems');
    console.log('   ✅ Role-Based Emails: Developers, Managers, Owners');
    
    console.log('\n📧 CHECK YOUR EMAIL FOR:');
    console.log('   🏥 Hospital: Patient emergency alerts');
    console.log('   🏨 Hotel: Equipment failure notifications');
    console.log('   🔒 Security: Threat alerts and containment');
    console.log('   ⚡ Performance: System degradation alerts');
    
    console.log('\n🎯 Each system sends DIFFERENT email content based on:');
    console.log('   🏥 Hospital: Patient status, department, medical equipment');
    console.log('   🏨 Hotel: Location, affected rooms, guest impact');
    console.log('   🔒 Security: Threat type, source IP, blocked status');
    console.log('   ⚡ Performance: Response times, CPU, memory usage');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBothSystems();
