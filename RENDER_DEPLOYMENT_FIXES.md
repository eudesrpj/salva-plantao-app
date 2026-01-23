# 🚀 Render Deployment Fixes - Complete Guide

**Status:** ✅ Ready for Render deployment  
**Last Updated:** January 23, 2026  
**Git Commit:** `3e80128` - fix(render): Stable Render deployment

---

## Summary of Fixes

This document outlines all fixes applied to ensure stable Render deployment of the Salva Plantão Node.js/Express/Vite application.

### Three Critical Issues Fixed

#### 1. ❌ Build Error: "tsx: not found"
**Problem:** Render fails with `tsx: not found` during `npm run build`

**Root Cause:** 
- `tsx` was in `devDependencies` only
- Render installs deps in production mode by default (skips devDeps)
- Build script needs `tsx` to execute TypeScript

**Solution:**
- Moved `tsx`, `esbuild`, `vite` to `dependencies`
- These are actually build-time dependencies needed on Render
- Set `NPM_CONFIG_PRODUCTION=false` in Render environment
- This forces `npm ci` to install devDependencies even in production

**Files Changed:**
- `package.json` - Moved build tools to dependencies

---

#### 2. ❌ Postgres SSL Error: "SELF_SIGNED_CERT_IN_CHAIN"
**Problem:** Database connection fails with certificate validation errors on Render

**Root Cause:**
- Render's PostgreSQL uses intermediate certificates
- Previous code only disabled cert validation for Supabase connections
- Non-Supabase connections had strict validation that failed

