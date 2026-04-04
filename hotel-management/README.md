# 🏨 Hotel Management System with Helix Integration

A complete hotel management platform with real-time incident detection and guest complaint monitoring, fully integrated with the **Helix Autonomous Threat Detection** system.

---

## 📋 Features

### Hotel Management
- ✅ **Guest Management**: Check-in, reservation, checkout tracking
- ✅ **Room Management**: Status tracking (available, occupied, maintenance, cleaning)
- ✅ **Booking System**: Real-time room availability and reservations
- ✅ **Complaint Tracking**: Guest complaints with severity levels
- ✅ **Occupancy Analytics**: Real-time occupancy tracking and revenue forecasting
- ✅ **Room Operations**: Maintenance scheduling and cleaning status

### Helix Integration
- ✅ **Real-time Incident Reporting**: All hotel events sent to Helix
- ✅ **Threat Detection**: Automatic detection of guest complaints and system issues
- ✅ **Performance Monitoring**: Guest service response times tracked
- ✅ **Security Alerts**: Unauthorized access attempts detected
- ✅ **Business Analytics**: Revenue and occupancy metrics monitored
- ✅ **Automated Responses**: Helix AI responds to detected incidents

---

## 🏗️ Architecture

```
Hotel Management System
├── Backend (Node.js/Express) - Port 4000
│   ├── Guest Management APIs
│   ├── Room Operations APIs
│   ├── Booking & Reservations
│   ├── Complaint Management
│   ├── Analytics & Dashboard
│   └── Helix SDK Integration
│
├── Frontend (React/Vite) - Port 4001
│   ├── Staff Dashboard
│   ├── Real-time Stats
│   ├── Guest Management UI
│   ├── Complaint Reporting
│   └── System Health Monitor
│
└── Helix Backend (NestJS) - Port 5000
    ├── Event Ingestion
    ├── Threat Analysis
    ├── WebSocket Broadcast
    └── Real-time Incident Dashboard
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start the Hotel System

```bash
# Terminal 1: Start Backend (Port 4000)
cd backend
npm run dev

# Terminal 2: Start Frontend (Port 4001)
cd frontend
npm run dev
```

### 3. Access the System

- **Hotel Dashboard**: http://localhost:4001
- **Hotel API**: http://localhost:4000/api
- **Helix Dashboard**: http://localhost:3003 (main Helix UI)

---

## 📊 API Endpoints

### Guest Management
```
GET    /api/guests              - Get all guests
POST   /api/guests              - Create new guest
PUT    /api/guests/:id          - Update guest
DELETE /api/guests/:id          - Check out guest
```

### Room Management
```
GET    /api/rooms               - Get all rooms
PUT    /api/rooms/:id           - Update room status
```

### Bookings
```
POST   /api/bookings            - Create new booking
```

### Complaints
```
GET    /api/complaints          - Get all complaints
POST   /api/complaints          - Report new complaint
PUT    /api/complaints/:id/resolve - Mark complaint resolved
```

### Analytics
```
GET    /api/occupancy           - Get occupancy stats
GET    /api/dashboard/stats     - Get full dashboard stats
GET    /api/health              - Get system health
```

---

## 🔗 Helix SDK Integration

### What Gets Monitored?

| Event | Severity | Helix Action |
|-------|----------|--------------|
| Guest Complaint (Critical) | 🔴 CRITICAL | Immediate escalation & AI analysis |
| Guest Complaint (High) | 🟠 HIGH | Alert staff & suggest resolution |
| High Occupancy (>90%) | 🟡 WARNING | Monitor capacity issues |
| Low Occupancy (<20%) | 🟡 WARNING | Revenue alert |
| Room Maintenance | ℹ️ INFO | Log for analysis |
| Booking Failure | ⚠️ WARNING | Track transaction issues |
| System Errors | 🔴 ERROR | Critical system monitoring |
| Performance Issues | ⚠️ WARNING | Response time tracking |

### Real-Time Data Flow

```
Hotel Backend
    ↓
