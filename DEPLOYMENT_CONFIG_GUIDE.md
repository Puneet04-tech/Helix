# Deployment Configuration Guide

## 📁 Configuration Files

This guide explains the two main deployment configuration files:

1. **`netlify.toml`** - Frontend deployment on Netlify
2. **`render.yml`** - Backend deployment on Render

---

## 🚀 Netlify Configuration (`netlify.toml`)

### What It Does
- Specifies how Netlify builds and deploys the Next.js frontend
- Configures security headers, redirects, and caching
- Manages environment variables for build time
- Sets up API proxies to the Render backend

### Key Sections

#### Build Configuration
```toml
[build]
publish = "frontend/.next"           # Directory to deploy
command = "cd frontend && npm run build"  # Build command
base = "."                           # Start directory
```

#### Environment Variables
```toml
[build.environment]
NODE_VERSION = "18.17.0"
NEXT_PUBLIC_API_URL = "https://your-render-domain.onrender.com"
NEXT_PUBLIC_WS_URL = "wss://your-render-domain.onrender.com"
```

**Important**: Variables with `NEXT_PUBLIC_` prefix are visible in JavaScript bundle.

#### API Proxy
```toml
[[redirects]]
from = "/api/*"
to = "https://your-render-domain.onrender.com/api/:splat"
```

This allows frontend to call `https://netlify-domain/api/*` which proxies to backend.

#### Security Headers
```toml
[[headers]]
for = "/*"
X-Frame-Options = "SAMEORIGIN"
Content-Security-Policy = "..."
```

Prevents clickjacking, XSS, and MIME sniffing attacks.

#### Cache Control
```toml
[[headers]]
for = "/_next/static/*"
Cache-Control = "public, max-age=31536000, immutable"
```

Caches static assets for 1 year (they include hash in filename).

---

## ⚙️ Render Configuration (`render.yml`)

### What It Does
- Specifies how Render builds and deploys the NestJS backend
- Declares all environment variables and secrets
- Configures health checks, auto-deploy, and scaling
- Sets up database connections

### Key Sections

#### Service Definition
```yaml
services:
  - type: web
    name: helix-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    port: 3000
```

#### Environment Variables
```yaml
envVars:
  - key: NODE_ENV
    value: production
  - key: MONGODB_URI
    fromDatabase:
      name: helix-mongodb
      property: connectionString
```

Variables with `sync: false` are secrets - set manually in Render dashboard.

#### Health Check
```yaml
healthCheckPath: /health
healthCheckTimeout: 30
```

Render pings `/health` endpoint to ensure service is running.

#### Routes
```yaml
routes:
  - type: http
    path: /
  - type: http
    path: /api/*
  - type: ws
    path: /socket.io/*
```

Declares HTTP and WebSocket routes.

---

## 🔧 Setup Instructions

### Step 1: Update Configuration Files

#### In `netlify.toml`, replace:
```toml
NEXT_PUBLIC_API_URL = "https://your-render-domain.onrender.com"
NEXT_PUBLIC_WS_URL = "wss://your-render-domain.onrender.com"
CORS_ORIGIN = "https://your-netlify-site.netlify.app"
```

With your actual domains.

#### In `render.yml`, replace:
```yaml
- key: CORS_ORIGIN
  value: "https://your-netlify-domain.netlify.app"
```

### Step 2: Connect to Deployment Platforms

#### Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Select GitHub repository
4. Netlify auto-detects `netlify.toml`
5. Set any additional environment variables in Site Settings

#### Render
1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Select GitHub repository
4. Render auto-detects `render.yml`
5. Set secure variables in Service Settings

### Step 3: Test Deployment

```bash
# Verify Netlify build locally
cd frontend && npm run build

# Verify Render build locally
cd backend && npm install && npm run build
```

---

## 📋 Environment Variables by Platform

### Netlify (frontend/.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-render-domain.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-render-domain.onrender.com
NEXT_PUBLIC_WS_PATH=/socket.io
```

**Note**: All `NEXT_PUBLIC_*` variables are exposed in JavaScript:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)  // Works!
console.log(process.env.SECRET_KEY)            // undefined
```

