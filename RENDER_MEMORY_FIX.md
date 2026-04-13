# Render Deployment - Memory Issue Fix

## ❌ Problem: Heap Limit Exceeded

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Cause**: Render instance doesn't have enough memory for NestJS + dependencies.

---

## ✅ Solution: Upgrade Instance Type

### Option 1: Use Render Dashboard (Easiest)

1. **Go to your service** on render.com
2. **Go to Settings → Instance Type**
3. **Change plan**:
   - ❌ Starter (512MB) - Too small
   - ✅ **Standard (1GB)** - Minimum (recommended)
   - ✅✅ **Standard+ (2GB)** - Better for production

4. **Click "Save and Redeploy"**

### Option 2: Update render.yml

Already fixed! Updated `render.yml`:
```yaml
plan: standard  # Now requires 1GB RAM

envVars:
  - key: NODE_OPTIONS
    value: "--max-old-space-size=1024"  # Optimizes memory usage
```

---

## 🚀 Deployment Steps After Fix

### Step 1: Verify render.yml Changes
File updated with:
- ✅ `plan: standard` (1GB RAM)
- ✅ `NODE_OPTIONS: --max-old-space-size=1024` (optimized heap)
- ✅ `rootDir: .` (correct path)
- ✅ `buildCommand: cd backend && npm install && npm run build`
- ✅ `startCommand: cd backend && npm run start:prod`

### Step 2: Commit and Push

```bash
git add render.yml
git commit -m "fix: update render.yml for memory optimization

- Upgrade to Standard instance (1GB RAM)
- Add NODE_OPTIONS for heap memory optimization
- Fix build and start commands
- Use MongoDB Atlas (not Render hosted)"

git push origin main
```

### Step 3: Render Auto-Deploys

Once pushed, Render will:
1. Detect the updated `render.yml`
2. Redeploy with new settings
3. Use Standard instance (1GB)
4. Optimize memory with NODE_OPTIONS

### Step 4: Verify Deployment

Monitor logs in Render dashboard:
```bash
# Should see:
✓ Build successful
✓ Deploying...
✓ Setting WEB_CONCURRENCY=1
✓ Running 'npm start'
🚀 Helix Backend running on port 3000
```

Check health endpoint:
```bash
curl https://your-render-domain.onrender.com/health
# Should respond: {"status":"ok"}
```

---

## 📋 Memory Settings Reference

### Node.js Heap Size by Instance

| Instance | RAM | NODE_OPTIONS | Suitable For |
|----------|-----|-------------|------------|
| Starter | 512MB | `--max-old-space-size=256` | ❌ Not recommended for NestJS |
| Standard | 1GB | `--max-old-space-size=1024` | ✅ **Recommended** |
| Standard+ | 2GB | `--max-old-space-size=2048` | ✅✅ Production |
| Pro | 4GB+ | `--max-old-space-size=4096` | ✅✅✅ High-load production |

**Current setting** (in updated render.yml):
```yaml
NODE_OPTIONS: "--max-old-space-size=1024"  # For Standard (1GB) instance
```

---

## 🔍 Debugging: Check Instance Logs

### In Render Dashboard:
1. Select your service
2. Go to **Logs**
3. Look for:
   - ✅ `Build successful` - Build phase passed
   - ✅ `No open ports detected` - Normal, port binding is automatic
   - ✅ `helix-backend@1.0.0 start` - Start command executed
   - ✅ `Helix Backend running on port 3000` - Service started

### If Still Failing:
```
Check for:
- Java heap limits (should be gone with NODE_OPTIONS fix)
- Database connection issues (verify MONGODB_URI set)
- Missing environment variables (verify all in dashboard)
- Build errors (check full build log)
```

---

## 💰 Pricing Impact

- **Starter (512MB)**: ~$7/month (too small)
- **Standard (1GB)**: ~$12/month ✅ (recommended)
- **Standard+ (2GB)**: ~$17/month (if needed later)

---

## 🔧 Additional Optimization

If you still hit memory issues on Standard, try:

### 1. Reduce Build Time Dependencies
```bash
# In backend/package.json
npm install --omit=dev  # Skip dev dependencies in production
npm prune --production
```

### 2. Disable Debug Logging
In render.yml:
```yaml
- key: LOG_LEVEL
  value: error  # Changed from info
```

### 3. Enable Node Clustering (for Standard+)
Create `backend/src/cluster.ts`:
```typescript
import cluster from 'cluster';
import os from 'os';

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  bootstrap(); // Your Nest app start
}
```

### 4. Monitor Memory Usage
Render dashboard shows memory usage in real-time. Should be <60% of instance RAM.

---

## ✨ Complete Checklist

- [ ] render.yml updated with `plan: standard`
- [ ] NODE_OPTIONS added for memory optimization
- [ ] rootDir set to `.` (not `backend`)
- [ ] Build command includes `cd backend &&`
- [ ] All environment variables set in Render dashboard
- [ ] MONGODB_URI pointing to MongoDB Atlas
- [ ] Git changes committed and pushed
- [ ] Render auto-deploy triggered
- [ ] Deployment logs show success
- [ ] `/health` endpoint responds

---

## 📞 If Still Issues

1. **Check Render logs** for specific error
2. **Verify environment variables** all set correctly
3. **Test locally**: `cd backend && npm run start:prod`
4. **Check MongoDB connection** string is valid
5. **Contact Render support** if persistent

---

*Updated render.yml configuration deployed. Standard instance (1GB) minimum required.*
