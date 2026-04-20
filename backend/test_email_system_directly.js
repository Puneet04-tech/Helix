const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailSystemDirectly() {
  try {
    console.log('🔧 Testing Email System Directly (Bypassing Incident Creation)...\n');

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    // Test 1: Hospital Medical Incident Email
    console.log('🏥 Testing Hospital Medical Email:');
    const hospitalEmail = {
      from: process.env.NODEMAILER_EMAIL,
      to: process.env.NODEMAILER_EMAIL,
      subject: '[CRITICAL] Medical Incident on hospital-management',
      html: `
        <h2>🚨 Medical Emergency Alert</h2>
        <p><strong>Facility</strong>: Test Hospital</p>
        <p><strong>Service</strong>: hospital-management</p>
        <p><strong>Incident ID</strong>: TEST-${Date.now()}</p>
        <p><strong>Time</strong>: ${new Date().toISOString()}</p>
        
        <h3>🏥 Medical Details:</h3>
        <ul>
          <li><strong>Patient Status</strong>: Critical</li>
          <li><strong>Department</strong>: Emergency Room</li>
          <li><strong>Urgency Level</strong>: CRITICAL</li>
          <li><strong>Medical Equipment Involved</strong>: Defibrillator</li>
        </ul>
        
        <p><strong>✅ This simulates the exact email that should be sent when a medical incident is created!</strong></p>
      `
    };

    const result1 = await transporter.sendMail(hospitalEmail);
    console.log('   ✅ Hospital email sent');
    console.log(`   📧 Message ID: ${result1.messageId}`);

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Hotel Equipment Failure Email
    console.log('\n🏨 Testing Hotel Equipment Email:');
    const hotelEmail = {
      from: process.env.NODEMAILER_EMAIL,
      to: process.env.NODEMAILER_EMAIL,
      subject: '[ACTION] Equipment Failure on hotel-management',
      html: `
        <h2>🔧 Equipment Failure Report</h2>
        <p><strong>Organization</strong>: Test Hotel</p>
        <p><strong>Service</strong>: hotel-management</p>
        <p><strong>Time</strong>: ${new Date().toISOString()}</p>
        
        <h3>Impact Assessment:</h3>
        <p>Equipment failure detected and maintenance team notified</p>
        
        <h3>Response Actions:</h3>
        <ul>
          <li>✓ Maintenance team automatically notified</li>
          <li>✓ Backup systems activated where available</li>
          <li>✓ Service impact assessment completed</li>
          <li>✓ Replacement parts ordered if needed</li>
        </ul>
        
        <p><strong>✅ This simulates the exact email that should be sent when an equipment failure is created!</strong></p>
      `
    };

    const result2 = await transporter.sendMail(hotelEmail);
    console.log('   ✅ Hotel email sent');
    console.log(`   📧 Message ID: ${result2.messageId}`);

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Security Threat Email
    console.log('\n🔒 Testing Security Threat Email:');
    const securityEmail = {
      from: process.env.NODEMAILER_EMAIL,
      to: process.env.NODEMAILER_EMAIL,
      subject: '[INFO] Security Threat on hotel-management',
      html: `
        <h2>🔒 Security Alert</h2>
        <p>A security threat was detected and countermeasures were automatically activated.</p>
        
        <p><strong>Organization</strong>: Test Organization</p>
        <p><strong>Service</strong>: hotel-management</p>
        <p><strong>Status</strong>: Security protocols active</p>
        <p><strong>Automatic Response</strong>: Security team notified and containment activated</p>
        
        <p>Security team has been notified and is responding according to established protocols.</p>
        
        <p><strong>✅ This simulates the exact email that should be sent when a security threat is created!</strong></p>
      `
    };

    const result3 = await transporter.sendMail(securityEmail);
    console.log('   ✅ Security email sent');
    console.log(`   📧 Message ID: ${result3.messageId}`);

    console.log('\n📧 CHECK YOUR INBOX FOR THESE 3 EMAILS:');
    console.log('   🏥 "[CRITICAL] Medical Incident on hospital-management"');
    console.log('   🏨 "[ACTION] Equipment Failure on hotel-management"');
    console.log('   🔒 "[INFO] Security Threat on hotel-management"');
    
    console.log('\n🎯 If you receive these 3 emails:');
    console.log('   ✅ Email system is working perfectly');
    console.log('   ✅ The issue is with incident processing, not email delivery');
    console.log('   ✅ Need to check why commsAgent is not being called');
    
    console.log('\n⏰ Emails should arrive within 1-2 minutes');
    console.log('📬 Check Primary inbox, Spam folder, and All Mail');
    
  } catch (error) {
    console.error('❌ Direct email test failed:', error.message);
  }
}

testEmailSystemDirectly();
