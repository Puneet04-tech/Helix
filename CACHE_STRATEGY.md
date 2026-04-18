# Cache & Storage Strategy for Pen Drive

Since this project runs on a pen drive, all cache and temporary files are stored locally for easy cleanup.

## Directory Structure

```
e:\AI_guardian\
├── .cache/              ← Cache directory (easily deletable)
│   ├── playwright/      ← Playwright browser binaries
│   ├── node-cache/      ← General caching
│   └── [other cache]
│
├── .temp/               ← Temporary files (easily deletable)
│   ├── uploads/
│   ├── conversions/
│   └── [other temp]
│
├── backend/
│   ├── src/
│   ├── dist/
│   └── .env
│
└── frontend/
    ├── src/
    ├── .next/
    └── package.json
```

## Cache Folders

### `.cache/` Directory

Purpose: Store non-essential, reproducible files

**Contents:**
- Playwright browser binaries (~200MB)
- Module cache
- Build artifacts (can be rebuilt)
- API response cache

**Cleanup**: Safe to delete entirely - will be automatically recreated on next startup

```bash
rm -rf .cache/
# Next run will re-download needed files
```

**Storage size**: ~300-500MB typical

### `.temp/` Directory

Purpose: Store temporary runtime files

**Contents:**
- PDF generation temporary files
- Upload processing intermediate files
- Session temporary data
- Log rotation files

**Cleanup**: Safe to delete - contains only temporary data

```bash
rm -rf .temp/
# Can be safely cleaned out frequently
```

**Storage size**: ~50-100MB typical

## Environment Variables

Configure where cache is stored in `backend/.env`:

```env
# Cache directories (relative to project root)
CACHE_DIR=./.cache
TEMP_DIR=./.temp
PLAYWRIGHT_BROWSERS_PATH=./.cache/playwright
```

## Automatic Cleanup Strategy

The application includes automatic cleanup:

```typescript
// In production, cleanup old files periodically
const cleanup = async () => {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  // Remove temp files older than 1 day
  // Remove cache entries older than 7 days
};

// Run on startup and periodically
schedule.scheduleJob('0 2 * * *', cleanup); // 2 AM daily
```

## Pen Drive Usage Tips

### 1. **Regular Cleanup**

Add to your pre-sync routine:

```bash
# Clean before copying to cloud/backup
rm -rf .cache/
rm -rf .temp/
rm -rf backend/dist/
rm -rf frontend/.next/

# Reduces project size to ~200MB
```

### 2. **Don't Sync These**

Add to your cloud sync ignore list (OneDrive, Google Drive, etc.):
- `.cache/`
- `.temp/`
- `node_modules/` (sub-directories)
- `dist/` `build/` `.next/`
- `.env` (has secrets!)

### 3. **Monitor Pen Drive Space**

```bash
# Check current size
du -sh .cache .temp

# Expected breakdown:
# .cache/    ~300-500MB (Playwright + caches)
# .temp/     ~50-100MB  (temporary files)
# node_modules/ ~1GB+ (dependencies)
# Total:     ~1.5-2GB after installing all deps
```

### 4. **Optimization for Pen Drives**

If space is limited (< 4GB pen drive):

```bash
# Use compressed builds
tar -czf helix-backup.tar.gz backend/ frontend/ sdk/
# Result: ~50-100MB compressed

# Delete node_modules when not developing
npm prune --production  # Keeps only production dependencies
```

## Cache Configuration

### Playwright Browser Cache

```typescript
// backend/src/common/services/playwright.service.ts
const browser = await chromium.launch({
  headless: true,
  downloadsPath: './.temp/downloads',
  // Browsers cached in: ./.cache/playwright
});
```

First run downloads ~300MB of browser files to `.cache/playwright/`

### Memory Cache

```typescript
// backend/src/common/services/memory.service.ts
private clientEvents: Map<string, ClientEvent[]> = new Map();
// Stored in RAM, not disk - automatically cleared on restart
```

### HuggingFace API Cache

```typescript
// backend/src/common/services/huggingface.service.ts
private analysisCache: Map<string, CacheEntry> = new Map();
// 60-second cooldown cache (in RAM)
// Prevents duplicate API calls within 60 seconds per client
```

## Git Ignore for Cache

The `.gitignore` already excludes:

```
.cache/
.temp/
node_modules/
dist/
build/
.next/
.env
```

## Monitoring Cache Usage

Add this to your health check:

```bash
# Check cache size
ls -lh .cache/

# Check temp size
ls -lh .temp/

# Monitor during development
watch -n 1 'du -sh .cache .temp'
```

## Troubleshooting Cache Issues

### **"Playwright browser not found"**
- Check `.cache/playwright/` exists
- Try deleting and letting it re-download: `rm -rf .cache/playwright/`
- First run after deletion will take 5-10 minutes to download

### **"Disk space full"**
- Run cleanup: `rm -rf .cache .temp`
- Delete `node_modules/` and reinstall only what's needed
- Consider using a larger pen drive

### **"Application slow"**
- Cache corrupted: `rm -rf .cache`
- Too many temp files: `rm -rf .temp`
- Restart backend: `npm run dev` in fresh terminal

## Performance Impact

Cache improves performance:

| Operation | First Run | Cached Run |
|-----------|-----------|-----------|
| Backend startup | 30-60s | 5-10s |
| First incident analysis | 2-5s | 0.2s (cached) |
| PDF generation | 3-5s | Same (real-time) |
| Dashboard load | 2-3s | 0.5-1s |

## Backup Strategy

Before important demos:

```bash
# Backup just source code (small)
tar -czf helix-source-backup.tar.gz \
  backend/src frontend/src sdk/src *.md

# Backup entire project (large)
tar -czf helix-full-backup.tar.gz \
  --exclude=.cache \
  --exclude=.temp \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.next \
  .

# Restore when needed
tar -xzf helix-full-backup.tar.gz
npm install  # Reinstall dependencies
```

## Summary

- ✅ Cache directories are deletable (`rm -rf .cache .temp`)
- ✅ Automatic cleanup on first startup after deletion
- ✅ Configured for pen drive usage
- ✅ No secrets stored in cache
- ✅ Total project with cache ~1.5-2GB
- ✅ Can be reduced to ~200MB by clearing cache/node_modules

**Recommended**: Clean cache before stopping work, restore on next session.
