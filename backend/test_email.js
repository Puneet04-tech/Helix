const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfiguration() {
  console.log('🔧 Testing Email Configuration...\n');

  try {
    // Create transporter with current env settings
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    console.log('📧 Email Settings:');
    console.log(`   From: ${process.env.NODEMAILER_EMAIL}`);
    console.log(`   Password: ${process.env.NODEMAILER_PASS ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Service: Gmail\n`);

    // Test connection
    console.log('🔄 Testing connection to Gmail...');
    await transporter.verify();
    console.log('✅ Gmail connection successful!\n');

    // Send test email
    const testEmail = {
      from: process.env.NODEMAILER_EMAIL,
      to: process.env.NODEMAILER_EMAIL, // Send to self for testing
      subject: '🧪 Helix Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🚀 Helix Notification System Test</h2>
          <p>This is a test email to verify the notification system is working correctly.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>📊 Test Results:</h3>
            <ul>
              <li>✅ Gmail Connection: Successful</li>
              <li>✅ Email Transport: Working</li>
              <li>✅ HTML Rendering: Working</li>
            </ul>
          </div>
          
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated test from the Helix notification system.
            If you receive this email, the configuration is working correctly!
          </p>
        </div>
      `
    };

    console.log('📤 Sending test email...');
    const result = await transporter.sendMail(testEmail);
    
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   To: ${testEmail.to}`);
    console.log(`   Subject: ${testEmail.subject}`);
    console.log('\n🎉 Email notification system is ready!');
    
  } catch (error) {
    console.error('❌ Email configuration test failed:');
    console.error('   Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Gmail Authentication Issues:');
      console.log('   1. Make sure 2-factor authentication is enabled');
      console.log('   2. Generate an App Password from Google Account settings');
      console.log('   3. Use the 16-character App Password (not regular password)');
      console.log('   4. Update NODEMAILER_PASS in your .env file');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Connection Issues:');
      console.log('   1. Check internet connection');
      console.log('   2. Verify Gmail credentials');
      console.log('   3. Check firewall settings');
    }
  }
}

testEmailConfiguration();
