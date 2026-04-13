# Environment Security Best Practices

## .gitignore Configuration

Ensure your `.gitignore` includes these patterns to prevent accidental commits of secrets:

```gitignore
# Environment variables - CRITICAL: Never commit these!
.env
.env.local
.env.*.local
.env.production.local
.env.development.local

# IDE Settings
.vscode/
.idea/
*.swp
*.swo

# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/
dist/

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.coverage

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Temporary files
tmp/
temp/

# Secrets tools output
git-secrets.json
```

## 📋 Environment File Organization

```
Helix/
├── .env.example              # Public template (safe to commit)
├── .env.render.example       # Render template (safe to commit)
├── .env.netlify.example      # Netlify template (safe to commit)
│
├── .env                       # ⚠️ YOUR LOCAL SECRETS (DON'T COMMIT)
├── .env.local                 # ⚠️ LOCAL OVERRIDES (DON'T COMMIT)
│
├── backend/
│   ├── .env                   # ⚠️ BACKEND SECRETS (DON'T COMMIT)
│   └── .env.example           # Public template
│
└── frontend/
    ├── .env.local             # ⚠️ FRONTEND SECRETS (DON'T COMMIT)
    └── .env.example           # Public template
```

## 🔒 Secret Management

### 1. Local Development Secrets

**File: `backend/.env` (DO NOT COMMIT)**
```env
MONGODB_URI=mongodb://localhost:27017/helix
JWT_SECRET=your-dev-secret-here
GROQ_API_KEY=your-dev-key-here
```

**File: `frontend/.env.local` (DO NOT COMMIT)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 2. Production Secrets (Render Dashboard)

Never put these in `.env` files in production:
- Go to **Site Settings → Environment Variables**
- Use Render's secure secret storage
- Check "Encrypt for secret" if available

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=production-secret
GROQ_API_KEY=prod-groq-key
EMAIL_PASSWORD=email-app-password
```

### 3. Example Templates (SAFE TO COMMIT)

**File: `.env.example`**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/helix

# JWT
JWT_SECRET=generate-with-openssl-rand-base64-32

# Groq
GROQ_API_KEY=your_groq_api_key_here

# Server
NODE_ENV=development
PORT=5000
```

---

## 🛡️ Security Practices

### ✅ DO:
1. **Use `.example` files** for documentation
2. **Store secrets in Render/Netlify dashboards**
3. **Generate strong JWT secrets**: `openssl rand -base64 32`
4. **Use app-specific passwords** for email
5. **Rotate secrets** periodically
6. **Use environment-specific configs**
7. **Enable push protection** on GitHub
8. **Review environment variables** before deploying

### ❌ DON'T:
1. **Commit `.env` files** to version control
2. **Hardcode secrets** in source code
3. **Use weak secrets** like "password123"
4. **Share secrets** via email or Slack
5. **Mix secrets** in public/private code
6. **Forget `NEXT_PUBLIC_` prefix** for client variables
7. **Copy production secrets** into local code
8. **Commit credentials** from any platform

---

## 🔑 Generating Secure Secrets

### JWT Secret (32 bytes)
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Result: Copy to BOTH local .env and Render environment
```

### Database Password
```bash
# Generate random password
openssl rand -hex 16
# Result: 32 character hexadecimal string
```

---

## 🚨 Accidental Secret Commits - Recovery

### If You Commit a Secret:

1. **Invalidate the secret immediately**
   - Rotate API keys on service provider
   - Reset database password
   - Generate new JWT secret

2. **Remove from git history**
   ```bash
   # Option 1: Use git-filter-repo (recommended)
   pip install git-filter-repo
   git filter-repo --path .env --invert-paths
   
   # Option 2: Use BFG Repo-Cleaner
   bfg --delete-files .env
   
   # Option 3: Force push after amending
   git reset HEAD~1
   rm .env
   git add .gitignore
   git commit -m "fix: remove accidental env commit"
   git push --force-with-lease
   ```

3. **Regenerate all secrets**
   - New JWT_SECRET
   - New API keys
   - New database credentials

### GitHub Push Protection

Enable push protection to prevent secret commits:

1. Go to repository → Settings → Security analysis
2. Enable **GitHub secret scanning**
3. Enable **Push protection** for secret scanning

---

## 📝 Pre-Deployment Checklist

Before pushing to GitHub:

```bash
# Check .gitignore is correct
git status

# Verify no .env files are staged
git diff --cached --name-only | grep -i "\.env"

# Check for common secrets (if using git-secrets)
git secrets --scan

# Safe to commit?
git commit -m "your message"
git push origin main
```

---

## 🔍 Verification

### 1. Verify Local .env (DEV)
```bash
# Should show error - file not found
git show HEAD:.env

# Should show only template
git show HEAD:.env.example
```

### 2. Verify Production Setup
- ✅ Render has all required environment variables
- ✅ Netlify has all NEXT_PUBLIC_* variables
- ✅ No `.env` files in Render/Netlify deployment
- ✅ Secrets checked "encrypt" if available

### 3. Test After Deployment
```bash
# Backend health check (no secrets needed)
curl https://your-render-domain.onrender.com/health

# Frontend should load (no secrets in HTML)
curl https://your-netlify-domain.netlify.app
```

---

## 📚 Related Files

- [ENV_VARIABLES_REFERENCE.md](./ENV_VARIABLES_REFERENCE.md) - Quick reference
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Full deployment guide
- [RENDER_ENV_SETUP.md](./RENDER_ENV_SETUP.md) - Render configuration
- [NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md) - Netlify configuration

---

## ⚠️ Critical Reminders

> **NEVER commit:**
> - Your personal API keys
> - Database passwords
> - JWT secrets
> - Email passwords
> - Any file named `.env`

> **ALWAYS use:**
> - `.env.example` as template
> - Platform dashboards for secrets
> - Cryptographically strong random values
> - Different secrets per environment

> **After each deployment:**
> - Verify no secrets in logs
> - Test with `curl` before sharing URLs
> - Check browser DevTools for exposed secrets
> - Monitor for unauthorized access

---

*Last Updated: April 13, 2026*
*Keep secrets secret. Deploy with confidence.*
