# Render Deployment - Environment Variables

> For backend deployment on **Render.com**

## Production Environment

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/helix-prod?retryWrites=true&w=majority

# JWT & Auth
JWT_SECRET=your_jwt_secret_key_generate_with_openssl_rand_base64_32
JWT_EXPIRATION=24h

# Groq AI
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

# Ollama (Optional - if using local LLM)
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=mistral

# HuggingFace API (Fallback LLM)
HUGGING_FACE_API_TOKEN=hf_your_token_here
HUGGING_FACE_MODEL=mistralai/Mistral-7B-Instruct-v0.1

# Nodemailer (Email notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=noreply@helix-alerts.com

# API Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# CORS
CORS_ORIGIN=https://your-netlify-domain.netlify.app

# Business Logic
INCIDENT_THRESHOLD=3
PATTERN_MATCH_THRESHOLD=0.75
ANOMALY_SENSITIVITY=0.8
```

## Setup Instructions on Render

1. **Create New Web Service**
   - Repository: `https://github.com/your-username/Helix`
   - Branch: `main`
   - Build Command: `npm install`
   - Start Command: `npm run start:prod`
   - Instance Type: Standard (2 CPU, 512MB RAM minimum)

2. **Add Environment Variables**
   - Go to Settings → Environment
   - Add each variable from above
   - Encrypt sensitive values

3. **Database Connection**
   - Ensure MongoDB Atlas IP whitelist includes Render's IPs
   - Set network access to `0.0.0.0/0` (or Render's static IP if available)

4. **Deploy**
   - Manual deploy or connect to GitHub for auto-deploy on push

## Production Deployment Checklist

- [ ] All environment variables set
- [ ] MongoDB connection tested
- [ ] API endpoints responding
- [ ] CORS configured for Netlify domain
- [ ] Email notifications working
- [ ] Error logging configured
- [ ] Groq API key validated
- [ ] Database backups enabled

## Monitoring

Monitor these endpoints on Render:
- Health: `https://your-render-domain.onrender.com/health`
- System Status: `https://your-render-domain.onrender.com/system-status`

---

*Note: Keep sensitive values in Render's secure environment configuration, never commit them to git.*
