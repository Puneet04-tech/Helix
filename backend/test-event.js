const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = 'mongodb+srv://chaturvedipuneet200_db_user:4BN60fzjPQIbeWn4@gdc.tbnbiig.mongodb.net/helix?appName=gdc';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('✅ Connected to MongoDB');
  
  // Create a test client with API key
  const clientsCollection = mongoose.connection.collection('clients');
  
  const testClient = {
    name: 'Demo Project',
    apiKey: 'demo-api-key-testing-12345',
    organizationId: 'helix-org',
    createdAt: new Date(),
    status: 'active'
  };
  
  try {
    const result = await clientsCollection.insertOne(testClient);
    console.log('✅ Test client created with ID:', result.insertedId);
    console.log('   API Key: demo-api-key-testing-12345');
  } catch (err) {
    if (err.code === 11000) {
      console.log('ℹ️  Client already exists (duplicate key)');
    } else {
      console.error('Error:', err.message);
    }
  }
  
  mongoose.connection.close();
  process.exit(0);
}).catch(err => {
  console.error('❌ MongoDB Connection failed:', err.message);
  process.exit(1);
});
