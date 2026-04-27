# 🧪 Test Files

This directory contains important test files for the Helix AI Guardian system.

## 📁 File Categories

### **🏨 Hotel Management Tests**
- `test_hotel_events.js` - Tests hotel event ingestion and incident separation
- `test_equipment_incident.js` - Tests equipment failure scenarios

### **🏥 Hospital Management Tests**
- `register-hospital.js` - Hospital system registration and setup

### **🔧 System Setup & Client Creation**
- `create_hospital_client.js` - Creates hospital management client in database
- `create_hotel_client.js` - Creates hotel management client in database
- `create_test_client.js` - Creates generic test client

### **📧 Notification & Email Tests**
- `test_notification_final.js` - Tests notification system end-to-end
- `test_real_incident_emails.js` - Tests real email delivery for incidents

### **🎭 Playwright & Automation Tests**
- `test_playwright_complete.js` - Complete Playwright automation testing

### **🔄 Multi-System Tests**
- `test_both_systems_final.js` - Tests both hospital and hotel systems together
- `test_multi_system_notifications.js` - Tests cross-system notifications

## 🚀 Usage

```bash
# Navigate to test directory
cd test-files

# Run hotel events test
node test_hotel_events.js

# Create hospital client
node create_hospital_client.js

# Create hotel client
node create_hotel_client.js

# Test notifications
node test_notification_final.js
```

## 📋 Important Notes

- Ensure backend is running on `http://localhost:5000` before running tests
- Tests use real API keys configured in the database
- Some tests may require MongoDB connection string in environment variables
- Tests are designed to verify system separation and proper incident routing

## 🔍 Test Coverage

- ✅ Event ingestion and processing
- ✅ Incident creation and management
- ✅ System separation (hospital vs hotel)
- ✅ Notification delivery
- ✅ Email functionality
- ✅ Client setup and authentication
- ✅ Cross-system integration
