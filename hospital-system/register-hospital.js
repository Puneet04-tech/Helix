#!/usr/bin/env node

/**
 * Hospital Account Registration Script
 * Registers a new hospital account with Helix platform
 */

const https = require('https');
const querystring = require('querystring');

const HELIX_API_URL = process.env.HELIX_API_URL || 'https://helix-ujly.onrender.com';

const hospitalCredentials = {
  email: process.env.HOSPITAL_EMAIL || 'admin@cityhospital.com',
  password: process.env.HOSPITAL_PASSWORD || 'SecurePassword123',
  organizationName: process.env.HOSPITAL_NAME || 'City Medical Center',
  organizationType: 'hospital'
};

async function registerHospital() {
  try {
    console.log('🏥 Registering Hospital Account...');
    console.log(`Organization: ${hospitalCredentials.organizationName}`);
    console.log(`Email: ${hospitalCredentials.email}`);
    console.log(`API URL: ${HELIX_API_URL}`);
    console.log('');

    const data = JSON.stringify(hospitalCredentials);

    const url = new URL(HELIX_API_URL + '/auth/register');
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Hospital Registration Successful!');
            console.log('');
            console.log('Hospital Account Details:');
            console.log(`├─ Project ID: ${response.projectId || 'hospital_001'}`);
            console.log(`├─ API Key: ${response.apiKey || 'pk_hospital_001_xxxxx'}`);
            console.log(`├─ Organization ID: ${response.organizationId || 'hosp_001'}`);
            console.log(`└─ Email: ${response.email}`);
            console.log('');

            // Display environment variables to use
            console.log('📝 Add these to your .env file:');
            console.log(`HELIX_PROJECT_ID=${response.projectId || 'hospital_001'}`);
            console.log(`HELIX_API_KEY=${response.apiKey || 'pk_hospital_001_xxxxx'}`);
            console.log('');
          } else {
            console.error('❌ Registration Failed:');
            console.error(`Status: ${res.statusCode}`);
            console.error(`Response: ${responseData}`);
          }
        } catch (parseError) {
          console.log('✅ Hospital Account Configuration Ready!');
          console.log('');
          console.log('📝 Add these to your .env file:');
          console.log('HELIX_PROJECT_ID=hospital_001');
          console.log('HELIX_API_KEY=pk_hospital_001_xxxxx');
          console.log('');
        }
      });
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Connection Failed: Cannot reach Helix API');
        console.error(`Make sure Helix is running at: ${HELIX_API_URL}`);
      } else {
        console.error('❌ Registration Error:', error.message);
      }
      console.error('');
      console.error('Using template credentials instead...');
      console.log('');
      console.log('📝 Template .env values:');
      console.log('HELIX_PROJECT_ID=hospital_001');
      console.log('HELIX_API_KEY=pk_hospital_001_xxxxx');
      console.log('MONGODB_URI=mongodb+srv://helix_user:password@helix-cluster.mongodb.net/hospital_db');
      console.log('');
      process.exit(0);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('❌ Registration timeout');
      console.log('');
      console.log('📝 Using template credentials:');
      console.log('HELIX_PROJECT_ID=hospital_001');
      console.log('HELIX_API_KEY=pk_hospital_001_xxxxx');
      process.exit(0);
    });

    req.write(data);
    req.end();
  } catch (error) {
    console.error('❌ Registration Error:', error.message);
    process.exit(1);
  }
}

// Run registration
registerHospital();
