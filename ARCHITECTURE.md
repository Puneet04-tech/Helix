# Helix - Architecture Deep Dive

## System Architecture Overview

Helix follows a **multi-tenant, event-driven, serverless architecture** optimized for zero-polling and autonomous response.

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                            │
├─────────────────────────────────────────────────────────────────┤
│ Hotel App / Hospital System / Public Service Platform            │
│ (Any Express.js / NestJS application)                           │
└────────────────────┬────────────────────────────────────────────┘
                     │ npm install ai-guardian-sdk
                     ▼
        ┌──────────────────────────────┐
        │   Helix SDK            │ ← 100 lines of code
        │ • HTTP middleware            │   Non-blocking
        │ • Error interception         │   < 10ms latency
        │ • Custom event tracking      │
        └──────────────┬───────────────┘
                       │ POST /events/ingest
                       │ (fire-and-forget, 200 response in <10ms)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    EVENT INGESTION LAYER                         │
│                    (Backend - NestJS/Express)                    │
├──────────────────────────────────────────────────────────────────┤
│ 1. Validate API key                                              │
│ 2. Write event to MongoDB (async, non-blocking)                  │
│ 3. Add to in-memory Map by projectId                             │
│ 4. Return 200 immediately ← SDK gets response here              │
│ 5. Continue processing asynchronously...                         │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│               PATTERN DETECTION LAYER                            │
│                  (In-Memory Analysis)                            │
├──────────────────────────────────────────────────────────────────┤
│ MemoryService.hasSuspiciousPattern()                             │
│                                                                  │
│ Check: Are there 3+ events of same type in 5-minute window?     │
│   ├─ NO  → Stop. Return "Pattern not detected"                  │
│   │        (No API calls wasted!)                               │
│   │                                                              │
│   └─ YES → Continue to HuggingFace...                           │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              ANALYTICS LAYER (with Caching)                      │
│                 (HuggingFace API)                                │
├──────────────────────────────────────────────────────────────────┤
│ HuggingFaceService.analyzeEvents()                               │
│                                                                  │
│ Step 1: Check 60-second cooldown cache                           │
│   ├─ CACHED → Return cached result (0 API calls)                │
│   │                                                              │
│   └─ NOT CACHED → Call HuggingFace API                          │
│       ├─ Format last 15 events as text                          │
│       ├─ Send to zero-shot classification                       │
│       ├─ Get confidence scores for: [normal, threat, ...]       │
│       └─ Cache result for 60 seconds                            │
│                                                                  │
│ Result: Is highest score > 0.65 AND not "normal"?               │
│   ├─ NO  → Stop. Return "Confidence too low"                    │
│   │        (Event logged but no incident)                       │
│   │                                                              │
│   └─ YES → Anomaly confirmed, continue...                       │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│               INCIDENT CREATION LAYER                            │
│              (MongoDB Document Creation)                         │
├──────────────────────────────────────────────────────────────────┤
│ IncidentsService.createIncident()                                │
│                                                                  │
│ Create incident document with:                                   │
│ • incidentId (UUID)                                              │
│ • severity, type, service, status = "detecting"                  │
│ • Related event IDs                                              │
│ • Timestamp                                                      │
│ • Placeholder for agent reasoning (to be filled)                │
│                                                                  │
│ → Save to MongoDB                                                │
│ → Return immediately                                             │
│ → Continue processing asynchronously...                          │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│             AUTONOMOUS AGENT CHAIN LAYER                         │
│                  (LangChain + Node Runtime)                      │
│                   (4-Agent Pipeline)                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ DEFAULT TIMEOUTS: maxIterations=5, timeout=30s per agent        │
│                                                                  │
│ ┌─ AGENT 1: DETECTION ─────────────────────────────────────┐    │
│ │ Input: Incident object + analysis results               │    │
│ │ Task: Confirm anomaly is real (not false positive)      │    │
│ │ Output: {                                                │    │
│ │   analysis: "Confirmed security threat pattern",        │    │
│ │   confidence: 0.92,                                      │    │
│ │   timestamp: now                                         │    │
│ │ }                                                        │    │
│ └────────────────────────────────────────────────────────┘     │
│                          ↓                                      │
│ ┌─ AGENT 2: ANALYSIS ──────────────────────────────────────┐    │
│ │ Input: Incident + detection results                     │    │
│ │ Task: Determine root cause & affected systems           │    │
│ │ Output: {                                                │    │
│ │   rootCause: "SQL injection attack on login endpoint",  │    │
│ │   affectedSystems: ["Auth Service", "User DB"],        │    │
│ │   estimatedImpact: "High - 2500 users blocked",        │    │
│ │   timestamp: now                                        │    │
│ │ }                                                        │    │
│ └────────────────────────────────────────────────────────┘     │
│                          ↓                                      │
│ ┌─ AGENT 3: RESPONSE ──────────────────────────────────────┐    │
│ │ Input: Incident + analysis results                      │    │
│ │ Task: Execute autonomous remediation actions            │    │
│ │ Has Tools: Playwright browser automation                │    │
│ │ Possible Actions:                                        │    │
│ │   • Restart service                                     │    │
│ │   • Scale up instances                                  │    │
│ │   • Rate-limit attackers                                │    │
│ │   • Clear cache                                         │    │
│ │   • Failover to backup                                  │    │
│ │ Output: {                                                │    │
│ │   actions: [                                             │    │
│ │     {                                                   │    │
│ │       action: "rate_limit",                             │    │
│ │       target: "Auth Service",                           │    │
│ │       result: "IP x.x.x.x rate-limited",                │    │
│ │       success: true                                     │    │
│ │     }                                                   │    │
│ │   ],                                                    │    │
│ │   timestamp: now                                        │    │
│ │ }                                                        │    │
│ └────────────────────────────────────────────────────────┘     │
│                          ↓                                      │
│ ┌─ AGENT 4: COMMUNICATIONS ─────────────────────────────────┐   │
│ │ Input: Incident + response results                      │   │
│ │ Task: Notify appropriate stakeholders                   │   │
│ │ Sends 3 role-based emails in parallel:                  │   │
│ │   • Developer: Technical details + remediation steps    │   │
│ │   • Manager: Business impact + automatic actions        │   │
│ │   • Owner: One-line summary                             │   │
│ │ Output: {                                                │   │
│ │   notifications: [                                       │   │
│ │     { recipient: "dev@company.com", status: "sent" },... │   │
│ │   ],                                                    │   │
│ │   timestamp: now                                        │   │
│ │ }                                                        │   │
│ └────────────────────────────────────────────────────────┘     │
│                                                                  │
│ Save final incident with all agent outputs                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              MULTI-TENANT DATA ISOLATION                         │
│                  (MongoDB Indexing)                              │
├──────────────────────────────────────────────────────────────────┤
│ Every query includes projectId filter:                           │
│ • db.incidents.find({ projectId: "org123", ... })              │
│ • WebSocket notifications only go to org123 users              │
│ • API responses filtered by JWT projectIds                     │
│ • Status page requires correct clientId                        │
│ → Hotel A never sees Hotel B's incidents                       │
│ → Users can only access their organization's data              │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│            REAL-TIME NOTIFICATION LAYER                          │
│                  (WebSocket + Emails)                            │
├──────────────────────────────────────────────────────────────────┤
│ 1. NotificationsGateway emits WebSocket event:                   │
│    socket.to(projectId).emit('incident:created', incident)     │
│    → All dashboard users for this org see incident in real-time │
│                                                                  │
│ 2. AlertsService sends role-based emails in parallel:           │
│    Promise.all([                                                 │
│      sendDeveloperAlert(...),                                     │
│      sendManagerAlert(...),                                       │
│      sendOwnerAlert(...)                                          │
│    ])                                                            │
│    → All role-specific emails sent simultaneously               │
│                                                                  │
│ 3. Dashboard polls status endpoint every 30 seconds             │
│    (for guests viewing public status page)                      │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│            OPTIONAL: FEATURES LAYER                              │
├──────────────────────────────────────────────────────────────────┤
│ Triggered by incident status or scheduled events:                │
│                                                                  │
│ • Predictive: Hourly cron checks 28-day patterns               │
│ • Postmortem: PDF generated when incident resolves             │
│ • Correlation: If 3+ incidents in 5 min, analyze shared root  │
│ • Compliance: Generate audit-ready reports                     │
│ • Chatbot: Query incidents with natural language               │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow: Complete Event to Response Timeline

