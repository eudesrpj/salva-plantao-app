# 🚨 Troubleshooting Guide - Salva Plantão Render Deployment

## ❌ "Status 1" Error

### Symptom
```
npm run start fails with Status 1
Error occurs around line 70 of dist/index.cjs
```

### Root Causes & Solutions

#### 1️⃣ Missing Environment Variables
**Check:**
```bash
# Render Dashboard → Environment → Verify these exist:
- NODE_ENV=production
- DATABASE_URL=postgresql://...
- PORT=10000
```

**Fix:** Add missing variables in Render Dashboard

---

#### 2️⃣ Database Connection Failure
**Symptom:** Starts then crashes trying to query DB

**Check Logs:**
```
[Render Logs] Looking for:
- "Database health check failed"
- "connection refused"
- "ECONNREFUSED"
```

**Verify:**
```bash
# Test database connection locally:
DATABASE_URL="postgresql://..." npm run dev
curl http://localhost:5000/api/health/db
```

**Fix:**
1. Ensure DATABASE_URL includes `?sslmode=require`
2. Check if database is provisioned in Render
3. Verify IP whitelist (Render uses 0.0.0.0)

---

#### 3️⃣ TLS Certificate Rejection
**Error Message:**
```
Error: self-signed certificate in certificate chain
```

**Before (INSECURE):**
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node dist/index.cjs  # ❌ BAD
```

**After (SECURE):**
All handled in `server/db.ts` with proper SSL config

---

## ⚠️ Build Warnings

### "Chunk Exceeds 500kB"
**Status:** ✅ FIXED in new vite.config.ts

**New Build Output:**
```
✓ Client build complete
  └─ images/       (optimized)
  └─ chunks/       (vendor split)
  └─ vendor-ui/    (Radix UI)
  └─ vendor-query/ (@tanstack/react-query)
```

---

## 🔧 Common Fixes

### Fix 1: Clear Build Cache & Rebuild
```bash
rm -rf dist node_modules
npm ci
npm run build
```

### Fix 2: Check Node Version
```bash
node --version  # Must be ≥ 18.0.0
npm --version   # Must be ≥ 8.0.0
```

Render now uses Node 22 LTS (see render.yaml)

### Fix 3: Verify Startup Script
```bash
# Test locally:
npm run build
npm start

# Should output:
# ✓ Server listening on 0.0.0.0:5000
# ✓ Health check endpoint available at /health
```

### Fix 4: Database Health Check
```bash
# After server starts:
curl http://localhost:5000/api/health/db

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-23T...",
  "database": "postgresql"
}
```

---

## 🔍 Debug Mode

### Enable Verbose Logging
Create `.env`:
```env
NODE_ENV=production
DEBUG=*  # Show all debug logs
DATABASE_URL=postgresql://...
```

Then:
```bash
npm run build
npm start
```

---

## 📋 Pre-Deployment Checklist

- [ ] `npm run build` completes without errors
- [ ] `npm start` runs locally without crashing
- [ ] `/health` endpoint responds
- [ ] `/api/health/db` shows "healthy"
- [ ] No `NODE_TLS_REJECT_UNAUTHORIZED` in scripts
- [ ] DATABASE_URL set in Render environment
- [ ] NODE_ENV=production in Render environment
- [ ] Images optimized (< 500KB chunks)

---

## 🆘 Still Failing?

### Check Render Logs
```
Dashboard → Logs
Look for:
✓ "npm ci" completed
✓ "npm run build" completed
✓ "Server listening on 0.0.0.0:PORT"
```

### Common Red Flags
```
❌ "Cannot find module 'xyz'"
   → Missing dependency, run: npm ci

❌ "ECONNREFUSED database"
   → Database not running/accessible
   
❌ "Port already in use"
   → Set PORT env var explicitly

❌ "disk quota exceeded"
   → node_modules too large, optimize deps
```

---

## 📞 Support Resources

- **Render Docs:** https://render.com/docs
- **Node.js Debugging:** https://nodejs.org/en/docs/guides/debugging-getting-started/
- **PostgreSQL SSL:** https://www.postgresql.org/docs/current/libpq-ssl.html

---

**Status:** ✅ Your deployment should be working now with all fixes applied.

If issues persist, check the specific error messages in Render logs against this guide.
