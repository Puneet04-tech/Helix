// Drop incidents collection to force recreation with new schema
const mongoose = require('mongoose');
require('dotenv').config();

async function dropAndReconnect() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/helix';
    
    console.log('🔗 Connecting to MongoDB...');
    console.log('Using URI:', mongoUri.substring(0, 50) + '...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });

    const db = mongoose.connection.db;
    console.log('✅ Connected');

    // Check collections
    const collections = await db.listCollections().toArray();
    const hasIncidents = collections.some(c => c.name === 'incidents');

    if (hasIncidents) {
      console.log('🗑️  Dropping incidents collection...');
      await db.dropCollection('incidents');
      console.log('✅ Incidents collection dropped successfully');
      console.log('📝 New schema will be created on next save (without enum validation)');
    } else {
      console.log('ℹ️  Incidents collection does not exist yet');
    }

    await mongoose.connection.close();
    console.log('✅ Done. Collection dropped.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropAndReconnect();
