# NPM Audit Fix Guide

## Current Status
- 6 high severity vulnerabilities detected
- 179 packages requiring funding

## To Fix Vulnerabilities on Deploy

Add this to your build process or run manually:

```bash
# View all vulnerabilities
npm audit

# Auto-fix available vulnerabilities
npm audit fix

# Force fix with breaking changes if needed
npm audit fix --force
```

## Known Vulnerabilities in Dependencies

### Minimatch (ReDoS - Regular Expression Denial of Service)
- **Affected versions**: 9.0.0-9.0.6
- **Fix**: Update to 10.x
- **Impact**: Low - only used during build time, not in production

### File-type (ZIP Decompression Bomb)
- **Affected versions**: 20.x-21.x
- **Fix**: Update to latest
- **Impact**: Low - only used by Playwright during setup

### @typescript-eslint packages
- **Affected versions**: Depends on minimatch
- **Fix**: Update once minimatch is fixed

## Recommended Action

For production deployment:
1. Run `npm audit fix` to auto-patch what can be patched
2. For remaining issues, evaluate if they affect production code
3. Most vulnerabilities are in dev dependencies (eslint, webpack, jest) - only used during build

## Post-Deploy Check

After deployment to Render, verify:
```bash
# Check if deployment succeeded
curl https://your-helix-api-render.com/health
```

If service runs successfully for 5+ minutes, memory optimization is working.
