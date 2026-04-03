const mongoose = require('mongoose');
const crypto = require('crypto');

// Use the correct URI from .env
const mongoUri = 'key';

const clientSchema = new mongoose.Schema({
  name: String,
  apiKey: { type: String, index: true, required: true },
  projectId: String,
  _id: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
}, { collection: 'clients' });

async function createClient() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');
    
    const ClientModel = mongoose.model('Client', clientSchema);
    
    // Generate API key
    const apiKey = 'test-local-classifier-key';
    
    // Check if already exists
    const existing = await ClientModel.findOne({ apiKey });
    if (existing) {
      console.log('✓ Client already exists with API Key:' , apiKey);
      await mongoose.disconnect();
      return;
    }
    
    const client = new ClientModel({
      _id: new mongoose.Types.ObjectId(),
      name: 'Local Classifier Test',
      apiKey: apiKey,
      projectId: 'test-org',
    });

    await client.save();
    console.log('✓ Client created successfully!');
    console.log(`✓ API Key: ${apiKey}`);
    console.log(`✓ Project ID: test-org`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

createClient();
