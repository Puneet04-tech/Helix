# SDK Integration Guide - How Data Flows & How to Use It

## 🔄 **Data Flow Architecture**

```
Your Application/Host System
            ↓
       SDK (npm package)
            ↓
   Events Buffer/Queue
            ↓
   HTTP POST to Backend
    (/events/ingest)
            ↓
  Helix Backend (NestJS)
            ↓
   MongoDB Database
            ↓
  WebSocket Broadcast
  to Dashboard/UI
            ↓
   Real-time Dashboards
   (Incidents, Analytics)
```

---

## 📦 **SDK Status - FULLY IMPLEMENTED** ✅

Your SDK has these features:

| Feature | Status | Details |
|---------|--------|---------|
| Event Ingestion | ✅ | Sends events to `/events/ingest` endpoint |
| Error Interception | ✅ | Catches JS errors & unhandled promises |
| HTTP Middleware | ✅ | Tracks request/response times & status codes |
| Custom Events | ✅ | `track()` method for manual events |
| Batching/Queue | ✅ | (`eventQueue` for potential batch operations) |
| Config Management | ✅ | API key, sample rate, backend URL |
| Authentication | ✅ | Uses `x-api-key` header |
| Type Safety | ✅ | TypeScript interfaces |

---

## 🚀 **How to Use SDK in Your Host Management System**

### **Step 1: Install SDK in Your Application**

```bash
# In your Node.js/NestJS/Express application
npm install ai-guardian-sdk
# or from your local folder
npm install /path/to/helix/sdk
```

---

### **Step 2: Get Your API Key**

