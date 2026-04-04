# Helix - Deployment Guide

## Prerequisites

- Git repository (GitHub)
- Render account (free)
- Netlify account (free)
- MongoDB Atlas account (free)
- Gmail account for notifications
- HuggingFace account for API

---

## Step 1: Database Setup (MongoDB Atlas)

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free account
3. Create new cluster (M0 Shared)
4. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/ai-guardian
   ```
5. Set IP whitelist to `0.0.0.0/0` (okay for demo)
6. Save connection string

---

## Step 2: Configure Backend Secrets

Create `.env` file in backend folder:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.netlify.app

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai-guardian

# JWT
JWT_SECRET=generate-a-random-secret-key-here

# AI
HUGGINGFACE_API_KEY=YOUR_API_KEY_key_here

# Email (Gmail App Password)
NODEMAILER_EMAIL=your-email@gmail.com
NODEMAILER_PASS=your-16-char-app-password

# Cache
CACHE_DIR=./.cache
TEMP_DIR=./.temp
PLAYWRIGHT_BROWSERS_PATH=./.cache/playwright
```

### Get Gmail App Password:
1. Enable 2-step verification: myaccount.google.com → Security
2. App passwords → Select "Mail" and "Windows Computer"
3. Copy 16-character password → Paste in NODEMAILER_PASS

### Get HuggingFace API Key:
1. Go to huggingface.co/settings/tokens
2. Create new token (READ)
3. Copy and paste in HUGGINGFACE_API_KEY

---

## Step 3: Deploy Backend to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect GitHub repo (backend folder)
5. Configure:

```
Name: ai-guardian-backend
Environment: Node
Build Command: npm install && npm run build
Start Command: npm run start:prod
```

6. Add environment variables (copy from `.env`)
7. Deploy

### Critical Settings:
- **Spin Down**: Enable (free tier auto-pauses after 15 min inactivity)
- **Memory**: 1 GB (sufficient)
- **Concurrent Builds**: 1

Get backend URL: `https://ai-guardian-backend-xxxx.onrender.com`

---

## Step 4: Deploy Frontend to Netlify

1. Build frontend locally:
```bash
cd frontend
npm run build
# Creates .next output
```

2. Go to [netlify.com](https://netlify.com)
3. Connect GitHub repo (frontend folder)
4. Configure:

```
Build Command: npm run build
Publish Directory: .next
```

5. Set environment variables:

```
NEXT_PUBLIC_API_URL=https://ai-guardian-backend-xxxx.onrender.com
NEXT_PUBLIC_WS_URL=wss://ai-guardian-backend-xxxx.onrender.com
```

6. Deploy

Get frontend URL: `https://your-app.netlify.app`

---

## Step 5: SDK Publication (npm)

```bash
cd sdk
npm run build
npm login
npm publish
```

This publishes to npm public registry. Clients install with:
```bash
npm install ai-guardian-sdk
```

---

## Step 6: Verify Deployment

### Test Backend Health:
```bash
curl https://ai-guardian-backend-xxxx.onrender.com/health
# Should return: { status: "ok", service: "Helix Backend" }
```

### Test Frontend:
Visit `https://your-app.netlify.app` → You should see login page

### Test SDK:
```bash
npm install ai-guardian-sdk
const AIGuardian = require('ai-guardian-sdk').default;
const guardian = new AIGuardian({ apiKey: 'ag_...' });
console.log(guardian.getStatus());
```

---

## Step 7: CORS Configuration

Backend already has CORS configured for:
- http://localhost:3000 (dev)
- http://localhost:3001 (dev)
- Your Netlify frontend URL

If frontend can't reach backend, check:
1. Backend CORS origin list in `src/main.ts`
2. Frontend environment variables are correct
3. Backend is responding to OPTIONS requests

---

## Common Issues

### **"Cannot connect to MongoDB"**
- Check MONGODB_URI in .env
- Verify IP whitelist includes your Render IP
- Test connection locally: `mongo "your-connection-string"`

### **"Gmail SMTP fails"**
- Ensure 2-step verification enabled
- Use App Password, not regular password
- Check NODEMAILER_EMAIL and NODEMAILER_PASS

### **"HuggingFace API rate limited"**
- Check HUGGINGFACE_API_KEY is valid
- Verify free tier quota not exceeded
- SDK caches responses for 60 seconds

### **"Frontend URL not connecting to backend"**
- Check NEXT_PUBLIC_API_URL environment variable
- Ensure CORS origins include frontend URL
- Check backend health endpoint

### **"Render spun down after 15 min"**
- This is expected on free tier
- It will wake up on next request (takes 30-50s)
- For production, upgrade Render plan to $7/month minimum

---

## Production Checklist

- [ ] JWT_SECRET is not default
- [ ] Database backups enabled (MongoDB Atlas)
- [ ] HTTPS enforced everywhere
- [ ] Environment secrets not committed to Git
- [ ] Rate limiting enabled
- [ ] CDN configured (Cloudflare recommended)
- [ ] Monitoring and alerting set up
- [ ] SSL certificate valid
- [ ] Database indexed for queries
- [ ] Performance optimizations tested

---

## Monitoring

### Render Dashboard:
- View logs: `https://dashboard.render.com`
- Monitor CPU/Memory usage
- Check deployment logs for errors

### Netlify Dashboard:
- View deploy logs
- Check function logs for errors
- Monitor uptime

### MongoDB Atlas:
- Monitor storage usage (M0 limit: 512MB)
- Check connection logs
- View query metrics

---

## Rollback Procedure

If deployment breaks:

```bash
# Backend:
# 1. Go to Render dashboard
# 2. Click "Manual Deploy"
# 3. Select previous commit
# 4. Deploy

# Frontend:
# 1. Go to Netlify
# 2. Click "Deploys"
# 3. Select previous deploy
# 4. Click "Publish deploy"
```

---

## Cost Summary (Monthly)

| Service | Free Tier | Production Tier | Cost |
|---------|-----------|-----------------|------|
| Render Backend | Yes (auto spin-down) | Starter | $7 |
| Netlify Frontend | Yes | Pro | $19 |
| MongoDB Atlas | M0 (512MB) | M2 (10GB) | $9 |
| HuggingFace API | Free tier | Paid | ~$10 |
| Gmail SMTP | Unlimited | - | $0 |
| **TOTAL** | **$0** | **$45+** | |

---

For additional help, see the main [README.md](../README.md)
