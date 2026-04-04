# Helix SDK

Autonomous Crisis Detection and Response for your application.

## Installation

```bash
npm install ai-guardian-sdk
# or
yarn add ai-guardian-sdk
```

## Quick Start

### For Node.js / Express / NestJS

```javascript
import AIGuardian from 'ai-guardian-sdk';
import express from 'express';

const app = express();
const guardian = new AIGuardian({
  apiKey: 'your-api-key-from-dashboard',
  backendUrl: 'https://ai-guardian-backend.render.com', // optional
});

// Add middleware to track HTTP requests
app.use(guardian.createMiddleware());

// Optionally intercept client-side errors (if using with frontend)
guardian.interceptErrors();

app.listen(3000);
```

### For React / Frontend

```javascript
import AIGuardian from 'ai-guardian-sdk';

const guardian = new AIGuardian({
  apiKey: 'your-api-key-from-dashboard',
});

// Automatically capture unhandled errors
guardian.interceptErrors();

// Manual event tracking
guardian.track('warning', 'User action completed', {
  userId: user.id,
  action: 'profile_update',
});
```

## API

### Constructor

```typescript
const guardian = new AIGuardian({
  apiKey: string;              // Required: Your API key from Helix dashboard
  backendUrl?: string;          // Optional: Backend URL (defaults to Render deployment)
  enabled?: boolean;            // Optional: Enable/disable SDK (default: true)
  sampleRate?: number;          // Optional: Event sample rate 0-1 (default: 1.0)
});
```

### Methods

#### `sendEvent(event)`

Send a custom event:

```typescript
guardian.sendEvent({
  type: 'warning|error|info|security_threat|performance_degradation|...',
  service: 'my-service',
  message: 'Something happened',
  metadata: {
    userId: 'user123',
    endpoint: '/api/users',
    // ... any additional data
  },
});
```

#### `track(type, message, metadata)`

Convenience method for tracking:

```typescript
guardian.track('warning', 'Payment processing slow', {
  userId: 'user123',
  processingTime: 2500,
});
```

#### `interceptErrors()`

Automatically capture JavaScript errors and unhandled promise rejections:

```typescript
guardian.interceptErrors();
```

#### `createMiddleware()`

Express/NestJS middleware that automatically tracks HTTP requests:

```typescript
app.use(guardian.createMiddleware());
```

#### `getStatus()`

Get SDK status:

```typescript
const status = guardian.getStatus();
// { initialized: true, enabled: true, apiKey: 'ag_xxxxxxxxx...' }
```

## Event Types

- `error` - Application errors
- `warning` - Warnings and issues
- `info` - Informational events
- `security_threat` - Security incidents
- `performance_degradation` - Performance issues
- `unauthorized_access` - Auth failures
- `rate_limit_exceeded` - Rate limits hit

## How It Works

1. **Event Collection**: SDK silently collects errors and events from your app
2. **Transmission**: Events are sent to Helix backend (fire-and-forget, non-blocking)
3. **Detection**: Backend analyzes event patterns in real-time
4. **Response**: When suspicious patterns detected, autonomous agents take action
5. **Notification**: Your team is notified with role-based emails

## Configuration

### Sample Rate

Reduce event volume by sampling:

```typescript
const guardian = new AIGuardian({
  apiKey: 'your-key',
  sampleRate: 0.1, // Send only 10% of events
});
```

### Disable in Development

```typescript
const guardian = new AIGuardian({
  apiKey: 'your-key',
  enabled: process.env.NODE_ENV === 'production',
});
```

## Security

- API keys are transmitted over HTTPS only
- Events are encrypted in transit
- No sensitive data (passwords, tokens) should be included in events
- SDK is non-intrusive and doesn't interfere with app execution

## Performance

- **Latency**: < 10ms impact on application (fire-and-forget)
- **Bandwidth**: Minimal - event compression and sampling reduce volume
- **Memory**: < 5MB footprint

## License

MIT

## Support

[https://ai-guardian.dev/docs](https://ai-guardian.dev/docs)