Guest Complaint: "Room is dirty"
    ↓
Severity: HIGH
    ↓
Helix SDK: guardian.track('warning', 'Guest complaint: Room dirty', {...})
    ↓
HTTP POST to Helix: /events/ingest
    ↓
Helix Backend Analysis
    ↓
AI recommends: "Prioritize room cleaning, offer discount"
    ↓
Helix Dashboard shows incident in real-time
```

---

## 💼 Example: Guest Complaint Workflow

### Step 1: Guest Reports Issue (Frontend)
```
Hotel Dashboard → Report Guest Complaint
→ Select severity: "HIGH"
→ Describe issue: "Water leaking from AC unit"
```

### Step 2: Backend Receives & Tracks
```typescript
// Backend automatically sends to Helix
guardian.track('warning', 'Guest complaint: Water leaking from AC unit', {
  guestId: 'guest_123',
  severity: 'high',
  service: 'complaint-management'
});
```

### Step 3: Helix Analyzes
- Correlates with maintenance records
- Checks similar past incidents
- Predicts resolution time
- Suggests proactive actions

### Step 4: Incident Appears in Helix Dashboard
- Real-time notification to hotel manager
- Automated AI recommendations
- Historical context and similar incidents
- Suggested resolution workflow

---

## 🎯 Integration Points

### 1. Guest Management
- Every new booking → Helix logs guest profile
- Guest checkout → Revenue metric to Helix
- Guest modifications → Activity logged to Helix

### 2. Room Operations
- Room status changes → Maintenance tracking
- Room maintenance → Helix receives alert
- Cleaning schedules → Operations monitored

### 3. Complaints & Issues
- **Critical complaints** → Immediate Helix alert
- **Pattern detection** → AI identifies recurring issues
- **Resolution tracking** → Auto-resolved vs manual resolution
- **Guest sentiment** → Tracked for reputation monitoring

### 4. Business Analytics
- **Occupancy tracking** → Real-time monitoring
- **Revenue forecasting** → Dynamic pricing suggestions
- **Staffing needs** → Based on occupancy
- **Incident correlation** → Guest complaints vs occupancy patterns

---

## 🛠️ Configuration

### Environment Variables

Create `.env` file in backend:

```
PORT=4000
HELIX_API_KEY=hotel-demo-key-12345
HELIX_URL=http://localhost:5000
NODE_ENV=development
```

### Helix Integration Settings

```typescript
// In backend/src/app.ts

const guardian = new AIGuardian({
  apiKey: 'hotel-demo-key-12345',           // Your Helix API key
  backendUrl: 'http://localhost:5000',      // Helix backend URL
  enabled: true,                            // Enable/disable monitoring
  sampleRate: 1.0                           // Send 100% of events
});
```

---

## 📈 Real-Time Monitoring

### Dashboard Shows:
- 👥 **Active Guests**: Current checked-in guests count
- 🏠 **Occupancy Rate**: Percentage of rooms occupied
- 💰 **Estimated Revenue**: Current revenue from occupied rooms
- ⚙️ **System Health**: Backend uptime and status
- 🚨 **Pending Complaints**: Unresolved guest complaints
- 📊 **Room Status**: Distribution of room states

### Live Updates:
- Stats refresh every 5 seconds
- Complaints update in real-time
- Occupancy changes immediate
- Revenue tracking dynamic

---

## 🔐 Security Features

1. **Guest Data Privacy**
   - API key authentication for Helix integration
   - Guest information encrypted in transit
   - Complaint data isolated per property

2. **Access Control**
   - Hotel staff dashboard
   - Guest privacy maintained
   - Complaint visibility restricted

3. **Incident Tracking**
   - All complaints logged to Helix
   - Security incident detection
   - Unauthorized access alerts

---

## 📊 Sample Guest Data

The system comes with sample data:

### Guests
- John Doe (Room 101, Double) - Checked in
- Jane Smith (Room 205, Double) - Checked in

### Rooms
- Rooms 101-206
- Types: Single, Double, Suite, Deluxe
- Statuses: Available, Occupied, Maintenance, Cleaning

### Auto-Generated Events
- Complaint reports
- Occupancy alerts
- Maintenance notifications
- Revenue tracking

---

## 🎮 Demo Workflows

### Workflow 1: High Occupancy Alert
```
1. System detects 90%+ occupancy
2. Helix receives warning event
3. Dashboard shows yellow alert
4. Suggests: "Disable booking, prepare overflow arrangements"
```

### Workflow 2: Guest Complaint Resolution
```
1. Guest reported: "Noisy neighbors"
2. Severity: HIGH
3. Helix analyzes: "Check room soundproofing issues"
4. Suggests: "Offer room change + discount"
5. Staff implements solution
6. Mark as resolved in dashboard
7. Helix logs resolution metrics
```

### Workflow 3: Room Maintenance
```
1. Room 103 sent to maintenance
2. Helix receives event: "Room status: maintenance"
3. Dashboard tracks downtime
4. When fixed: Update room status to available
5. Helix logs maintenance duration and cost
```

---

## 📚 Backend API Examples

### Create New Booking
```bash
curl -X POST http://localhost:4000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "guestName": "Mike Johnson",
    "roomType": "double",
    "checkInDate": "2026-04-05",
    "checkOutDate": "2026-04-07",
    "numberOfGuests": 2,
    "email": "mike@example.com",
    "phone": "555-9999"
  }'
