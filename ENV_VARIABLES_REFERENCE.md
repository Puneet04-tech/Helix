# Environment Variables Quick Reference

## Summary Table

| Variable | Render | Netlify | Local | Required | Type |
|----------|--------|---------|-------|----------|------|
| **MONGODB_URI** | ✅ | ❌ | ✅ | Yes | Secret |
| **JWT_SECRET** | ✅ | ❌ | ✅ | Yes | Secret |
| **JWT_EXPIRATION** | ✅ | ❌ | ✅ | No | Config |
| **GROQ_API_KEY** | ✅ | ❌ | ✅ | Yes | Secret |
| **GROQ_MODEL** | ✅ | ❌ | ✅ | No | Config |
| **EMAIL_HOST** | ✅ | ❌ | ✅ | No | Config |
| **EMAIL_USER** | ✅ | ❌ | ✅ | No | Secret |
| **EMAIL_PASSWORD** | ✅ | ❌ | ✅ | No | Secret |
| **NODE_ENV** | ✅ | ✅ | ✅ | Yes | Config |
| **PORT** | ✅ | ❌ | ✅ | No | Config |
| **CORS_ORIGIN** | ✅ | ❌ | ✅ | Yes | Config |
| **NEXT_PUBLIC_API_URL** | ❌ | ✅ | ✅ | Yes | Public |
| **NEXT_PUBLIC_WS_URL** | ❌ | ✅ | ✅ | Yes | Public |
| **NEXT_PUBLIC_WS_PATH** | ❌ | ✅ | ✅ | No | Public |
| **NEXT_PUBLIC_GA_ID** | ❌ | ✅ | ✅ | No | Public |

## Environment Setup by Context

### 1️⃣ Local Development (`backend/.env`)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/helix

# JWT
JWT_SECRET=dev-secret-key-32-bytes-minimum-required

# Groq
GROQ_API_KEY=your_groq_api_key

# Server
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### 2️⃣ Render Production Backend
```env
# All BACKEND variables EXCEPT NEXT_PUBLIC_*
# See .env.render.example for full list
PORT=3000
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

### 3️⃣ Netlify Production Frontend
```env
# Only NEXT_PUBLIC_* and build variables
NEXT_PUBLIC_API_URL=https://your-render-name.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-render-name.onrender.com
NODE_ENV=production
```

---

## 🔑 Critical Variables by Category

### Database (REQUIRED)
- **Local**: `MONGODB_URI=mongodb://localhost:27017/helix`
- **Production**: `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db`

### Authentication (REQUIRED)
```bash
# Generate strong JWT secret:
openssl rand -base64 32

# Result: Copy to both local .env and Render environment
JWT_SECRET=<32-byte-base64-string>
```

### AI/LLM (REQUIRED for analysis)
- `GROQ_API_KEY=gsk_*.*..*` (from console.groq.com)
- `GROQ_MODEL=llama-3.1-8b-instant` (current model)

### API Configuration (REQUIRED for production)
- **Render**: `CORS_ORIGIN=https://domain.netlify.app` (exact match)
- **Netlify**: `NEXT_PUBLIC_API_URL=https://render-domain.onrender.com`

---

## 📋 Setup Checklist

### Before Deploying to Render

- [ ] Generate strong JWT_SECRET: `openssl rand -base64 32`
- [ ] MongoDB Atlas connection string ready
- [ ] Groq API key active
- [ ] Email credentials verified (Gmail app password if using Gmail)
- [ ] CORS_ORIGIN set to your Netlify domain
- [ ] All required environment variables set in Render dashboard

### Before Deploying to Netlify

- [ ] Render backend operational and responding to `/health`
- [ ] API URL verified: `NEXT_PUBLIC_API_URL=https://...onrender.com`
- [ ] WebSocket URL configured: `NEXT_PUBLIC_WS_URL=wss://...onrender.com`
- [ ] Build succeeds locally: `npm run build` in frontend/
- [ ] All `NEXT_PUBLIC_*` variables set in Netlify environment

---

## 🚀 Quick Deploy Commands

### Generate JWT Secret
```bash
openssl rand -base64 32
```

### Test Backend Locally
```bash
cd backend
npm install
# Add GROQ_API_KEY to .env
npm start
# Visit http://localhost:5000/health
```

### Test Frontend Locally
```bash
cd frontend
npm install
# Add NEXT_PUBLIC_API_URL=http://localhost:5000 to .env
npm run dev
# Visit http://localhost:3000
```

### After Deployment
```bash
# Test Render backend
curl https://your-render-name.onrender.com/health

# Test Netlify frontend
# Visit https://your-netlify-domain.netlify.app
# Check DevTools console for errors
```

---

## ⚠️ Common Mistakes

❌ **DON'T:**
- Commit `.env` files to git
- Use same JWT secret in production
- Forget `CORS_ORIGIN` when deploying
- Mix `http://` and `https://` in URLs
- Commit Groq API keys to repository
- Miss `NEXT_PUBLIC_` prefix on frontend values

✅ **DO:**
- Generate strong, random JWT secrets
- Use environment-specific configuration
- Test locally before deploying
- Keep API keys in Render/Netlify environment
- Use `wss://` for WebSocket (secure)
- Verify deployment with health checks

---

## 🔗 Environment File Examples

### Use These Templates
- Development: Copy from `.env.example` (if exists)
- Render: See `.env.render.example`
- Netlify: See `.env.netlify.example`

### Files NOT to Commit
```
.env          # Local development (contains secrets)
.env.local    # Local overrides (contains secrets)
.env.*.local  # Environment-specific secrets
```

---

## 📞 Troubleshooting

### "Invalid API Key"
- Check GROQ_API_KEY is set and valid
- Verify in console.groq.com it's active
- Test with: `node backend/test_groq.js`

### "Connection refused to Render"
- Verify Render backend is deployed and running
- Check NEXT_PUBLIC_API_URL matches your Render domain
- Test: `curl https://your-render-domain.onrender.com/health`

### "CORS error in browser console"
- Verify CORS_ORIGIN in Render matches Netlify domain EXACTLY
- Include `https://` protocol
- Don't include trailing slash
- Restart Render after changing CORS_ORIGIN

### "WebSocket connection failed"
- Ensure NEXT_PUBLIC_WS_URL uses `wss://` (not `ws://`)
- Check NEXT_PUBLIC_WS_PATH = `/socket.io`
- Backend must support WebSocket protocol
- Test in DevTools → Network → WS tab

---

*For detailed setup instructions, see:*
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Full deployment walkthrough
- [RENDER_ENV_SETUP.md](./RENDER_ENV_SETUP.md) - Render-specific configuration
- [NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md) - Netlify-specific configuration
