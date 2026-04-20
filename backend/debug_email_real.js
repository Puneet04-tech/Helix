const nodemailer = require('nodemailer');
require('dotenv').config();

async function debugRealEmailDelivery() {
  console.log('🔍 DEEP DEBUG: Email Delivery Issues\n');

  try {
    // Check environment variables
    console.log('📧 Environment Variables:');
    console.log(`   NODEMAILER_EMAIL: ${process.env.NODEMAILER_EMAIL}`);
    console.log(`   NODEMAILER_PASS exists: ${process.env.NODEMAILER_PASS ? 'YES' : 'NO'}`);
    console.log(`   Password length: ${process.env.NODEMAILER_PASS?.length || 0}`);
    console.log(`   First 4 chars: ${process.env.NODEMAILER_PASS?.substring(0, 4)}...`);
    console.log('');

    // Create transporter with detailed logging
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
      },
      debug: true, // Enable debug logging
      logger: true // Enable logger
    });

    console.log('🔄 Testing Gmail connection with detailed logging...');
    
    // Test connection
    try {
      await transporter.verify();
      console.log('✅ Gmail connection: SUCCESS');
    } catch (verifyError) {
      console.log('❌ Gmail connection FAILED:', verifyError.message);
      console.log('   Code:', verifyError.code);
      return;
    }

    // Send a simple test email first
    console.log('\n📤 Sending SIMPLE test email...');
    const simpleEmail = {
      from: process.env.NODEMAILER_EMAIL,
      to: process.env.NODEMAILER_EMAIL,
      subject: 'SIMPLE TEST - Helix Email Verification',
      text: 'This is a simple text email to test delivery.',
      html: '<h1>SIMPLE TEST</h1><p>This is a simple HTML email to test delivery.</p>'
    };

    try {
      const result = await transporter.sendMail(simpleEmail);
      console.log('✅ Simple email sent!');
      console.log('   Message ID:', result.messageId);
      console.log('   Response:', result.response);
      console.log('   Accepted:', result.accepted);
      console.log('   Rejected:', result.rejected);
      console.log('   Pending:', result.pending);
    } catch (sendError) {
      console.log('❌ Simple email FAILED:', sendError.message);
      console.log('   Code:', sendError.code);
      
      if (sendError.code === 'EAUTH') {
        console.log('\n🚨 AUTHENTICATION ISSUE:');
        console.log('   1. Check 2-factor authentication is ON');
        console.log('   2. Generate NEW App Password from Google');
        console.log('   3. Use 16-character App Password (NOT regular password)');
        console.log('   4. Remove spaces from App Password');
      }
      return;
    }

    // Now test the actual notification system
    console.log('\n🔔 Testing actual notification system...');
    
    // Import and test notification service
    const { NotificationsService } = require('./dist/modules/notifications/notifications.service');
    
    // Mock incident for testing
    const testIncident = {
      incidentId: 'test-' + Date.now(),
      type: 'medical_incident',
      service: 'test-service',
      severity: 'critical',
      detectedAt: new Date(),
      status: 'active',
      metadata: {
        patientStatus: 'Test Patient',
        department: 'Test Department'
      },
      agentReasoning: {
        analysisAgent: {
          rootCause: 'Test root cause'
        }
      },
      automaticActions: [
        { action: 'Test action', success: true }
      ]
    };

    // Mock client
    const mockClient = {
      _id: 'test-client-id',
      name: 'Test Organization',
      userIds: []
    };

    // Create notification service instance
    const notificationsService = new NotificationsService(
      null, // eventModel
      null, // clientModel  
      null, // userModel
      null  // logger
    );

    console.log('📧 Testing notification service email sending...');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugRealEmailDelivery();
