const nodemailer = require('nodemailer');
require('dotenv').config();

async function debugEmailDelivery() {
  console.log('🔍 Debugging Email Delivery Issues...\n');

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    console.log('📧 Configuration Check:');
    console.log(`   Email: ${process.env.NODEMAILER_EMAIL}`);
    console.log(`   Password Length: ${process.env.NODEMAILER_PASS?.length || 0} characters`);
    console.log(`   Service: Gmail\n`);

    // Test connection
    console.log('🔄 Testing Gmail connection...');
    await transporter.verify();
    console.log('✅ Gmail connection: SUCCESS\n');

    // Send detailed test email
    const testEmail = {
      from: process.env.NODEMAILER_EMAIL,
      to: process.env.NODEMAILER_EMAIL,
      subject: '🚨 Helix Notification Test - CHECK YOUR INBOX',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #007bff;">
          <div style="background-color: #007bff; color: white; padding: 15px; text-align: center; margin: -20px -20px 20px -20px;">
            <h1 style="margin: 0;">🚨 HELIX NOTIFICATION TEST</h1>
            <p style="margin: 5px 0 0 0;">If you see this email, notifications are working!</p>
          </div>
          
          <div style="padding: 20px 0;">
            <h2>📧 Email Delivery Test Results:</h2>
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <h3 style="color: #155724; margin-top: 0;">✅ SUCCESS INDICATORS:</h3>
              <ul style="color: #155724;">
                <li>Gmail Connection: Successful</li>
                <li>Email Transport: Working</li>
                <li>Message Queued: Yes</li>
                <li>Message ID: Will be shown below</li>
              </ul>
            </div>
            
            <h3>🔍 What to Check:</h3>
            <ol>
              <li><strong>Spam Folder:</strong> Check your Gmail spam/promotions folders</li>
              <li><strong>All Mail:</strong> Look in "All Mail" folder</li>
              <li><strong>Filters:</strong> Check if Gmail filters are moving the email</li>
              <li><strong>Tab Organization:</strong> Check Primary, Social, Promotions tabs</li>
            </ol>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; border: 1px solid #ffeaa7;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ TROUBLESHOOTING:</h3>
              <p style="color: #856404; margin: 5px 0;">If you don't see this email within 2 minutes:</p>
              <ul style="color: #856404;">
                <li>Check Gmail spam folder</li>
                <li>Look in "All Mail" folder</li>
                <li>Verify email address is correct</li>
                <li>Check if Gmail is blocking the sender</li>
              </ul>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; margin: 20px -20px -20px -20px; text-align: center; border-top: 2px solid #007bff;">
            <p style="margin: 0; color: #6c757d;">
              <strong>Sent:</strong> ${new Date().toLocaleString()}<br>
              <strong>From:</strong> ${process.env.NODEMAILER_EMAIL}<br>
              <strong>To:</strong> ${process.env.NODEMAILER_EMAIL}
            </p>
          </div>
        </div>
      `
    };

    console.log('📤 Sending test email...');
    const result = await transporter.sendMail(testEmail);
    
    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}`);
    console.log(`   Accepted: ${result.accepted}`);
    console.log(`   Rejected: ${result.rejected}`);
    console.log(`   Pending: ${result.pending}`);
    
    console.log('\n📬 WHERE TO CHECK THE EMAIL:');
    console.log('   1. Gmail Inbox (Primary tab)');
    console.log('   2. Gmail Spam folder');
    console.log('   3. Gmail "All Mail" folder');
    console.log('   4. Gmail Promotions/Social tabs');
    console.log('   5. Check email filters');
    
    console.log('\n⏰ Email should arrive within 1-2 minutes');
    console.log('🔍 If not received, check Gmail delivery logs');
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Connection Issues - Check:');
      console.log('   - Internet connection');
      console.log('   - Firewall settings');
      console.log('   - Gmail service status');
    }
  }
}

debugEmailDelivery();
