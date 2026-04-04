# Helix SDK

✨ **Autonomous Crisis Detection & Incident Management with 7 AI-powered features**

Integrate Helix into your application to enable predictive crisis detection, NLP incident queries, automated postmortems, compliance tracking, and more.

## Features

- 🔮 **Predictive Crisis Detection** - Detect patterns 28 days before incidents
- 🤖 **NLP Incident Queries** - Ask questions about incidents in natural language
- 📧 **Role-Based Alerts** - Different notifications for developers, managers, owners
- 📋 **Automatic Postmortems** - LLM-generated 5-section PDF reports
- 🌐 **Public Status Page** - Guest-facing status updates
- 🔗 **Multi-System Correlation** - Find shared root causes across services
- 📊 **Compliance Logging** - Audit-ready incident reports

## Installation

```bash
npm install helix-sdk
```

## Quick Start

### For Node.js / Express / NestJS

```javascript
import Helix from 'helix-sdk';

const helix = new Helix({
  apiKey: 'your-api-key',
  backendUrl: 'https://helix-backend.render.com', // optional
});

// Track HTTP errors automatically
app.use(helix.createMiddleware());

// Intercept unhandled errors
helix.interceptErrors();
```

### For React / Frontend

```javascript
import Helix from 'helix-sdk';

const helix = new Helix({ apiKey: 'your-api-key' });
helix.interceptErrors();
```

## API Reference

### Constructor

```typescript
const helix = new Helix({
  apiKey: string;              // Required: Your Helix API key
  backendUrl?: string;          // Optional: Backend URL (default: Render deployment)
  enabled?: boolean;            // Optional: Enable/disable (default: true)
  sampleRate?: number;          // Optional: Event sampling 0-1 (default: 1.0)
});
```

### Core Methods

#### Error Tracking

```typescript
helix.interceptErrors();        // Auto-capture unhandled JS errors
helix.createMiddleware();       // Track HTTP requests (Express/NestJS)
helix.track(type, message, metadata); // Manual event tracking
```

#### Feature-Specific Methods

```typescript
// Feature 1: Predictive Crisis Detection
helix.trackCrisisPrediction('database', 'error_spike_pattern', 'high');

// Feature 2: NLP Events
helix.trackNLPEvent('What failed this week?', 15);

// Feature 3: Role-Based Alerts
helix.trackAlertDispatch('manager', 'INC-123', 'critical');

// Feature 4: Postmortem Tracking
helix.trackPostmortemGenerated('INC-123', 5);

// Feature 5: Status Updates
helix.trackStatusUpdate('client-1', [
  { name: 'API', status: 'operational' },
  { name: 'DB', status: 'degraded' }
]);

// Feature 6-7: Correlation
helix.trackCorrelation(['INC-1', 'INC-2', 'INC-3'], 'Database crash', 0.95);

// Feature 8: Compliance Events
helix.trackComplianceEvent('incident_logged', 'INC-123', 'SOC2');
```

#### Status

```typescript
const status = helix.getStatus();
// { initialized: true, enabled: true, features: [...] }
```

## Examples

### Express Middleware Integration

```javascript
import express from 'express';
import Helix from 'helix-sdk';

const app = express();
const helix = new Helix({ apiKey: process.env.HELIX_API_KEY });

app.use(helix.createMiddleware());
app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
```

### React Error Boundary

```jsx
import { useEffect } from 'react';
import Helix from 'helix-sdk';

const helix = new Helix({ apiKey: process.env.REACT_APP_HELIX_KEY });

export function App() {
  useEffect(() => {
    helix.interceptErrors();
  }, []);

  return <div>Your App</div>;
}
```

### Manual Crisis Tracking

```javascript
// When you detect a pattern
helix.trackCrisisPrediction('payment-service', 'timeout_pattern', 'medium');

// When generating compliance reports
helix.trackComplianceEvent('report_generated', 'REP-001', 'ISO27001');

// When incidents correlate
helix.trackCorrelation(['INC-10', 'INC-11', 'INC-12'], 'DNS resolution failure', 0.92);
```

## Configuration

### Sampling (Reduce Volume)

```typescript
const helix = new Helix({
  apiKey: 'your-key',
  sampleRate: 0.1, // Send 10% of events
});
```

### Environment-Based Config

```typescript
const helix = new Helix({
  apiKey: process.env.HELIX_API_KEY,
  enabled: process.env.NODE_ENV === 'production',
});
```

## Performance

- **Latency**: < 10ms (fire-and-forget async)
- **Memory**: < 5MB footprint
- **Bandwidth**: Compressed events, minimal overhead

## Security

- Events encrypted in transit (HTTPS)
- API keys validated server-side
- Never log sensitive data (passwords, tokens, PII)
- Non-blocking, doesn't interfere with app

## License

MIT

## Support

📧 support@helix.dev  
🐛 [Report Issues](https://github.com/yourusername/helix-sdk/issues)

[https://ai-guardian.dev/docs](https://ai-guardian.dev/docs)