1. Log in to Helix Dashboard (http://localhost:3003)
2. Go to **Settings** → **API Keys** section
3. Copy your API key
4. The key is used in: `x-api-key` header with all requests

---

### **Step 3: Initialize SDK in Your Host System**

#### **For Backend (Node.js/NestJS/Express)**

```typescript
// your-app.ts or main.ts
import AIGuardian from 'ai-guardian-sdk';

const guardian = new AIGuardian({
  apiKey: 'your-api-key-from-dashboard', // Required
  backendUrl: 'http://localhost:5000',    // Point to Helix backend
  enabled: true,
  sampleRate: 1.0,  // Send all events (0-1 is percentage)
});

// Add to Express/NestJS
app.use(guardian.createMiddleware()); // Tracks all HTTP requests

// Alternative: Just initialize for error tracking
guardian.interceptErrors();
```

#### **For Frontend (React/Vue/Angular)**

```typescript
// In your main app file
import AIGuardian from 'ai-guardian-sdk';

const guardian = new AIGuardian({
  apiKey: 'your-api-key-from-dashboard',
  backendUrl: 'http://localhost:5000',
});

// Auto-capture all JavaScript errors
guardian.interceptErrors();

// Export for use in components
export default guardian;
```

---

### **Step 4: Send Events from Your Application**

#### **Automatic Tracking (Already Works)**

```typescript
// Middleware automatically captures:
// - Failed API requests (status >= 400)
// - Slow requests (> 5 seconds)
// - All errors and performance issues
```

#### **Manual Event Tracking**

```typescript
import guardian from './guardian-instance';

// Track security events
guardian.track('security_threat', 'Suspicious login attempt', {
  userId: 'user_123',
  ipAddress: '192.168.1.1',
  attemptCount: 5,
  service: 'auth-service'
});

// Track performance issues
guardian.track('performance_degradation', 'Database query slow', {
  queryTime: 3500,  // milliseconds
  endpoint: '/api/users',
  service: 'user-service'
});

// Track warnings
guardian.track('warning', 'Low memory available', {
  availableMemory: '50MB',
  service: 'worker-service'
});

// Advanced: Send custom events
guardian.sendEvent({
  type: 'unauthorized_access',
  service: 'api-gateway',
  message: 'Unauthorized token used',
  metadata: {
    userId: 'user_456',
    endpoint: '/api/admin',
    token: 'jwt_***',
    timestamp: new Date().toISOString()
  }
});
```

---

## **Supported Event Types**

```typescript
type EventType = 
  | 'error'                      // Application errors
  | 'warning'                    // Warning conditions
  | 'info'                       // Informational events
  | 'security_threat'            // Security incidents
  | 'performance_degradation'    // Performance issues
  | 'unauthorized_access'        // Auth failures
  | 'rate_limit_exceeded'        // Rate limiting
  | 'custom'                     // Any custom event
```

---

## 📊 **How Data Gets to Helix Backend**

### **1. Event Captured by SDK**
```typescript
// In your application
guardian.track('warning', 'Payment processing slow', {
  userId: 'user123',
  processingTime: 2500
});
```

### **2. SDK Sends HTTP POST**
```http
POST http://localhost:5000/events/ingest
Headers:
  x-api-key: your-api-key-***
  Content-Type: application/json

Body:
{
  "type": "warning",
  "service": "custom",
  "message": "Payment processing slow",
  "metadata": {
    "userId": "user123",
    "processingTime": 2500
  },
  "timestamp": "2026-04-04T12:30:45.123Z"
}
```

### **3. Backend Processes Event**
- **Events Controller** (`/backend/src/modules/events/events.controller.ts`)
- Validates the event
- Stores in MongoDB
- Emits to WebSocket subscribers

### **4. Real-time Broadcasting**
- **Events Gateway** (`/backend/src/common/gateways/events.gateway.ts`)
- WebSocket namespace: `/incidents`
- Broadcasts to all connected dashboards
- Updates appear in real-time UI

### **5. Dashboard Display**
- Incidents appear in the Dashboard
- Modal shows details, analysis, timeline
- Metrics update in real-time

---

## 🔧 **Integration with Your Host Management System**

### **Example: Kubernetes Cluster Monitoring**

```typescript
// your-cluster-monitor.ts
import AIGuardian from 'ai-guardian-sdk';

const guardian = new AIGuardian({
  apiKey: 'prod-api-key',
  backendUrl: 'https://helix-prod.example.com'
});

// Monitor Pod Status
async function monitorPods() {
  const pods = await kubernetes.getPods();
  
  pods.forEach(pod => {
    if (pod.status === 'CrashLoopBackOff') {
      guardian.track('warning', `Pod ${pod.name} is crashing repeatedly`, {
        namespace: pod.namespace,
        restartCount: pod.restartCount,
        service: 'kubernetes'
      });
    }
    
    if (pod.cpu > 80) {
      guardian.track('performance_degradation', `High CPU in ${pod.name}`, {
        cpuUsage: pod.cpu,
        memoryUsage: pod.memory,
        service: 'kubernetes-cpu'
      });
    }
  });
}

// Monitor Security Events
async function monitorSecurity() {
  const events = await auditLog.getEvents();
  
  events.forEach(event => {
    if (event.severity === 'CRITICAL') {
      guardian.track('security_threat', event.message, {
        source: event.source,
        target: event.target,
        action: event.action,
        service: 'audit-log'
      });
    }
  });
}

// Run continuously
setInterval(monitorPods, 10000);
setInterval(monitorSecurity, 5000);
```

---

### **Example: Database Monitoring**

```typescript
// your-db-monitor.ts
import AIGuardian from 'ai-guardian-sdk';

const guardian = new AIGuardian({
  apiKey: 'prod-api-key',
  backendUrl: 'https://helix-prod.example.com'
});

// Monitor slow queries
database.on('slow-query', (query, duration) => {
  if (duration > 1000) { // > 1 second
    guardian.track('performance_degradation', `Slow database query`, {
      query: query.substring(0, 100),
      duration: duration,
      service: 'database'
    });
  }
});

// Monitor connection pool
database.on('connection-pool-exhausted', () => {
  guardian.track('warning', 'Database connection pool exhausted', {
    activeConnections: database.getActiveConnections(),
    maxConnections: database.getMaxConnections(),
    service: 'database-pool'
  });
});

// Monitor replication lag
database.on('replication-lag', (lagMs) => {
  if (lagMs > 5000) {
    guardian.track('warning', `High DB replication lag: ${lagMs}ms`, {
      lagMs: lagMs,
      service: 'database-replication'
    });
  }
});
```

---

## 🎯 **Full Integration Example**

```typescript
// Complete setup in your host system
import express from 'express';
import AIGuardian from 'ai-guardian-sdk';

const app = express();
const guardian = new AIGuardian({
  apiKey: process.env.HELIX_API_KEY,
  backendUrl: 'http://localhost:5000',
  sampleRate: 1.0
});

// ===== 1. AUTO-TRACK HTTP REQUESTS =====
app.use(guardian.createMiddleware());

// ===== 2. AUTO-CATCH ERRORS =====
guardian.interceptErrors();

// ===== 3. MANUAL TRACKING IN ENDPOINTS =====
app.post('/api/users', async (req, res) => {
  try {
    const startTime = Date.now();
    const user = await User.create(req.body);
    const duration = Date.now() - startTime;
    
    // Log performance
    if (duration > 1000) {
      guardian.track('performance_degradation', 'Slow user creation', {
        duration,
        endpoint: '/api/users',
        service: 'user-service'
      });
    }
    
    res.json(user);
  } catch (error) {
    // Middleware catches this as 500 error
    throw error;
  }
});

// ===== 4. CUSTOM BUSINESS LOGIC MONITORING =====
app.post('/api/payments', async (req, res) => {
  try {
    if (req.body.amount > 10000) {
      guardian.track('warning', 'Large payment transaction', {
        amount: req.body.amount,
        userId: req.user?.id,
        service: 'payment-service'
      });
    }
    
    const result = await processPayment(req.body);
    res.json(result);
  } catch (error) {
    guardian.track('error', 'Payment processing failed', {
      error: error.message,
      amount: req.body.amount,
      service: 'payment-service'
    });
    throw error;
  }
});

// ===== 5. SCHEDULED MONITORING TASKS =====
setInterval(async () => {
  const health = await getSystemHealth();
  
  if (health.cpuUsage > 85) {
    guardian.track('warning', 'High CPU usage detected', {
      cpu: health.cpuUsage,
      memory: health.memoryUsage,
      service: 'system-monitor'
    });
  }
  
  if (health.diskUsage > 90) {
    guardian.track('warning', 'Low disk space', {
      diskUsage: health.diskUsage,
      availableSpace: health.availableSpace,
      service: 'system-monitor'
    });
  }
}, 30000); // Every 30 seconds

app.listen(3000);
```

---

## ✅ **Checklist: Is Your SDK Implementation Complete?**

- ✅ Event ingestion (POST `/events/ingest`)
- ✅ Error interception (JS errors + unhandled promises)
- ✅ HTTP middleware (request/response tracking)
- ✅ Manual event tracking (`track()` method)
- ✅ Event queue/batching support
- ✅ TypeScript types defined
- ✅ Configuration management
- ✅ Authentication via API key
- ✅ Sampling support
- ✅ Silent failure (doesn't break your app)

---

## 🔗 **Next Steps**

1. **Install SDK** in your host management system
2. **Get API Key** from Helix dashboard
3. **Add middleware** to your application
4. **Send test events** using `guardian.track()`
5. **Verify events appear** in Helix Dashboard
6. **Set up monitoring** for your specific services

---

## 📞 **SDK Configuration Reference**

```typescript
const guardian = new AIGuardian({
  // REQUIRED
  apiKey: string;
  
  // OPTIONAL
  backendUrl: string;     // Default: https://ai-guardian-backend.render.com
  enabled: boolean;       // Default: true
  sampleRate: number;     // Default: 1.0 (0-1 = 0-100%)
});
```

Your SDK is **production-ready** and fully implemented! 🚀