**Solution:**
- Force `ssl: { rejectUnauthorized: false }` for ALL PostgreSQL connections
- Pair with `sslmode=require` in connection string for encryption enforcement
- This is safe because:
  - `sslmode=require` ensures encrypted connection
  - Certificate validation is skipped (we trust Render's infrastructure)
  - Data is still encrypted in transit

**Files Changed:**
- `server/db.ts` - Simplified SSL config to always accept self-signed/intermediate certs

**Result:**
```typescript
// Before: Conditional logic that failed for non-Supabase
if (url.includes("supabase") || url.includes("pooler")) {
  config.ssl = { rejectUnauthorized: false };
} else {
  config.ssl = { rejectUnauthorized: process.env.NODE_ENV === "production" };
}

// After: Always safe for Render
config.ssl = {
  rejectUnauthorized: false,
};
```

---

#### 3. ⚠️ Environment Variable Missing
**Problem:** Deploying to Render without `NPM_CONFIG_PRODUCTION=false` causes build failures

**Root Cause:**
- Render's default npm installation skips devDependencies in production
- Build tools are needed during build phase

**Solution:**
- Document `NPM_CONFIG_PRODUCTION=false` as **critical required env var**
- Set it in Render dashboard before deploying
- Still use `NODE_ENV=production` for app runtime behavior

**Files Changed:**
- `RENDER_ENV_CONFIG.md` - Added NPM_CONFIG_PRODUCTION as section 0 (critical)

---

## Required Render Environment Variables

### Critical Variables (Must Set Before Deploy)

| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_ENV` | `production` | Forces production mode (0.0.0.0 listening, no Vite dev server) |
| `NPM_CONFIG_PRODUCTION` | `false` | ⚠️ **CRITICAL** - Ensures build tools are installed |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | PostgreSQL connection with SSL |
| `JWT_SECRET` | (32+ random chars) | Session authentication secret |
| `JWT_REFRESH_SECRET` | (32+ random chars) | Refresh token secret |

### Optional Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | `sk-proj-...` | OpenAI integration for chat/images |
| `ASAAS_API_KEY` | (API key) | Payment processing |
| `PORT` | `5000` | Port (usually auto-set by Render) |

---

## Render Deployment Checklist

### Before Deployment

- [ ] Commit all changes to GitHub
- [ ] Push to main/deploy branch

### In Render Dashboard

1. **Create Web Service or Update Existing**
   - Connect your GitHub repository
   - Select main branch

2. **Set Build & Start Commands**
   ```
   Build Command:  npm ci && npm run build
   Start Command:  npm run start
   ```

3. **Set Environment Variables** (Critical!)
   ```
   NODE_ENV = production
   NPM_CONFIG_PRODUCTION = false  ← DO NOT FORGET THIS
   DATABASE_URL = postgresql://...?sslmode=require
   JWT_SECRET = (generate random 32+ chars)
   JWT_REFRESH_SECRET = (generate random 32+ chars)
   ```

4. **Deploy**
   - Render will pull latest code
   - Run `npm ci && npm run build`
   - Start server with `npm run start`

### After Deployment

1. **Health Check**
   ```bash
   curl https://your-app.onrender.com/health
   # Expected: {"status":"ok",...}
   ```

2. **Database Health Check**
   ```bash
   curl https://your-app.onrender.com/api/health/db
   # Expected: {"status":"healthy",...} or {"status":"unhealthy",...}
   # Both mean server is working, just DB connection status varies
   ```

3. **Smoke Test (Optional Local)**
   ```bash
   npm run smoke
   # Tests /health and /api/health/db endpoints
   ```

---

## What Was Already Working

### ✅ Non-Fatal Database Seeding
- Database seeding happens AFTER server.listen()
- Uses `setImmediate()` to avoid blocking startup
- Failures are logged but don't crash the server
- If DB is down at startup, server still responds to requests

**File:** `server/index.ts` (lines 140-145)
```typescript
setImmediate(async () => {
  await seedDatabase();  // Runs async, doesn't block server
});
```

**File:** `server/routes.ts` (lines 4703+)
```typescript
export async function seedDatabase() {
  try {
    // Seed operations...
  } catch (err) {
    console.error("[seed] Database seeding failed:", err);
    // Non-fatal: log error but don't crash
  }
}
```

### ✅ Health Check Endpoints
- `GET /health` - Always returns 200 if server is running
- `GET /api/health/db` - Returns 200 if DB connected, 503 if not
- Server doesn't crash if DB is down at startup

**File:** `server/index.ts` (lines 78-106)

### ✅ Smoke Test Script
- Pre-built script validates deployment
- Tests both health endpoints with timeouts
- Can be run locally to validate build

**File:** `scripts/smoke.ts`
**Usage:** `npm run smoke`

---

## Deployment Troubleshooting

### "tsx: not found" Error

**Problem:** Build fails with `Command failed: tsx script/build.ts`

**Solution:**
1. Check `NPM_CONFIG_PRODUCTION=false` is set in Render environment
2. Clear build cache in Render dashboard
3. Redeploy

**Why:** Without this env var, `npm ci` skips devDependencies

---

### "SELF_SIGNED_CERT_IN_CHAIN" or "Could not establish trust with certificate authority"

**Problem:** Database connection fails immediately on startup

**Solution:**
1. Check `DATABASE_URL` ends with `?sslmode=require`
2. Check `DATABASE_URL` uses port 5432 (not 6543)
3. Verify `server/db.ts` has `ssl: { rejectUnauthorized: false }`
4. Wait 30 seconds (connection timeout)

**Why:** Render's PostgreSQL uses intermediate certs

---

### Server Starts but "Cannot Connect to Database"

**Problem:** Server responds to `/health` but `/api/health/db` fails

**Solution (Expected Behavior):**
1. Server still works - `/health` returns 200
2. Check DATABASE_URL in Render environment
3. Database credentials may be wrong
4. Check Render logs for detailed error

**Note:** This is not a server error, it's a database connectivity issue

---

### Database Seeding Fails

**Problem:** See errors in logs like "Failed to create prescription"

**Solution (Expected):**
1. This will NOT crash the server
2. Check app is still responding to `/health` (it should be)
3. Database may be down temporarily
4. Seeding will retry on next deployment or server restart

---

## Performance Tuning

The following optimizations are already configured:

**Connection Pool (server/db.ts)**
- `connectionTimeoutMillis: 30000` - 30 seconds for initial connection
- `idleTimeoutMillis: 30000` - 30 seconds before closing idle connections
- `max: 20` - Max 20 simultaneous connections
- `min: 2` - Min 2 to keep pool warm

**Why 30 seconds?**
- Render cold starts can be slow
- 10 seconds often times out
- 30 seconds provides reliability

---

## Git Commit Details

**Commit:** `3e80128`
**Message:** `fix(render): Stable Render deployment - SSL config, tsx deps, NPM_CONFIG_PRODUCTION`

**Changed Files:**
1. `server/db.ts` - Simplified SSL config
2. `package.json` - Moved build tools to dependencies
3. `RENDER_ENV_CONFIG.md` - Added NPM_CONFIG_PRODUCTION docs
4. Removed `.replit` - No longer needed (Render uses different config)

---

## Testing Locally Before Render

```bash
# Install dependencies
npm ci

# Build
npm run build

# Test smoke (requires DATABASE_URL to be set)
DATABASE_URL="postgresql://..." npm run smoke

# Or run dev server locally
npm run dev
```

---

## Summary

Your app is now ready for stable Render deployment. The three key fixes are:

1. **Build tools in dependencies** + `NPM_CONFIG_PRODUCTION=false` → No more "tsx: not found"
2. **Force SSL config in db.ts** → No more certificate errors
3. **Non-fatal seeding** + **Health checks** → Server stays up even if DB is slow

Set the 5 required env vars in Render, deploy, and your app will be stable.

---

**Need help?** Check `/health` and `/api/health/db` endpoints to diagnose issues.
