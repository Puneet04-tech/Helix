const dotenv = require('dotenv');
const path = require('path');

// Load from explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Current working directory:', process.cwd());
console.log('ENV file path:', path.join(__dirname, '.env'));
console.log('TOKEN from process.env:', process.env.HUGGINGFACE_API_KEY);
console.log('TOKEN length:', process.env.HUGGINGFACE_API_KEY?.length);
console.log('First 20 chars:', process.env.HUGGINGFACE_API_KEY?.substring(0, 20));

// Try direct file read
const fs = require('fs');
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const lines = envContent.split('\n');
const tokenLine = lines.find(l => l.includes('HUGGINGFACE_API_KEY'));
console.log('\nDirect file read:');
console.log('Token line:', tokenLine);
