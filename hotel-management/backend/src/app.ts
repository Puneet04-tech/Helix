import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Helix SDK Integration - Simple HTTP client wrapper
class HelixGuardian {
  private apiKey: string;
  private backendUrl: string;

  constructor(config: { apiKey: string; backendUrl: string; enabled?: boolean; sampleRate?: number }) {
    this.apiKey = config.apiKey;
    this.backendUrl = config.backendUrl;
  }

  async createIncident(title: string, description: string, severity: string) {
    try {
      const response = await axios.post(`${this.backendUrl}/incidents/create`, {
        projectId: 'hotel-org-001',
        title,
        description,
        severity,
        type: 'guest_complaint',
        service: 'hotel-management'
      }, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      console.log('✓ Incident created in Helix:', response.data._id || response.data.incidentId);
      return response.data;
    } catch (error) {
      console.error('[Hotel System] Failed to create incident:', error);
    }
  }

  async track(type: string, message: string, metadata?: any) {
    try {
      await axios.post(`${this.backendUrl}/events/ingest`, {
        type,
        service: metadata?.service || 'hotel-management',
        message,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
    } catch (error) {
      console.debug('[Hotel System] Event tracking failed (non-critical):', error);
    }
  }

  async sendEvent(event: any) {
    await this.track(event.type, event.message, event.metadata);
  }

  createMiddleware() {
    const self = this;
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const originalSend = res.send;

      res.send = function (data: any) {
        const duration = Date.now() - startTime;
        if ((res as any).statusCode >= 400 || duration > 5000) {
          self.track(res.statusCode >= 500 ? 'error' : 'warning', 
            `HTTP ${res.statusCode} on ${req.method} ${req.path}`, {
            statusCode: res.statusCode,
            endpoint: req.path,
            method: req.method,
            responseTime: duration,
            service: 'hotel-api'
          });
        }
        return originalSend.call(this, data);
      };
      next();
    };
  }

  interceptErrors() {}
  getStatus() {
    return { initialized: true, enabled: true, apiKey: this.apiKey.substring(0, 10) + '***' };
  }
}

const AIGuardian = HelixGuardian;

const app: Express = express();
const PORT = process.env.PORT || 4000;

// ===== HELIX SDK INITIALIZATION =====
const guardian = new AIGuardian({
  apiKey: process.env.HELIX_API_KEY || 'ag_18e67af6-3598-4199-9440-993a843ee8c9',
  backendUrl: process.env.HELIX_URL || 'http://localhost:5000',
  enabled: true,
  sampleRate: 1.0
});

console.log('✅ Helix SDK Initialized');

// ===== MIDDLEWARE =====
app.use(cors());
app.use(bodyParser.json());
app.use(guardian.createMiddleware()); // Track all HTTP requests
guardian.interceptErrors();

// ===== MOCK DATA STORAGE =====
interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber: number;
  status: 'checked-in' | 'checked-out' | 'reserved';
  specialRequests: string;
}

interface Room {
  id: string;
  roomNumber: number;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  price: number;
  capacity: number;
}

interface Complaint {
  id: string;
  guestId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
}

let guests: Guest[] = [
  {
    id: 'g1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    checkInDate: '2026-04-04',
    checkOutDate: '2026-04-06',
    roomNumber: 101,
    status: 'checked-in',
    specialRequests: 'High floor, city view'
  },
  {
    id: 'g2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-5678',
    checkInDate: '2026-04-04',
    checkOutDate: '2026-04-07',
    roomNumber: 205,
    status: 'checked-in',
    specialRequests: 'Late checkout requested'
  }
];

let rooms: Room[] = [
  { id: 'r1', roomNumber: 101, type: 'double', status: 'occupied', price: 150, capacity: 2 },
  { id: 'r2', roomNumber: 102, type: 'single', status: 'available', price: 100, capacity: 1 },
  { id: 'r3', roomNumber: 103, type: 'deluxe', status: 'maintenance', price: 250, capacity: 3 },
  { id: 'r4', roomNumber: 201, type: 'suite', status: 'available', price: 350, capacity: 4 },
  { id: 'r5', roomNumber: 205, type: 'double', status: 'occupied', price: 150, capacity: 2 },
  { id: 'r6', roomNumber: 206, type: 'single', status: 'cleaning', price: 100, capacity: 1 }
];

let complaints: Complaint[] = [];

// ===== API ENDPOINTS =====

// ===== GUESTS ENDPOINTS =====
app.get('/api/guests', (req: Request, res: Response) => {
  guardian.track('info', 'Fetched all guests', { count: guests.length, service: 'guest-service' });
  res.json(guests);
});

app.post('/api/guests', (req: Request, res: Response) => {
  const newGuest: Guest = {
    id: uuidv4(),
    ...req.body,
    status: 'reserved',
    checkInDate: req.body.checkInDate || new Date().toISOString().split('T')[0]
  };
  
  guests.push(newGuest);
  
  guardian.track('info', `New guest registered: ${newGuest.name}`, {
    guestId: newGuest.id,
    roomNumber: newGuest.roomNumber,
    service: 'guest-service'
  });
  
  res.json(newGuest);
});

app.put('/api/guests/:id', (req: Request, res: Response) => {
  const guest = guests.find(g => g.id === req.params.id);
  
  if (!guest) {
    guardian.track('warning', 'Guest not found for update', { guestId: req.params.id });
    return res.status(404).json({ error: 'Guest not found' });
  }
  
  Object.assign(guest, req.body);
  
  guardian.track('info', `Guest updated: ${guest.name}`, {
    guestId: guest.id,
    changes: Object.keys(req.body),
    service: 'guest-service'
  });
  
  res.json(guest);
});

app.delete('/api/guests/:id', (req: Request, res: Response) => {
  const index = guests.findIndex(g => g.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Guest not found' });
  }
  
  const removedGuest = guests.splice(index, 1)[0];
  
  guardian.track('info', `Guest checkout: ${removedGuest.name}`, {
    guestId: removedGuest.id,
    roomNumber: removedGuest.roomNumber,
    service: 'guest-service'
  });
  
  res.json({ message: 'Guest removed' });
});

// ===== ROOMS ENDPOINTS =====
app.get('/api/rooms', (req: Request, res: Response) => {
  res.json(rooms);
});

app.put('/api/rooms/:id', (req: Request, res: Response) => {
  const room = rooms.find(r => r.id === req.params.id);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const oldStatus = room.status;
  Object.assign(room, req.body);
  
  // Track room maintenance issues
  if (req.body.status === 'maintenance') {
    guardian.track('warning', `Room ${room.roomNumber} sent to maintenance`, {
      roomNumber: room.roomNumber,
      roomType: room.type,
      service: 'room-management'
    });
  }
  
  // Track room availability changes
  if (req.body.status !== oldStatus && req.body.status === 'available') {
    guardian.track('info', `Room ${room.roomNumber} now available`, {
      roomNumber: room.roomNumber,
      previousStatus: oldStatus,
      service: 'room-management'
    });
  }
  
  res.json(room);
});

// ===== COMPLAINTS ENDPOINTS =====
app.post('/api/complaints', (req: Request, res: Response) => {
  const newComplaint: Complaint = {
    id: uuidv4(),
    ...req.body,
    timestamp: new Date().toISOString(),
    resolved: false
  };
  
  complaints.push(newComplaint);
  
  // Create incident directly in Helix
  guardian.createIncident(
    `Guest Complaint`,
    newComplaint.description,
    newComplaint.severity === 'critical' ? 'critical' : 'warning'
  ).catch(err => console.error('Incident creation failed:', err));
  
  res.json(newComplaint);
});

app.get('/api/complaints', (req: Request, res: Response) => {
  res.json(complaints);
});

app.put('/api/complaints/:id/resolve', (req: Request, res: Response) => {
  const complaint = complaints.find(c => c.id === req.params.id);
  
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  
  complaint.resolved = true;
  
  guardian.track('info', `Complaint resolved: ${complaint.description}`, {
    complaintId: complaint.id,
    severity: complaint.severity,
    service: 'complaint-management'
  });
  
  res.json(complaint);
});

// ===== OCCUPANCY ENDPOINTS =====
app.get('/api/occupancy', (req: Request, res: Response) => {
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);
  
  const data = {
    totalRooms,
    occupiedRooms,
    availableRooms,
    maintenanceRooms: rooms.filter(r => r.status === 'maintenance').length,
    cleaningRooms: rooms.filter(r => r.status === 'cleaning').length,
    occupancyRate
  };
  
  // Alert if occupancy is very high or very low
  if (occupancyRate > 90) {
    guardian.track('info', 'High occupancy rate alert', {
      occupancyRate,
      occupiedRooms,
      totalRooms,
      service: 'occupancy-management'
    });
  }
  
  if (occupancyRate < 20 && occupiedRooms > 0) {
    guardian.track('warning', 'Low occupancy rate detected', {
      occupancyRate,
      occupiedRooms,
      availableRooms,
      service: 'occupancy-management'
    });
  }
  
  res.json(data);
});

