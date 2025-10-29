# CORS Configuration Guide

## Overview

This document explains the CORS (Cross-Origin Resource Sharing) configuration for the ILA webapp and how to avoid common CORS issues during development and deployment.

## The Problem

CORS errors occur when:
1. The frontend and backend run on different ports/domains
2. The backend doesn't allow requests from the frontend's origin
3. Environment variables are misconfigured between dev and production

## Current Configuration

### Development Setup

**Frontend (Vite)**
- Runs on: `http://localhost:5173` (default Vite port)
- Alternative: `http://localhost:5174` (if 5173 is occupied)
- API calls to: `http://localhost:3001/api`

**Backend (Express)**
- Runs on: `http://localhost:3001`
- Accepts CORS from: Multiple origins including localhost:5173 and localhost:3000

### Production Setup (Docker)

**Frontend (Nginx)**
- Runs on: `http://localhost:3000` (or your domain)
- API proxied through: `/api/*` → `http://backend:3001/*`

**Backend (Express)**
- Runs on: Internal port 3001 (not exposed)
- Accepts CORS from: Origins specified in `CORS_ORIGIN` environment variable

## Configuration Files

### 1. Backend Environment (`.env`)

```bash
# Support multiple origins separated by comma
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Or for production with custom domain:
CORS_ORIGIN=https://yourdomain.com,http://localhost:5173
```

### 2. Frontend Environment (`.env`)

```bash
# Point to backend API
VITE_API_BASE_URL=http://localhost:3001/api

# For production with nginx proxy:
# VITE_API_BASE_URL=/api
```

### 3. Backend CORS Logic (`backend/src/server.ts`)

The backend supports:
- **Multiple origins**: Comma-separated in `CORS_ORIGIN` env variable
- **Development mode**: Automatically allows all `localhost:*` origins
- **No-origin requests**: Allows requests from mobile apps, Postman, curl
- **Credentials**: Supports cookies and authorization headers

## How to Fix CORS Issues

### Issue 1: "No 'Access-Control-Allow-Origin' header"

**Cause**: Backend CORS doesn't allow frontend's origin

**Fix**:
1. Check frontend URL in browser (e.g., `http://localhost:5173`)
2. Update backend `.env`:
   ```bash
   CORS_ORIGIN=http://localhost:5173,http://localhost:3000
   ```
3. Restart backend: `cd backend && pnpm dev`

### Issue 2: CORS works locally but fails in Docker

**Cause**: Docker frontend runs on different port than development

**Fix**:
1. Update `docker-compose.yml` environment:
   ```yaml
   CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:3000,http://localhost:5173}
   ```
2. Rebuild containers: `docker compose up -d --build`

### Issue 3: CORS fails after changing ports

**Cause**: Vite sometimes uses alternative ports (5174, 5175)

**Fix**: Development mode automatically allows all localhost origins, just restart backend

### Issue 4: Production deployment CORS errors

**Cause**: Production domain not in allowed origins

**Fix**:
1. Set production environment variable:
   ```bash
   CORS_ORIGIN=https://yourdomain.com
   ```
2. For nginx proxy setup, you might not need CORS at all since requests come from same origin

## Best Practices

### For Development

1. **Always use `.env` file**: Don't hardcode URLs in code
2. **Check Vite port**: Run `pnpm dev` and note the port in terminal
3. **Restart backend**: After changing CORS settings
4. **Multiple developers**: Use comma-separated origins to support different setups

### For Production

1. **Use nginx proxy**: Eliminates CORS issues by serving frontend and API from same origin
2. **Set specific domains**: Don't use wildcards in production
3. **HTTPS only**: Always use HTTPS for production domains
4. **Environment variables**: Use different `.env` files for different environments

### For Docker

1. **Environment variables**: Use `docker-compose.yml` to override defaults
2. **Network isolation**: Use docker networks instead of exposing ports when possible
3. **Health checks**: Wait for services to be ready before allowing traffic

## Testing CORS

### 1. Check browser console
```javascript
// Should show no CORS errors
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(console.log)
```

### 2. Check backend logs
Look for:
```
🔒 CORS allowed origins: [ 'http://localhost:5173', 'http://localhost:3000' ]
```

### 3. Test with curl
```bash
# Should return data without CORS errors
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     http://localhost:3001/api/auth/login -v
```

## Environment-Specific Setup

### Local Development
```bash
# backend/.env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# .env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Docker Development
```bash
# .env (root)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
VITE_API_BASE_URL=http://localhost:3001/api
```

### Production (with nginx proxy)
```bash
# backend/.env
CORS_ORIGIN=https://yourdomain.com

# .env
VITE_API_BASE_URL=/api  # Use nginx proxy
```

### Production (separate domains)
```bash
# backend/.env
CORS_ORIGIN=https://frontend.yourdomain.com

# .env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Troubleshooting Checklist

- [ ] Backend is running and responding to `/health` endpoint
- [ ] Frontend URL matches one of the allowed CORS origins
- [ ] Backend `.env` has correct `CORS_ORIGIN` value
- [ ] Backend has been restarted after changing `.env`
- [ ] Browser console shows the actual origin being used
- [ ] Network tab shows OPTIONS preflight request succeeding
- [ ] No firewall/proxy blocking CORS headers

## Quick Fix Commands

```bash
# Check what port Vite is using
pnpm dev  # Look for "Local: http://localhost:XXXX"

# Update backend CORS and restart
cd backend
echo "CORS_ORIGIN=http://localhost:5173,http://localhost:3000" >> .env
pnpm dev

# For Docker
docker compose down
docker compose up -d --build

# Test backend CORS
curl http://localhost:3001/health
```

## Additional Resources

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)
- [Vite Server Options](https://vitejs.dev/config/server-options.html)
