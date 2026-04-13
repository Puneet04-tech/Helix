# Netlify Deployment - Environment Variables

> For frontend deployment on **Netlify.com**

## Production Environment

```env
# Backend API
NEXT_PUBLIC_API_URL=https://your-render-domain.onrender.com

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=wss://your-render-domain.onrender.com
NEXT_PUBLIC_WS_PATH=/socket.io

# JWT Configuration
NEXT_PUBLIC_TOKEN_STORAGE=localStorage
NEXT_PUBLIC_AUTH_TOKEN_KEY=helix_auth_token

# Feature Flags
NEXT_PUBLIC_ENABLE_LIVE_DEMO=true
NEXT_PUBLIC_ENABLE_CHAT_BOT=true
NEXT_PUBLIC_ENABLE_INCIDENT_CORRELATION=true

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Application
NEXT_PUBLIC_APP_NAME=Helix
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=production
```

## Build Environment

```env
# Node
NODE_ENV=production
NODE_OPTIONS=--max_old_space_size=4096

# Build configuration
NEXT_PUBLIC_API_URL=https://your-render-domain.onrender.com
```

## Setup Instructions on Netlify

### 1. Connect Repository
- Site name: `helix-dashboard`
- Git repository: `https://github.com/your-username/Helix`
- Branch to deploy: `main`

### 2. Build Settings
- **Build command**: `cd frontend && npm run build`
- **Publish directory**: `frontend/.next`
- **Node version**: 18.x or higher

### 3. Add Environment Variables
- Go to Site Settings → Build & Deploy → Environment
- Choose "Environment variables"
- Add variables from **Production Environment** section above

### 4. Build Triggers
- Auto-deploy on main branch push
- Or manual deploy from Netlify dashboard

### 5. Domain Configuration
- Custom domain: `your-domain.com` (optional)
- Auto SSL certificate (automatic on Netlify)
- Redirect HTTP to HTTPS (enabled)

## Deployment Checklist

- [ ] GitHub repository connected
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] API URL points to Render backend
- [ ] WebSocket URL configured
- [ ] Build succeeds locally: `npm run build`
- [ ] CORS headers configured on backend
- [ ] API key authentication working
- [ ] Incident dashboard loading data
- [ ] WebSocket real-time updates working
- [ ] Login/logout flows tested
- [ ] Mobile responsiveness verified

## Troubleshooting

### Build Failures
```bash
# Increase memory
NEXT_PUBLIC_NODE_OPTIONS="--max_old_space_size=4096"
```

### CORS Errors
Ensure Render backend has:
```env
CORS_ORIGIN=https://your-netlify-domain.netlify.app
```

### WebSocket Connection Issues
- Check WebSocket path: `/socket.io`
- Verify protocol: `wss://` (secure)
- Ensure backend supports WebSocket upgrades

### Environment Variables Not Loading
- Build variables are NOT available at runtime
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Restart build after adding variables

## Performance Optimization

```env
# Enable caching headers
NEXT_PUBLIC_CACHE_CONTROL=max-age=3600

# Reduce bundle size
NEXT_PUBLIC_ENABLE_ANALYTICS=false  # If not using
```

## Monitoring

Netlify provides:
- Deploy logs: Site settings → Deploys
- Analytics: Site settings → Analytics & integrations
- Function logs: Netlify Functions dashboard

Check frontend health:
- `https://your-netlify-domain.netlify.app/` → Should load dashboard
- WebSocket connection in DevTools → Network → WS tab

---

*Note: All `NEXT_PUBLIC_*` variables are bundled in JavaScript, so never use secrets. Use backend API endpoints for sensitive operations.*
