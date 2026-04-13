# Helix Deployment Guide - Render + Netlify Stack

## 📋 Quick Reference

| Component | Platform | Environment | URL Pattern |
|-----------|----------|-------------|------------|
| **Backend API** | Render | Production | `https://your-render-name.onrender.com` |
| **Frontend** | Netlify | Production | `https://your-netlify-site.netlify.app` |
| **Database** | MongoDB Atlas | Cloud | `mongodb+srv://...` |
| **LLM Services** | Groq API | Cloud | `https://api.groq.com` |

---

## 🚀 Step-by-Step Deployment

### Phase 1: Backend Deployment (Render)

#### 1.1 Prepare Repository
```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

#### 1.2 Create Render Service
1. Go to [render.com](https://render.com)
2. Click "New +" → Web Service
3. Select your GitHub repository
4. Configure:
   - **Name**: `helix-api`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: Starter or Standard (512MB RAM recommended)

#### 1.3 Set Environment Variables on Render
Navigate to **Settings → Environment** and add:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/helix-prod?retryWrites=true&w=majority
JWT_SECRET=<generate with: openssl rand -base64 32>
GROQ_API_KEY=<your groq key>
GROQ_MODEL=llama-3.1-8b-instant
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-netlify-site.netlify.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<gmail app password>
```

#### 1.4 Deploy
- Click "Create Web Service"
- Render will auto-deploy from main branch
- Monitor logs in Render dashboard

#### 1.5 Verify Backend
```bash
curl https://your-render-name.onrender.com/health
# Should respond with: {"status": "ok"}
```

---

### Phase 2: Frontend Deployment (Netlify)

#### 2.1 Create Netlify Site
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → Import an existing project
3. Select GitHub → Choose repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

#### 2.2 Set Environment Variables on Netlify
Go to **Site settings → Build & deploy → Environment**

Add these variables:
```
NEXT_PUBLIC_API_URL=https://your-render-name.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-render-name.onrender.com
NEXT_PUBLIC_WS_PATH=/socket.io
NODE_ENV=production
```

#### 2.3 Deploy
- Netlify auto-deploys from main branch
- Monitor build logs in Netlify dashboard
- Check deploy preview before publishing

#### 2.4 Verify Frontend
- Navigate to `https://your-netlify-site.netlify.app`
- Login with test credentials
- Verify WebSocket connection (DevTools → Network → WS)

---

## 🔗 Environment Variables Summary

### Render (Backend) - `.env` Template
```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/helix-prod

# Authentication
JWT_SECRET=<generate new secret>
JWT_EXPIRATION=24h

# AI Services
GROQ_API_KEY=<your groq api key>
GROQ_MODEL=llama-3.1-8b-instant

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=<app password>
EMAIL_FROM=noreply@helix.com

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
CORS_ORIGIN=https://your-netlify-site.netlify.app

# Business Rules
INCIDENT_THRESHOLD=3
PATTERN_MATCH_THRESHOLD=0.75
ANOMALY_SENSITIVITY=0.8
```

### Netlify (Frontend) - Build Environment
```env
NEXT_PUBLIC_API_URL=https://your-render-name.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-render-name.onrender.com
NEXT_PUBLIC_WS_PATH=/socket.io
NODE_ENV=production
```

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is cryptographically strong (32+ bytes)
- [ ] API keys stored in Render environment (not in git)
- [ ] MongoDB IP whitelist includes Render's Static IP (if available)
- [ ] CORS origin matches Netlify domain exactly
- [ ] Email credentials use app-specific passwords (not main password)
- [ ] HTTPS enforced on both Render and Netlify
- [ ] WebSocket uses WSS (secure WebSocket)
- [ ] `.env.local` files never committed to git
- [ ] Sensitive variables use Render's secure storage
- [ ] Dashboard requests authenticated via JWT

---

## 📊 Data Flow Architecture

```
User Browser (Netlify)
    ↓
HTTPS → Render API (Port 3000)
    ↓ TCP Connection
WebSocket (WSS://)
    ↓
MongoDB Atlas (Cloud Database)
    ↓
Groq AI (LLM Analysis)
    ↓
Incident Detection → Real-time Updates to Dashboard
```

---

## 🧪 Testing After Deployment

### 1. Backend API
```bash
# Health check
curl https://your-render-name.onrender.com/health

# Test authentication
curl -X POST https://your-render-name.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@helix.local",
    "password": "Test@12345",
    "firstName": "Test",
    "lastName": "User",
    "organizationId": "test-org"
  }'
```

### 2. Frontend
- [ ] Login page loads
- [ ] Dashboard displays
- [ ] Real-time event updates work
- [ ] WebSocket connected (check DevTools)
- [ ] No CORS errors in console

### 3. End-to-End
- [ ] Send test event via API
- [ ] Verify incident creation
- [ ] Check dashboard receives update
- [ ] Test Groq AI analysis

---

## 🔄 Continuous Deployment

Both Render and Netlify support auto-deployment:

```
git push origin main
    ↓
GitHub webhook triggers build
    ↓
Render: Tests → Builds → Deploys
Netlify: Builds → Deploys
    ↓
Monitor logs in dashboard
    ↓
Verify in production
```

---

## 📚 Additional Resources

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Groq API Docs**: https://console.groq.com/docs

---

## ⚠️ Troubleshooting

### Backend Won't Start
1. Check Render logs: Site Dashboard → Logs
2. Verify all required environment variables set
3. Test database connection string locally
4. Check MongoDB Atlas IP whitelist

### Frontend Build Fails
1. Check Netlify build logs
2. Run locally: `cd frontend && npm run build`
3. Ensure NEXT_PUBLIC_* variables set
4. Check Node version compatibility

### CORS Errors
1. Verify `CORS_ORIGIN` matches exactly: `https://domain.netlify.app`
2. Check backend is running
3. Clear browser cache
4. Try incognito mode

### WebSocket Connection Issues
1. Inspect DevTools → Network → WS tab
2. Check WSS (secure WebSocket) protocol
3. Verify backend supports WebSocket
4. Check reverse proxy settings on Render

---

*Last Updated: April 13, 2026*
