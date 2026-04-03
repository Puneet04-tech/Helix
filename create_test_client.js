const mongoose = require('mongoose');
const crypto = require('crypto');

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://chaturvedipuneet200_db_user:AI%40Guardian%402025@gdc.zn896.mongodb.net/ai-guardian?retryWrites=true&w=majority';

const clientSchema = new mongoose.Schema({
  name: String,
  apiKey: { type: String, index: true, required: true },
  projectId: String,
  _id: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✓ Connected to MongoDB');
    const ClientModel = mongoose.model('Client', clientSchema, 'clients');
    
    // Generate API key
    const apiKey = 'test-classifier-key-' + crypto.randomBytes(8).toString('hex');
    
    const client = new ClientModel({
      _id: new mongoose.Types.ObjectId(),
      name: 'Local Classifier Test',
      apiKey: apiKey,
      projectId: 'test-org',
    });

    return client.save().then(() => {
      console.log('✓ Client created successfully!');
      console.log(`API Key: ${apiKey}`);
      return mongoose.disconnect();
    });
  })
  .catch(err => {
    console.error('✗ Error:', err.message);
    process.exit(1);
  });
