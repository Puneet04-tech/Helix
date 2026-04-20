require('dotenv').config();

console.log('🔍 Checking Environment Variables for Email Configuration...\n');

// Email Configuration
console.log('📧 Email Configuration:');
console.log(`NODEMAILER_EMAIL: ${process.env.NODEMAILER_EMAIL || '❌ NOT SET'}`);
console.log(`NODEMAILER_PASS: ${process.env.NODEMAILER_PASS ? '✅ SET' : '❌ NOT SET'}`);

// Required API Keys
console.log('\n🔑 API Keys:');
console.log(`GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
console.log(`HUGGINGFACE_API_KEY: ${process.env.HUGGINGFACE_API_KEY ? '✅ SET' : '❌ NOT SET'}`);

// Database
console.log('\n🗄️ Database:');
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET'}`);

// JWT
console.log('\n🔐 Authentication:');
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET'}`);

// URLs
console.log('\n🌐 URLs:');
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || '❌ NOT SET'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || '❌ NOT SET'}`);

// Check for Gmail-specific requirements
console.log('\n📬 Gmail Requirements:');
const email = process.env.NODEMAILER_EMAIL;
if (email && email.includes('@gmail.com')) {
  console.log('✅ Using Gmail - Make sure to:');
  console.log('   1. Enable 2-factor authentication on your Gmail account');
  console.log('   2. Generate an App Password (16 characters)');
  console.log('   3. Use App Password as NODEMAILER_PASS');
  console.log('   4. NOT your regular Gmail password');
} else if (email) {
  console.log('✅ Using custom email provider');
} else {
  console.log('❌ No email configured');
}

console.log('\n🎯 Summary:');
const emailConfigured = process.env.NODEMAILER_EMAIL && process.env.NODEMAILER_PASS;
const apiKeysConfigured = process.env.GROQ_API_KEY && process.env.HUGGINGFACE_API_KEY;
const dbConfigured = process.env.MONGODB_URI;

if (emailConfigured && apiKeysConfigured && dbConfigured) {
  console.log('✅ All critical configurations are set!');
} else {
  console.log('❌ Some configurations are missing - notifications may not work');
}
