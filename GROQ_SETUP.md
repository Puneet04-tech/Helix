# Groq API Setup Guide for Helix

## ✨ What is Groq?

Groq provides **free, fast LLM API** perfect for incident analysis and anomaly detection.

- **Speed**: Fastest inference on the market
- **Cost**: Free tier with generous rate limits
- **Models**: Mixtral-8x7b, Llama-2, etc.
- **Perfect for**: Event analysis, anomaly scoring

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your API Key

1. Go to: https://console.groq.com/keys
2. Sign up (free - no credit card required)
3. Click **"Create API Key"**
4. Copy the key (looks like: `gsk_xxxxxxxxxxxxx`)

### Step 2: Set Environment Variables

#### Local Development
Create or update `backend/.env`:
```env
GROQ_API_KEY=gsk_your_key_here
```

#### Render Deployment
1. Go to Render Dashboard → Backend Service → Environment
2. Add new environment variable:
   - **Key**: `GROQ_API_KEY`
   - **Value**: `gsk_xxxxxxxxxxxxx`
3. Click **"Apply Changes"**

### Step 3: Test It

Run backend:
```bash
cd backend
npm install  # if needed
npm start
```

Check logs for:
```
✓ Groq API is available
```

---

## 📊 How Groq Integrates with Helix

Groq is the **2nd tier** in the analysis pipeline:

```
Event → Ollama (if running) 
      → Groq API (fast & free) ⭐ NEW
      → HuggingFace API (fallback)
      → Statistical Analysis
      → Behavioral Analysis
      → Pattern Matching
      → Fallback
```

When a suspicious pattern is detected:
1. **Ollama** attempts analysis (if running locally)
2. **Groq API** analyzes instantly (NEW - always available)
3. **HuggingFace API** falls back (if Groq fails)
4. Statistical analysis runs if all fail

---

## 💰 Pricing

- **Free Tier**: 30 requests/minute (plenty for most use cases)
- **Upgraded**: Pay-as-you-go from $0.0001/token
- **No credit card required** for free tier

---

## 🔧 Configuration Options

### Default Model
```env
# Current: Mixtral-8x7b-32768 (free tier approved)
# You can change in backend/src/common/services/groq.service.ts
```

### Request Timeout
```env
# Default: 30 seconds
# Edit in groq.service.ts if needed
```

---

## ✅ Verification

### Check Groq Status
Visit: `http://localhost:5000/api/status` (if you add a status endpoint)

Or check logs after starting. You should see:
```
✓ Groq API is available
Groq is ready (mixtral-8x7b-32768)
```

### Test Analysis
File a complaint from hotel system → Should see analysis in logs:
```
Analyzing with Groq API
Groq analysis: security_threat (0.85)
```

---

## 🆘 Troubleshooting

### "Groq API not available"
**Problem**: API key not set or invalid

**Solution**:
```bash
# Check .env file has correct key
echo $GROQ_API_KEY

# Verify key format: gsk_xxxxxxxxxxxxxxx
# Regenerate at: https://console.groq.com/keys
```

### "Rate limit exceeded"
**Problem**: Over 30 requests/minute on free tier

**Solution**:
- Upgrade tier at https://console.groq.com/billing/overview
- Or reduce event frequency

### "Timeout (30s)"
**Problem**: Groq taking too long

**Solution**:
- Check internet connection
- Switch to HuggingFace by removing GROQ_API_KEY temporarily
- Request size too large? Check logs

---

## 📦 Environment Variables Summary

For **complete Helix deployment**:

```env
# Database
MONGODB_URI=your_mongodb_atlas_uri

# Authentication
JWT_SECRET=your_jwt_secret_key

# LLM Analysis (pick one or more)
GROQ_API_KEY=gsk_your_key_here              # ⭐ Recommended for Render
HUGGINGFACE_API_KEY=hf_your_token_here      # Fallback
OLLAMA_URL=http://localhost:11434           # Local only

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000   # Dev
# For Render: NEXT_PUBLIC_API_URL=https://helix-backend-xxxx.onrender.com

# Optional
LOG_LEVEL=debug
NODE_ENV=production
```

---

## 🎯 Next Steps

1. ✅ Set `GROQ_API_KEY` in `.env`
2. ✅ Restart backend: `npm start`
3. ✅ File a test complaint from hotel system
4. ✅ Check logs for Groq analysis
5. ✅ Deploy to Render with Groq key

---

## 📝 Render Deployment Steps

1. Connect GitHub repo to Render
2. Create backend service (NestJS/Node)
3. Set environment variables:
   ```
   MONGODB_URI = [from MongoDB Atlas]
   JWT_SECRET = [generate random]
   GROQ_API_KEY = gsk_xxxxx
   HUGGINGFACE_API_KEY = hf_xxxxx
   ```
4. Deploy!

---

## 🎉 That's it!

Your Helix backend now uses Groq API for **instant, free LLM analysis**.

Questions? Check `backend/src/common/services/groq.service.ts` or update `.env`
