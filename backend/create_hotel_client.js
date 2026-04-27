const mongoose = require('mongoose');
require('dotenv').config();

async function createHotelClient() {
  try {
    console.log('🏨 Creating Hotel Management System Client...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
    
    // Check if hotel client already exists
    const existingHotel = await Client.findOne({ name: 'Hotel Management System' });
    if (existingHotel) {
      console.log('✅ Hotel Management System already exists');
      console.log(`   API Key: ${existingHotel.apiKey}`);
    } else {
      // Create hotel management client
      const hotelClient = new Client({
        name: 'Hotel Management System',
        apiKey: 'hotel_management_api_key_12345',
        projectId: 'hotel_001',
        userIds: [], // Will be populated with hotel staff
        services: ['hotel-management', 'guest-services', 'facility-management'],
        settings: {
          notifications: {
            email: true,
            sms: false,
            webhook: false
          },
          alertThresholds: {
            critical: 1,
            warning: 5,
            info: 10
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await hotelClient.save();
      console.log('✅ Hotel Management System created successfully');
      console.log(`   API Key: ${hotelClient.apiKey}`);
      console.log(`   Services: ${hotelClient.services.join(', ')}`);
    }
    
    await mongoose.disconnect();
    
    console.log('\n🎯 Now testing notifications for both systems...');
    
  } catch (error) {
    console.error('Error creating hotel client:', error.message);
  }
}

createHotelClient();
