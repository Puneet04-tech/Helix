# 🏨 Hotel Management System - Helix Integration Guide

Complete guide on how the Hotel Management System integrates with Helix for real-time incident detection and threat monitoring.

---

## 📊 Integration Overview

The Hotel Management System sends **real-time business and security events** to Helix, which analyzes them and provides automated responses and recommendations.

```
Hotel Operations
    ↓
Hotel Backend (Port 4000)
    ↓
Helix SDK Integration
    ↓
Event Stream to Helix (Port 5000)
    ↓
Helix AI Analysis
    ↓
Real-time Dashboard & Alerts
```

---

## 🔗 How Events Flow

### Example 1: Guest Complaint Workflow

**Step 1: Staff Reports Issue**
```
Hotel Dashboard
→ Click "Report Guest Complaint"
→ Fill in: "Room smells bad"
→ Select severity: "HIGH"
→ Click "Report"
```

**Step 2: Backend Receives**
```typescript
POST /api/complaints
{
  "guestId": "g1",
  "description": "Room smells bad",
  "severity": "high"
}
```

**Step 3: Backend Processes**
```typescript
// In backend/src/app.ts
guardian.track('warning', 'Guest complaint: Room smells bad', {
  complaintId: complaint.id,
  guestId: 'g1',
  severity: 'high',
  service: 'complaint-management'
});
```

**Step 4: HTTP Request to Helix**
```http
POST http://localhost:5000/events/ingest
x-api-key: hotel-demo-key-12345
Content-Type: application/json

{
  "type": "warning",
  "service": "complaint-management",
  "message": "Guest complaint: Room smells bad",
  "metadata": {
    "complaintId": "c123",
    "guestId": "g1",
    "severity": "high"
  },
  "timestamp": "2026-04-04T12:30:45.123Z"
}
```

**Step 5: Helix Analysis**
- Receives event in real-time
- Checks for similar complaints
- Analyzes frequency and patterns
- AI suggests: "Urgent: Schedule room fumigation"
- Correlates with housekeeping schedule

**Step 6: Dashboard Update**
- Event appears in Helix Dashboard
- Incident marked as ACTIVE
- Suggested actions displayed
- Hotel staff notified

---

## 📡 All Events Tracked

### 1. **Guest Complaints** 🚨
| Event | When | Severity | Helix Action |
|-------|------|----------|--------------|
| New Complaint | Posted | HIGH/CRITICAL | Immediate alert |
| Resolved Complaint | Marked done | LOW | Log resolution |

```typescript
// Example: Critical complaint
guardian.track('error', 'CRITICAL: Injury report - guest fell in shower', {
  guestId: 'g1',
  roomNumber: 101,
  service: 'complaint-management',
  requiresEmergency: true
});
```

### 2. **Occupancy Alerts** 📊
| Condition | Trigger | Action |
|-----------|---------|--------|
| High Occupancy | > 90% | Monitor, prepare overflow |
| Low Occupancy | < 20% | Marketing alert |
| Full Occupancy | 100% | Disable bookings |

```typescript
// Example: High occupancy
if (occupancyRate > 90) {
  guardian.track('info', 'High occupancy rate alert', {
    occupancyRate: 95,
    occupiedRooms: 19,
    totalRooms: 20,
    service: 'occupancy-management'
  });
}
```

### 3. **Room Maintenance** 🔧
| Event | When | Details |
|-------|------|---------|
| Sent to Maintenance | Staff action | Room unavailable |
| Maintenance Complete | Staff updates | Room available |
| Emergency Maintenance | ASAP | Critical issue |

```typescript
// Example: Room maintenance
guardian.track('warning', 'Room 103 sent to maintenance', {
  roomNumber: 103,
  roomType: 'deluxe',
  reason: 'Plumbing issue - water leak',
  service: 'room-management'
});
```

### 4. **Bookings & Revenue** 💰
| Event | When | Details |
|-------|------|---------|
| New Booking | Guest reserves | Room type, dates, price |
| Booking Failed | Error occurs | Reason for failure |
| Guest Checkout | End of stay | Revenue collected |

```typescript
// Example: New booking
guardian.track('info', 'New booking confirmed: John Smith', {
  guestId: 'g123',
  roomNumber: 205,
  roomType: 'double',
  price: 150,
  checkInDate: '2026-04-05',
  checkOutDate: '2026-04-07',
  service: 'booking-service'
});
```

