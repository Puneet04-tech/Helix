const mongoose = require('mongoose');
require('dotenv').config();

async function checkClients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
    const clients = await Client.find({}).lean();
    
    console.log(`Found ${clients.length} clients:`);
    clients.forEach(client => {
      console.log(`  ID: ${client._id}`);
      console.log(`  Name: ${client.name}`);
      console.log(`  Status Summary:`, client.statusSummary);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkClients();
