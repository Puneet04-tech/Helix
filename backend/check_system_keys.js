const mongoose = require('mongoose');
require('dotenv').config();

async function checkSystemKeys() {
  try {
    console.log('🔍 Checking API Keys for All Systems...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
    const clients = await Client.find({}).lean();
    
    console.log('📋 Available Systems and API Keys:');
    clients.forEach(client => {
      console.log(`   🏢 ${client.name}:`);
      console.log(`      📧 API Key: ${client.apiKey}`);
      console.log(`      👥 Users: ${client.userIds?.length || 0}`);
      console.log(`      🏥 Services: ${client.services?.join(', ') || 'All services'}`);
      console.log('');
    });
    
    await mongoose.disconnect();
    
    console.log('🎯 System Coverage:');
    console.log('   ✅ Hospital Management: Medical incidents, patient care');
    console.log('   ✅ Hotel Management: Equipment failures, guest issues');
    console.log('   ✅ Security Systems: Threats, unauthorized access');
    console.log('   ✅ Performance: All systems - CPU, memory, database');
    console.log('   ✅ Role-Based: Developers, Managers, Owners');
    
    console.log('\n📧 Notification System Features:');
    console.log('   🏥 Hospital: Patient status, department, medical equipment');
    console.log('   🏨 Hotel: Location, affected rooms, guest impact');
    console.log('   🔒 Security: Threat type, source IP, containment actions');
    console.log('   ⚡ Performance: Response times, resource usage, bottlenecks');
    console.log('   📊 All Systems: Automatic actions, status updates, role-specific content');
    
  } catch (error) {
    console.error('Error checking systems:', error.message);
  }
}

checkSystemKeys();