```
t=0ms     | Event sent from client SDK
t=5ms     | Event reaches backend /events/ingest
t=8ms     | Event written to MongoDB (async) + added to in-memory Map
t=10ms    | SDK receives 200 response ← CLIENT DONE
          |
t=15ms    | Backend checks pattern: 3+ events of type X in 5 min?
          | ├─ No  → Stop processing
          | └─ Yes → Continue...
          |
t=50ms    | Check HuggingFace cache: Is projectId result fresh?
          | ├─ Yes → Use cached result (0 API calls)
          | └─ No  → Call HuggingFace API
          |
t=200ms   | HuggingFace response received
          | Check confidence > 0.65?
          | ├─ No  → Stop processing
          | └─ Yes → Anomaly confirmed, create incident
          |
t=210ms   | Incident document created in MongoDB
          | Start async agent chain...
          |
t=215ms   | Detection Agent refines confidence
t=380ms   | Analysis Agent determines root cause
t=1200ms  | Response Agent executes Playwright actions
t=1500ms  | Communications Agent sends emails
          |
t=1505ms  | Incident marked status="resolved" (if auto-fixed)
          | WebSocket event sent to all dashboard users
          | Postmortem generation started (async)
          |
t=3000ms  | PDF postmortem ready in MongoDB
          | All emails delivered
```