### Render (backend/.env)
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<generate-with-openssl>
GROQ_API_KEY=<your-key>
CORS_ORIGIN=https://your-netlify-domain.netlify.app
```

**Note**: Secrets are NOT exposed to frontend.

---

## 🔄 Auto-Deploy Flow

```
git push origin main
    ↓
GitHub webhook triggers both platforms
    ↓
Netlify builds frontend:
  - Runs: cd frontend && npm run build
  - Deploys: frontend/.next to CDN
  - Updates: https://your-netlify-site.netlify.app
    ↓
Render builds backend:
  - Runs: npm install && npm run build
  - Runs: npm run start:prod
  - Updates: https://your-render-domain.onrender.com
    ↓
Both live simultaneously!
```

---

## 🧪 Testing After Deployment

### 1. Test Backend
```bash
curl https://your-render-domain.onrender.com/health
# Should respond: {"status": "ok"}
```

### 2. Test Frontend
```bash
curl https://your-netlify-site.netlify.app
# Should return HTML with correct API_URL injected
```

### 3. Check Build Logs
- **Netlify**: Deploys tab → Select deploy
- **Render**: Log view in dashboard

### 4. Verify Environment Variables
- **Netlify**: Site Settings → Build & deploy → Environment
- **Render**: Service Settings → Environment

---

## 🚨 Troubleshooting

### Netlify Build Fails
**Error**: `Cannot find module 'backend'`
- **Fix**: Edit `netlify.toml`:
  ```toml
  base = "frontend"
  command = "npm run build"
  ```

### Render Build Fails
**Error**: `Port already in use`
- **Fix**: Change port in `render.yml`:
  ```yaml
  port: 3000  # Try different port if 3000 in use
  ```

### CORS Errors
**Error**: `Access to XMLHttpRequest blocked by CORS`
- **Fix**: Ensure `CORS_ORIGIN` in Render matches exactly:
  ```yaml
  - key: CORS_ORIGIN
    value: "https://your-site.netlify.app"  # Must match!
  ```

### WebSocket Connection Fails
**Error**: `WebSocket connection failed`
- **Fix**: Ensure `netlify.toml` has:
  ```toml
  [[redirects]]
  from = "/socket.io/*"
  to = "..."
  force = true
  ```

---

## 📊 Configuration File Checklist

### Before Committing to Git
- [ ] Replace `your-render-domain.onrender.com` with actual domain
- [ ] Replace `your-netlify-site.netlify.app` with actual domain
- [ ] Verify all paths are correct
- [ ] No secrets hardcoded in files
- [ ] `sync: false` for all sensitive variables in `render.yml`

### After Creating Deployments
- [ ] Netlify: Set NEXT_PUBLIC_* variables
- [ ] Netlify: Verify plugin: `@netlify/plugin-nextjs`
- [ ] Render: Set `sync: false` variables manually
- [ ] Render: Add MongoDB connection string
- [ ] Both: Test `/health` and root endpoints

---

## 📝 Optional: Advanced Configuration

### Netlify Edge Functions
Create `netlify/functions/api.js` for serverless functions:
```javascript
exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from Edge' })
  };
};
```

### Render Cron Jobs
Schedule maintenance tasks:
```yaml
schedules:
  - fromValue: "0 2 * * *"  # 2 AM daily
    toValue: npm run cleanup
```

### Environment-Specific Builds
```toml
[context.production]
command = "cd frontend && npm run build"

[context.deploy-preview]
command = "cd frontend && npm run build"
```

---

## 🔗 Quick Links

- [Netlify Docs](https://docs.netlify.com/)
- [Render Docs](https://render.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NestJS Production](https://docs.nestjs.com/deployment)

---

## ✨ Summary

| File | Purpose | When to Edit |
|------|---------|-------------|
| `netlify.toml` | Frontend deploy config | Change API domain, add headers, adjust cache |
| `render.yml` | Backend deploy config | Change port, add env vars, configure health check |

Both files auto-detected by deployment platforms. Commit to GitHub, platforms auto-update on push!

---

*Configuration files created for production Helix deployment*
