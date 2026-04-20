# 📧 Helix Email Notification Setup Guide

## 🔍 Current Status

### ✅ What's Working:
- Notification service code is complete and deployed
- All email templates are implemented
- Role-based notifications are configured
- Incident-type-specific emails are ready

### ❌ What Needs Configuration:
- Gmail credentials are using placeholder values
- Email authentication is failing

## 🛠️ Required Configuration

### 1. Gmail App Password Setup

**Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security"
3. Enable 2-Step Verification

**Step 2: Generate App Password**
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" for the app
3. Select "Other (Custom name)" for the device
4. Enter "Helix Backend" as the name
5. Click "Generate"
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### 2. Update Environment Variables

Update your `.env` file with real Gmail credentials:

```bash
# Email (Nodemailer - Gmail)
NODEMAILER_EMAIL=your-actual-gmail@gmail.com
NODEMAILER_PASS=your-16-character-app-password
```

**Important:**
- Use the App Password, NOT your regular Gmail password
- The App Password is 16 characters with spaces
- Remove spaces when copying to .env file

## 🧪 Testing Configuration

After updating the credentials, test the email system:

```bash
cd backend
node test_email.js
```

## 📧 Supported Email Providers

### Gmail (Recommended)
```bash
NODEMAILER_EMAIL=your-gmail@gmail.com
NODEMAILER_PASS=your-app-password
```

### Outlook/Hotmail
```bash
NODEMAILER_EMAIL=your-outlook@outlook.com
NODEMAILER_PASS=your-app-password
```

### Custom SMTP
```bash
NODEMAILER_HOST=smtp.your-provider.com
NODEMAILER_PORT=587
NODEMAILER_SECURE=true
NODEMAILER_EMAIL=your-email@provider.com
NODEMAILER_PASS=your-password
```

## 🎯 Email Features Ready

Once configured, the system will send:

### 🏥 Medical Incidents
- Patient status and department info
- Medical equipment details
- Emergency protocol activation

### 🔧 Equipment Failures
- Equipment type and location
- Failure mode and maintenance history
- Maintenance team notification

### 🔒 Security Threats
- Threat type and source IP
- Containment actions taken
- Security team alerts

### ⚡ Performance Issues
- Response times and resource usage
- Bottleneck identification
- Optimization actions

### 👥 Role-Based Distribution
- **Developers**: Technical details and root causes
- **Managers**: Business impact and response status
- **Owners**: Executive summaries and high-level status

## 🚨 Production Deployment

For production deployment:

1. **Render Environment Variables:**
   - Go to your Render dashboard
   - Navigate to Service → Environment
   - Add `NODEMAILER_EMAIL` and `NODEMAILER_PASS`

2. **Security Best Practices:**
   - Use a dedicated email account
   - Enable 2-factor authentication
   - Regularly rotate App Passwords
   - Monitor email deliverability

## 📊 Current Configuration Status

```
✅ Notification Service: Complete
✅ Email Templates: All incident types covered
✅ Role-Based Alerts: Developer, Manager, Owner
✅ Incident Types: Medical, Equipment, Security, Performance
❌ Gmail Credentials: Need real credentials
```

## 🎉 Next Steps

1. Set up Gmail App Password
2. Update `.env` file with real credentials
3. Test with `node test_email.js`
4. Deploy to production with Render environment variables
5. Test incident creation to verify notifications

Once configured, you'll receive detailed, role-appropriate emails for all incident types!
