# Ollama Setup Guide for Helix

## Overview
Ollama is a free, open-source tool that runs large language models locally on your machine. This eliminates API costs and dependency issues.

## Installation

### Windows
1. Download: https://ollama.ai/download
2. Run the installer
3. Ollama will start automatically and run on `http://localhost:11434`

### macOS
```bash
brew install ollama
```

### Linux
```bash
curl https://ollama.ai/install.sh | sh
```

## Starting Ollama

### Windows
- Just open the Ollama app (it runs in background)

### macOS/Linux
```bash
ollama serve
```

## Pull a Model

Once Ollama is running, pull a model (do this once):

```bash
# Mistral (recommended - fast, 7B parameters)
ollama pull mistral

# Or try Llama 2 (larger, more powerful)
ollama pull llama2

# Or Neural Chat (optimized for Q&A)
ollama pull neural-chat
```

## Verify Installation

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Should return JSON with available models
```

## Configuration

Your `.env` file already has these defaults:
```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

Change `OLLAMA_MODEL` if you prefer a different model:
- `mistral` - Fast, good quality (RECOMMENDED)
- `llama2` - More powerful but slower
- `neural-chat` - Optimized for questions

## How It Works

1. **Tier 0 (First)**: AI Guardian tries Ollama locally
   - ✅ Instant response (no network latency)
   - ✅ Free (no API costs)
   - ✅ Completely offline
   - ✅ No token issues

2. **Tier 1 (Fallback)**: If Ollama unavailable, uses HuggingFace API
3. **Tier 2-5**: If API fails, uses statistical/pattern analysis

## Performance

| Model | Speed | Quality | Memory | Recommended |
|-------|-------|---------|--------|-------------|
| mistral | Fast | Great | 4GB | ✅ YES |
| llama2 | Medium | Excellent | 8GB | OK |
| neural-chat | Fast | Good | 4GB | OK |

## Troubleshooting

### Ollama not starting?
```bash
# Check if it's running
curl http://localhost:11434/api/tags

# If error, restart:
# Windows: Close app and reopen
# Mac/Linux: Ctrl+C and run "ollama serve" again
```

### Model not found?
```bash
# Pull a model
ollama pull mistral

# List available models
ollama list
```

### Slow responses?
- Switch to `mistral` (faster)
- Ensure you have 4GB+ RAM
- Close other applications

## Testing

Test Ollama integration:
```bash
cd backend
node test_ollama.js
```

Or check system status:
```bash
curl http://localhost:5000/system-status
```

## Production Notes

- Ollama runs locally, so no cloud dependencies
- AI Guardian automatically detects if Ollama is available
- If unavailable, seamlessly falls back to other methods
- Zero configuration needed after initial setup

## Next Steps

1. Download and install Ollama
2. Pull a model: `ollama pull mistral`
3. Verify running: `curl http://localhost:11434/api/tags`
4. Restart backend: It will auto-detect Ollama
5. Test: `node test_ollama.js`

That's it! You now have a free, local AI powerhouse doing threat analysis.