### 5. **System Health** ⚙️
| Event | When | Details |
|-------|------|---------|
| System Started | Boot | Recording uptime |
| Performance Issue | Slow response | Response time tracked |
| API Error | Request fails | Error logged |

```typescript
// Example: Slow API
if (duration > 5000) {
  guardian.track('warning', 'Slow API response', {
    endpoint: '/api/guests',
    responseTime: duration,
    statusCode: 200,
    service: 'hotel-api'
  });
}
```

---

## 🎯 Real-Time Monitoring Dashboard

Access Helix Dashboard: **http://localhost:3003**

### What You'll See:

#### 1. **Active Incidents Feed**
```
⚠️ HIGH: Guest complaint - AC not working
   Room 101 | Guest: John Doe | 2 min ago
   
🟠 MEDIUM: Room 103 maintenance ongoing
   Plumbing | Estimated: 2 hours | Started: 10:30

✅ RESOLVED: Guest complaint - Noise
   Room 205 | Guest: Jane Smith | 15 min ago
```

#### 2. **Incident Details**
When you click an incident, you see:
- **Overview tab**: Basic info, severity, confidence
- **Analysis tab**: Root cause, affected services, recommendations
- **Timeline tab**: Event history, resolution attempts

#### 3. **Metrics & Analytics**
- Total incidents this week: 12
- Avg resolution time: 45 mins
- Complaint types: Cleanliness (40%), Noise (30%), Facilities (30%)
- Occupancy rate: 85%
- Revenue impact: Documented per issue

---

## 🔐 Security Events

Hotel system also sends security-related events to Helix:

### Unauthorized Access Attempts
```typescript
guardian.track('security_threat', 'Unauthorized room access attempt', {
  roomNumber: 305,
  attemptedBy: 'keycard_error',
  timestamp: '2026-04-04T12:15:00Z',
  service: 'security'
});
```

### Suspicious Booking Patterns
```typescript
guardian.track('warning', 'Unusual booking pattern detected', {
  multipleBookings: 5,
  sameGuestEmail: 'test@example.com',
  timeframe: '5 minutes',
  potentialFraud: true,
  service: 'booking-service'
});
```

---

## 📲 API Integration Details

### Headers Required
```
x-api-key: hotel-demo-key-12345
Content-Type: application/json
```

### Event Payload Structure
```json
{
  "type": "warning|error|info|security_threat|performance_degradation",
  "service": "complaint-management|room-management|booking-service|occupancy-management|security",
  "message": "Human readable description",
  "metadata": {
    "guestId": "optional",
    "roomNumber": "optional",
    "severity": "optional",
    "customField1": "any data you want"
  },
  "timestamp": "ISO8601 format"
}
```

### Status Codes
- **200**: Event received and processed
- **400**: Bad request (missing fields)
- **401**: Unauthorized (invalid API key)
- **500**: Server error

---

## 🎬 Demo Scenarios

### Scenario 1: Weekend Rush with High Occupancy

**Time: Friday 5 PM**

Hotel reaches peak occupancy:
```
Events sent to Helix:
1. Occupancy rate: 95%
2. New complaint: "Elevator too crowded"
3. New complaint: "Dinner reservation overbooked"
4. Room 210: Maintenance needed (broken A/C)
```

**Helix Analysis:**
- "Occupancy critical, prepare for issues"
- "Prioritize elevator maintenance"
- "Suggest early breakfast reservations"
- "Offer room upgrade to complaint guests"

---

### Scenario 2: Guest With Multiple Complaints

**Time: Saturday Morning**

Same guest (Jane, Room 205) reports multiple issues:
```
Events:
1. "Shower water too hot" - Posted 8 AM
2. "TV remote not working" - Posted 8:30 AM
3. "Room key doesn't work" - Posted 9 AM
```

**Helix Analysis:**
- "Pattern: Multiple issues from same room/guest"
- "Hypothesis: Room has technical problems"
- "Suggested action: Move guest to another room, provide upgrade"
- "Root cause: Need room inspection"

---

### Scenario 3: Spring Cleaning Week

**Time: Monday - Friday (Off-season)**