## Database Schema Relationships

```
Organization
    ↓
Client (stores API key + monitored services + status summary)
    ├─→ Users (developers, managers, owners)
    ├─→ Events (all incoming events)
    │   └─→ Incident (1 event can trigger 1 incident)
    │       └─→ Postmortem (auto-generated when resolved)
    └─→ Compliance Reports (aggregates incidents over date range)
```

## The Three-Layer Cache/Gate System

**Layer 1: In-Memory Pattern Gate**
- Requirement: 3+ same-type events in 5 minutes
- Storage: RAM (cleared on restart)
- Cost: 0 API calls until pattern confirmed
- Eliminates: Random single errors, transient spikes

**Layer 2: HuggingFace 60-Second Cooldown**
- Requirement: Only 1 API call per projectId per 60 seconds
- Storage: In-memory cache map
- Cost: Save 60x API calls during sustained incident
- Eliminates: Call storms during active incidents

**Layer 3: Confidence Threshold**
- Requirement: Anomaly confidence score > 0.65
- Computation: HuggingFace model output
- Cost: Skip false positives
- Eliminates: Borderline low-confidence classifications

**Result: 95% fewer API calls than polling-based systems**

## Multi-Tenancy Implementation

Every table has `projectId` field:

```sql
-- Example queries show automatic multi-tenant isolation:

-- Developer works on Hotel A incidents:
SELECT * FROM incidents WHERE projectId = 'hotel-a-org-id' AND status != 'resolved';

-- Hotel B data never appears in results
-- Even if they query the same endpoint, their JWT only contains their projectId

-- Admin can query all:
SELECT * FROM incidents WHERE organizationId = 'admin-org' AND ...;
```

## Performance Optimizations

### 1. **Non-Blocking Event Ingestion**
- Event write is async
- Response sent before database write completes
- Client SDK doesn't wait for analysis

### 2. **In-Memory Analysis**
- No database queries during pattern detection
- Simple Map lookup: O(1) speed

### 3. **Caching**
- HuggingFace results cached 60 seconds
- Analysis results reused across events
- Reduces expensive external API calls

### 4. **Streaming WebSocket Updates**
- No polling from frontend
- Instant status updates when incident occurs
- Reduces server load

### 5. **Async Processing**
- Agent chain runs after response sent
- No timeout waiting for agents
- Better UX: immediate feedback

## Scaling Considerations

**Current (Free Tier)**:
- Single Render instance
- Shared MongoDB compute
- Client connection limit: ~50 concurrent
- Event throughput: ~100 events/second

**Scaling Path**:
```
Free → Starter ($7) → Standard ($25) → Professional ($100+)

Concurrent clients: 50 → 500 → 5000 → 50,000+
Event throughput: 100/s → 1000/s → 10,000/s → 100,000/s

Bottlenecks to address:
1. MongoDB → Add read replicas, sharding
2. Agent chain latency → Add worker queue (Bull, RabbitMQ)
3. WebSocket connections → Add load balancer (multiple Render instances)
4. HuggingFace API → Add local model or multiple API keys
```

## Security Architecture

```
┌─ API Key Validation ─────────────────────┐
│ Every /events/ingest request requires:   │
│ • x-api-key header                       │
│ • Must match stored client.apiKey        │
│ • Validated against live client record   │
└──────────────────────────────────────────┘

┌─ JWT Authentication ────────────────────┐
│ All dashboard requests require:          │
│ • Bearer token in Authorization header   │
│ • JWT validated and decoded              │
│ • User's projectIds checked              │
│ • Response filtered by projectId         │
└──────────────────────────────────────────┘

┌─ Data Isolation ────────────────────────┐
│ Every query from backend includes:       │
│ • WHERE projectId = ...                 │
│ • Prevents cross-organization leaks     │
│ • Enforced at service layer             │
└──────────────────────────────────────────┘

┌─ Secrets Management ────────────────────┐
│ Never in code:                          │
│ • API keys → env variables              │
│ • Passwords → MongoDB Atlas users       │
│ • JWT secrets → deployment secrets      │
│ • Gmail passwords → App-specific tokens │
└──────────────────────────────────────────┘
```

---

For implementation details, see individual module documentation.
