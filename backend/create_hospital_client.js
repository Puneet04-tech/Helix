const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://chaturvedipuneet200_db_user:4BN60fzjPQIbeWn4@gdc.tbnbiig.mongodb.net/helix?appName=gdc';

const clientSchema = new mongoose.Schema({
  name: String,
  apiKey: { type: String, index: true, required: true, unique: true },
  projectId: String,
  _id: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✓ Connected to MongoDB');
    const ClientModel = mongoose.model('Client', clientSchema, 'clients');
    
    // Create hospital client
    const hospitalClient = new ClientModel({
      _id: new mongoose.Types.ObjectId(),
      name: 'Hospital Management System',
      apiKey: 'pk_hospital_default',
      projectId: 'hospital_001',
    });

    try {
      await hospitalClient.save();
      console.log('✓ Hospital client created successfully!');
      console.log(`Project ID: hospital_001`);
      console.log(`API Key: pk_hospital_default`);
    } catch (error) {
      if (error.code === 11000) {
        console.log('ℹ️  Hospital client already exists (duplicate key)');
      } else {
        throw error;
      }
    }
    
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error('✗ Error:', err.message);
    process.exit(1);
  });
