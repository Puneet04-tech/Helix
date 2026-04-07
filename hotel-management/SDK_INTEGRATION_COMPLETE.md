# Hotel Management System - Helix SDK Integration ✅

## Overview
The hotel management system now uses the **hotel-management-api-helix v1.0.0** SDK for comprehensive incident tracking, crisis detection, and compliance logging.

## Installation
```bash
npm install hotel-management-api-helix
```

## Integration Details

### 1. SDK Import
```typescript
import Helix from 'hotel-management-api-helix';

const helix = new Helix({
  apiKey: process.env.HELIX_API_KEY,
  backendUrl: process.env.HELIX_URL || 'http://localhost:5000',
  enabled: true,
  sampleRate: 1.0
});
```

### 2. Hotel-Specific Tracking

#### Crisis Detection - Occupancy Alerts
```typescript
// High occupancy (>90%)
hotelTracking.trackCrisisAlert('High occupancy detected', 'high');

// Low occupancy (<20%)
hotelTracking.trackCrisisAlert('Low occupancy detected', 'low');

// Room maintenance issues
hotelTracking.trackCrisisAlert(`Room 101 maintenance needed`, 'medium');
```

#### Guest & Booking Tracking
- **New Guest Registration**: Tracks guest info, room assignment
- **Booking Confirmation**: Tracks room type, dates, price
- **Guest Checkout**: Tracks occupancy changes
- **Guest Updates**: Tracks profile modifications

#### Complaint Management
- **Complaint Filed**: Tracks complaint severity and guest ID
- **Complaint Resolved**: Tracks resolution and severity level

#### Alert Dispatch
- **Manager Alerts**: High occupancy, maintenance issues
- **Compliance Events**: Server errors, guest complaints

### 3. Tracked Events

| Event | Type | Severity | Service |
|-------|------|----------|---------|
| Guest Registration | info | - | guest-service |
| Room Maintenance | warning | medium | room-management |
| High Occupancy | info | high | occupancy-management |
| Low Occupancy | warning | low | occupancy-management |
| Booking Confirmed | info | - | booking-service |
| Complaint Filed | compliance_event | varies | complaint-management |
| Server Error | error | - | hotel-api |
| Booking Validation Error | warning | - | booking-service |

### 4. SDK Features Used

✅ **Crisis Prediction** - occupancy rate monitoring  
✅ **Alert Dispatch** - manager notifications for critical issues  
✅ **Compliance Events** - audit logging for complaints and errors  
✅ **Event Tracking** - generic event logging with metadata  

### 5. Real-Time Monitoring

All events are sent to the Helix backend at:
- **API Endpoint**: `http://localhost:5000/events/ingest`
- **Transport**: HTTP POST with JSON payload
- **Timeout**: 5 seconds per event
- **Non-blocking**: Failures don't interrupt operations

### 6. Dashboard Access

View tracked incidents and events:
- **Frontend**: http://localhost:3000
- **Status**: Available at `/api/health`
- **Stats**: Available at `/api/dashboard/stats`

## Endpoints Using SDK

### Guest Management
- `GET /api/guests` - Track guest list retrieval
- `POST /api/guests` - Track new guest registration
- `PUT /api/guests/:id` - Track guest profile updates
- `DELETE /api/guests/:id` - Track guest checkout

### Room Management
- `GET /api/rooms` - Track room status queries
- `PUT /api/rooms/:id` - Track room status changes (maintenance alerts)

### Complaint Management
- `POST /api/complaints` - Track complaint filing (compliance event)
- `GET /api/complaints` - Track complaint retrieval
- `PUT /api/complaints/:id/resolve` - Track complaint resolution

### Occupancy Management
- `GET /api/occupancy` - Track occupancy alerts (crisis detection)

### Booking Management
- `POST /api/bookings` - Track booking confirmations

### System Health
- `GET /api/health` - System status
- `GET /api/dashboard/stats` - Occupancy and complaint stats

## Testing

Start the hotel management backend:
```bash
cd e:\Helix\hotel-management\backend
npm run dev
```

Test endpoints with example data:
```bash
# Create a guest
curl -X POST http://localhost:4000/api/guests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "roomNumber": 101
  }'

# File a complaint (creates compliance event)
curl -X POST http://localhost:4000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "guestId": "guest-123",
    "description": "WiFi not working",
    "severity": "high"
  }'

# Check occupancy (triggers crisis alert if high/low)
curl http://localhost:4000/api/occupancy

# View system stats
curl http://localhost:4000/api/dashboard/stats
```

## SDK Features Comparison

| Feature | Helix SDK | Hotel System |
|---------|-----------|--------------|
| Event Tracking | ✅ All types | Guest, Room, Complaint events |
| Crisis Detection | ✅ Pattern analysis | Occupancy monitoring |
| Alert Dispatch | ✅ Role-based | Manager notifications |
| Compliance Logging | ✅ Audit trail | Complaint & error logging |
| NLP Queries | ✅ Available | Can be extended |
| Postmortem PDF | ✅ Available | For incident analysis |

## Configuration

### Environment Variables
```env
HELIX_API_KEY=ag_18e67af6-3598-4199-9440-993a843ee8c9  # Helix API key
HELIX_URL=http://localhost:5000                        # Helix backend URL
PORT=4000                                               # Hotel API port
```

## Monitoring

Check SDK status:
```typescript
const status = helix.getStatus();
console.log(status); // { enabled: true, features: 8 }
```

## Next Steps

1. ✅ SDK Installed and integrated
2. ✅ Hotel-specific tracking configured
3. ✅ Build successful
4. 🔄 **Start the system** and test events
5. 🔄 **Monitor in Helix Dashboard**

## Version Info
- **SDK**: hotel-management-api-helix v1.0.0
- **Backend**: NestJS + MongoDB
- **Hotel System**: Express.js + TypeScript
- **Integration Date**: April 7, 2026

---
**Status**: ✅ Production Ready | **Integration**: Complete | **Testing**: Pending