// ===== BOOKING ENDPOINTS =====
app.post('/api/bookings', (req: Request, res: Response) => {
  const { guestName, roomType, checkInDate, checkOutDate, numberOfGuests } = req.body;
  
  // Validation
  if (!guestName || !roomType || !checkInDate || !checkOutDate) {
    guardian.track('warning', 'Invalid booking request', {
      missingFields: ['guestName', 'roomType', 'checkInDate', 'checkOutDate'].filter(
        f => !req.body[f]
      ),
      service: 'booking-service'
    });
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Find available room
  const availableRoom = rooms.find(
    r => r.type === roomType && r.status === 'available'
  );
  
  if (!availableRoom) {
    guardian.track('warning', `No available rooms of type: ${roomType}`, {
      requestedType: roomType,
      numberOfGuests,
      service: 'booking-service'
    });
    return res.status(404).json({ error: 'No available rooms of requested type' });
  }
  
  // Create booking
  const newGuest: Guest = {
    id: uuidv4(),
    name: guestName,
    email: req.body.email || 'guest@example.com',
    phone: req.body.phone || 'N/A',
    checkInDate,
    checkOutDate,
    roomNumber: availableRoom.roomNumber,
    status: 'reserved',
    specialRequests: req.body.specialRequests || ''
  };
  
  guests.push(newGuest);
  availableRoom.status = 'occupied';
  
  guardian.track('info', `New booking confirmed: ${guestName}`, {
    guestId: newGuest.id,
    roomNumber: availableRoom.roomNumber,
    roomType: availableRoom.type,
    price: availableRoom.price,
    checkInDate,
    checkOutDate,
    service: 'booking-service'
  });
  
  res.json({
    booking: newGuest,
    room: availableRoom,
    totalPrice: availableRoom.price * numberOfGuests
  });
});

// ===== SYSTEM HEALTH ENDPOINTS =====
app.get('/api/health', (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  
  const health = {
    status: 'healthy',
    timestamp,
    uptime: process.uptime(),
    guests: guests.length,
    rooms: {
      total: rooms.length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      available: rooms.filter(r => r.status === 'available').length
    },
    complaints: {
      total: complaints.length,
      resolved: complaints.filter(c => c.resolved).length,
      pending: complaints.filter(c => !c.resolved).length
    }
  };
  
  res.json(health);
});

// ===== DASHBOARD STATS =====
app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  const totalRevenue = rooms
    .filter(r => r.status === 'occupied')
    .reduce((sum, r) => sum + r.price, 0);
  
  const stats = {
    totalGuests: guests.length,
    checkedInGuests: guests.filter(g => g.status === 'checked-in').length,
    totalRooms: rooms.length,
    occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
    occupancyRate: Math.round(
      (rooms.filter(r => r.status === 'occupied').length / rooms.length) * 100
    ),
    totalComplaints: complaints.length,
    pendingComplaints: complaints.filter(c => !c.resolved).length,
    estimatedRevenue: totalRevenue,
    systemUptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
  
  res.json(stats);
});

// ===== ERROR HANDLING =====
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  guardian.track('error', `Server error: ${err.message}`, {
    endpoint: req.path,
    method: req.method,
    statusCode: 500,
    service: 'hotel-api'
  });
  
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`\n🏨 Hotel Management System Backend`);
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log(`📊 Helix Integration: ACTIVE`);
  console.log(`✅ All APIs initialized\n`);
  
  guardian.track('info', 'Hotel Management System started', {
    port: PORT,
    initialGuests: guests.length,
    initialRooms: rooms.length,
    service: 'hotel-system'
  });
});

export default app;
