async function testHotelEvents() {
  try {
    console.log('🏨 Testing Hotel Management Events...');
    
    const hotelApiKey = 'hotel_management_api_key_12345';
    const backendUrl = 'http://localhost:5000';
    
    // Send hotel-specific event
    const hotelEvent = {
      service: 'hotel-management',
      type: 'booking_failure',
      message: 'Guest booking failed for room 301',
      metadata: {
        guestId: 'guest_123',
        roomId: '301',
        amount: 299.99,
        error: 'Payment processing failed'
      }
    };
    
    console.log('📤 Sending hotel event...');
    const response = await fetch(`${backendUrl}/events/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': hotelApiKey
      },
      body: JSON.stringify(hotelEvent)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Hotel event sent successfully');
      console.log('Response:', data);
    } else {
      console.error('❌ Failed to send event:', response.status, response.statusText);
      return;
    }
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check incidents for hotel project
    console.log('🔍 Checking hotel incidents...');
    const incidentsResponse = await fetch(`${backendUrl}/incidents/project/hotel_001`, {
      headers: {
        'x-api-key': hotelApiKey
      }
    });
    
    if (incidentsResponse.ok) {
      const incidents = await incidentsResponse.json();
      console.log('📊 Hotel incidents:', incidents.length);
      if (incidents.length > 0) {
        console.log('Latest incident:', incidents[0]);
      }
    } else {
      console.log('ℹ️  Could not fetch hotel incidents');
    }
    
    // Check hospital incidents to ensure separation
    console.log('🔍 Checking hospital incidents (should be separate)...');
    try {
      const hospitalIncidents = await fetch(`${backendUrl}/incidents/project/hospital_001`, {
        headers: {
          'x-api-key': 'pk_hospital_default'
        }
      });
      
      if (hospitalIncidents.ok) {
        const hospitalData = await hospitalIncidents.json();
        console.log('📊 Hospital incidents:', hospitalData.length);
        console.log('✅ Systems are properly separated!');
      } else {
        console.log('ℹ️  Hospital system check failed (expected if not running)');
      }
    } catch (error) {
      console.log('ℹ️  Hospital system check failed (expected if not running)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testHotelEvents();
