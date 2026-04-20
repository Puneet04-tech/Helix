// Drop incidents collection to force recreation with new schema
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/helix';

async function dropIncidentsCollection() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('helix');
    
    console.log('🔍 Checking collections...');
    const collections = await db.listCollections().toArray();
    const hasIncidents = collections.some(c => c.name === 'incidents');
    
    if (hasIncidents) {
      console.log('🗑️  Dropping incidents collection...');
      await db.collection('incidents').drop();
      console.log('✅ Incidents collection dropped successfully');
    } else {
      console.log('ℹ️  Incidents collection does not exist');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

dropIncidentsCollection();
