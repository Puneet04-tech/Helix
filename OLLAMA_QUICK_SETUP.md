# Quick Setup: Ollama for Helix

## ⚡ Fastest Setup (2 minutes)

### Step 1: Open This Link in Your Browser
```
https://ollama.ai/download
```

### Step 2: Download for Windows
- Click "Download" button
- Save to your Downloads folder
- Run the installer (OllamaSetup.exe)

### Step 3: Wait for Installation
- Installer will:
  - Download Ollama (~150MB)
  - Install to `C:\Users\{YourUser}\AppData\Local\Ollama`
  - Start automatically
  - Run as background service

### Step 4: Verify Installation
Open PowerShell and run:
```powershell
curl http://localhost:11434/api/tags
```

Should see: `{"models":[]}`

### Step 5: Pull a Model
Open PowerShell and run:
```powershell
ollama pull mistral
```

Wait for download (~4GB, takes 3-5 minutes)

### Step 6: Verify Model
```powershell
curl http://localhost:11434/api/tags
```

Should see: `{"models":[{"name":"mistral:latest",...}]}`

### Step 7: Test Integration
```powershell
cd e:\AI_guardian\backend
node test_ollama.js
```

## ✅ Done!

Your backend will now automatically use Ollama for threat analysis.

---

## Quick Reference

| Action | Command |
|--------|---------|
| Check if running | `curl http://localhost:11434/api/tags` |
| Pull model | `ollama pull mistral` |
| List models | `ollama list` |
| Stop Ollama | Ctrl+C (if running in terminal) |
| Start Ollama | `ollama serve` |
| Test integration | `cd backend && node test_ollama.js` |

---

## Troubleshooting

**Q: Installer won't run?**
A: Try running as Administrator

**Q: Ollama not starting?**
A: Restart computer, Ollama starts automatically

**Q: Model download slow?**
A: Normal - 4GB takes 3-5 minutes, depends on internet

**Q: Connection refused?**
A: Make sure Ollama is running: `ollama serve`

---

## Next: Test with AI Guardian

Once Ollama is running:
```bash
# Test Ollama directly
cd e:\AI_guardian\backend
node test_ollama.js

# Start backend (uses Ollama automatically)
npm run start:dev

# Check system status
curl http://localhost:5000/system-status
```