```

### Report Guest Complaint
```bash
curl -X POST http://localhost:4000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "guestId": "g1",
    "description": "AC not working properly",
    "severity": "high"
  }'
```

### Get Dashboard Stats
```bash
curl http://localhost:4000/api/dashboard/stats
```

---

## 🔍 Monitoring with Helix

### View Events in Helix Dashboard
1. Go to http://localhost:3003
2. Navigate to Incidents tab
3. See real-time hotel events:
   - Guest complaints
   - Occupancy alerts
   - Room maintenance
   - Revenue metrics
   - Performance issues

### Search for Hotel Events
```
Filter by:
- Service: "complaint-management", "room-management", "booking-service"
- Severity: "critical", "high", "warning", "info"
- Time range: Last hour, Last day, Custom
```

---

## 🎯 Key Integrations

### 1. Automatic Error Tracking
```typescript
// Middleware auto-captures all HTTP errors
POST /api/bookings → Error 400 → Auto-sent to Helix
```

### 2. Custom Event Tracking
```typescript
// Manual tracking for business logic
guardian.track('info', 'New booking created', {
  guestId, roomNumber, bookingValue
});
```

### 3. Real-time Incident Streaming
```typescript
// Complaints immediately stream to Helix
// Appear in dashboard within seconds
```

---

## 📞 Support & Troubleshooting

### Backend Won't Start?
```bash
# Check dependencies
npm install

# Debug connection
npm run dev
```

### Frontend Won't Connect to Backend?
```
- Verify backend running on port 4000
- Check CORS configuration
- Ensure API_BASE_URL is correct
```

### Events Not Appearing in Helix?
```
- Verify HELIX_API_KEY is correct
- Check HELIX_URL pointing to http://localhost:5000
- Verify Helix backend is running
```

---

## 🚀 Next Steps

1. **Expand Hotel Features**
   - Add room service orders
   - Implement housekeeping tickets
   - Add guest messaging system

2. **Enhanced Monitoring**
   - Real-time staff alerts
   - Mobile app notifications
   - Email alerts for critical complaints

3. **Advanced Analytics**
   - Predictive maintenance
   - Demand forecasting
   - Guest satisfaction scoring

4. **Integration Expansion**
   - PMS (Property Management System) sync
   - Channel Manager integration
   - Payment gateway webhooks

---

## 📄 License

MIT License - Use freely for educational and commercial purposes

---

**Happy hotel managing! 🏨✨**

For support, visit the main Helix documentation at [Helix README](../README.md)