Hotel performs maintenance:
```
Events:
- Room 101: "Maintenance - carpet cleaning"
- Room 102: "Maintenance - furniture repair"
- Room 103: "Maintenance - plumbing inspection"
- Room 104: "Maintenance - electrical check"
- Room 105: "Maintenance - HVAC service"
```

**Helix Analysis:**
- "Coordinated maintenance detected"
- "Occupancy will drop to 20% this week"
- "Revenue forecast: Low"
- "Optimize: Offer special rates, attract guests"

---

## 🔧 Advanced: Custom Event Tracking

### Add Custom Monitoring

Edit `backend/src/app.ts` to track your own events:

```typescript
// Example: Track Wi-Fi performance
app.get('/api/wifi-stats', (req: Request, res: Response) => {
  const wifiMetrics = getWifiMetrics();
  
  if (wifiMetrics.signalStrength < 50) {
    guardian.track('warning', 'Poor Wi-Fi signal detected', {
      signalStrength: wifiMetrics.signalStrength,
      affectedRooms: wifiMetrics.affectedRooms,
      service: 'network-management'
    });
  }
  
  res.json(wifiMetrics);
});

// Example: Track checkout delays
app.post('/api/guests/:id/checkout', (req: Request, res: Response) => {
  const actualCheckoutTime = Date.now();
  const scheduledCheckoutTime = req.body.scheduledTime;
  const delayMinutes = (actualCheckoutTime - scheduledCheckoutTime) / 60000;
  
  if (delayMinutes > 30) {
    guardian.track('info', `Late checkout: ${delayMinutes} mins`, {
      guestId: req.params.id,
      delayMinutes,
      service: 'checkout-management'
    });
  }
  
  res.json({ success: true });
});
```

---

## 📊 Dashboard Statistics

The hotel dashboard in Helix shows:

```
Hotel Management System Metrics
├─ Active Incidents: 3
├─ Resolved Today: 15
├─ Avg Resolution Time: 42 mins
├─ Guest Satisfaction: 4.2/5
├─ Occupancy: 82%
├─ Revenue (Today): $3,450
├─ Revenue (Week): $24,150
├─ Staff Response Time: 8 mins
└─ System Uptime: 99.8%
```

---

## 🚀 Deployment to Production

### When moving to production:

1. **Update API Key**
   ```bash
   export HELIX_API_KEY=your-production-key
   ```

2. **Update Helix URL**
   ```bash
   export HELIX_URL=https://helix-prod.yourcompany.com
   ```

3. **Enable Full Monitoring**
   ```typescript
   const guardian = new AIGuardian({
     apiKey: process.env.HELIX_API_KEY,
     backendUrl: process.env.HELIX_URL,
     enabled: true,
     sampleRate: 1.0  // Send 100% of events
   });
   ```

4. **Set up alerts**
   - Critical complaints → SMS/Email alert
   - Occupancy changes → Manager notification
   - System errors → On-call dev alert

---

## 📞 Troubleshooting Integration

### Events not appearing in Helix?

1. **Check connection**
   ```bash
   curl -X GET http://localhost:5000/health
   ```

2. **Verify API key**
   ```bash
   echo $HELIX_API_KEY
   ```

3. **Check logs**
   ```
   Backend: npm run dev
   Watch for: "Helix SDK initialized"
   ```

### Helix dashboard shows old data?

1. Click **Refresh** button
2. Check timestamp on incidents
3. Verify backend is sending new events

### API errors on booking?

1. Check backend is running: `http://localhost:4000/api/health`
2. Verify all rooms exist
3. Check room types match

---

## 🎓 Learning Resources

- **Helix SDK Docs**: [SDK_INTEGRATION_GUIDE.md](../SDK_INTEGRATION_GUIDE.md)
- **Hotel API Docs**: See README.md in this folder
- **Helix Main Docs**: [../README.md](../README.md)

---

## ✨ Key Features

✅ Real-time event tracking from hotel operations  
✅ Automatic complaint escalation to Helix  
✅ Occupancy monitoring and forecasting  
✅ Revenue tracking per incident  
✅ Guest satisfaction correlation  
✅ Maintenance scheduling optimization  
✅ Security incident detection  
✅ Performance monitoring  

---

**Integration complete! Your hotel is now secured with AI-powered threat detection.** 🏨🛡️
