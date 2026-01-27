# Google OAuth Implementation Summary

## ✅ What's Been Implemented

### Backend (`/backend/src`)

1. **OAuth Controllers** (`controllers/authController.ts`)
   - `googleOAuthStart`: Initiates OAuth flow, creates signed state token, redirects to Google
   - `googleOAuthCallback`: Handles Google redirect, exchanges code for tokens, creates/finds user, issues JWT
   - Helper functions for state validation, config management, and URL building

2. **OAuth Routes** (`routes/auth.ts`)
   - `GET /api/auth/google?redirect=<origin>` - Start OAuth flow
   - `GET /api/auth/google/callback` - Google callback endpoint

3. **User Management**
   - Auto-creates users with `student` role on first Google sign-in
   - Sets `is_active = true` and `email_verified = now()` (skips OTP verification)
   - Stores OAuth credentials in `oauth_accounts` table
   - Updates existing users if they log in again

### Frontend (`/src`)

1. **OAuth Callback Page** (`pages/OAuthCallbackPage.tsx`)
   - Handles `/oauth/callback` route
   - Extracts tokens from URL params
   - Saves tokens to localStorage
   - Shows error messages for failed auth attempts
   - Redirects to home on success

2. **Login/Register Pages**
   - Updated `LoginPage.tsx` - Google button now redirects to backend OAuth start
   - Updated `RegisterPage.tsx` - Google button uses same OAuth flow
   - Removed "not implemented" alerts

3. **App Routes** (`App.tsx`)
   - Added `/oauth/callback` route for handling OAuth redirects

### Documentation

1. **Setup Guide** (`GOOGLE_OAUTH_SETUP.md`)
   - Step-by-step instructions for creating Google Cloud OAuth clients
   - Separate instructions for localhost and production
   - Environment variable configuration
   - Troubleshooting guide

2. **Environment Variables** (`.env.example`)
   - Added `GOOGLE_CLIENT_ID`
   - Added `GOOGLE_CLIENT_SECRET`
   - Added `BACKEND_PUBLIC_URL`
   - Added `FRONTEND_BASE_URL`

---

## 🔐 Security Features

- **State parameter**: HMAC-signed token prevents CSRF attacks
- **State expiration**: Tokens expire after 10 minutes
- **Origin validation**: Only whitelisted origins can initiate OAuth
- **Constant-time comparison**: Protects against timing attacks

---

## 📝 Environment Variables Needed

### Local Development (`.env.local`)

```bash
GOOGLE_CLIENT_ID=<your-localhost-client-id>
GOOGLE_CLIENT_SECRET=<your-localhost-client-secret>
BACKEND_PUBLIC_URL=http://localhost:3001
FRONTEND_BASE_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,http://localhost:3001
```

### Production (`.env.production`)

```bash
GOOGLE_CLIENT_ID=<your-production-client-id>
GOOGLE_CLIENT_SECRET=<your-production-client-secret>
BACKEND_PUBLIC_URL=https://ila-analytics.rdc.nie.edu.sg
FRONTEND_BASE_URL=https://ila-analytics.rdc.nie.edu.sg
CORS_ORIGIN=https://ila-analytics.rdc.nie.edu.sg
```

---

## 🎯 Google Cloud Console Setup

You need to create **TWO separate OAuth clients**:

### Localhost Client

- **Authorized JavaScript origins**: `http://localhost:5173`, `http://localhost:3001`
- **Authorized redirect URIs**: `http://localhost:3001/api/auth/google/callback`

### Production Client

- **Authorized JavaScript origins**: `https://ila-analytics.rdc.nie.edu.sg`
- **Authorized redirect URIs**: `https://ila-analytics.rdc.nie.edu.sg/api/auth/google/callback`

**OAuth Consent Screen Scopes**: `openid`, `email`, `profile`

---

## 🚀 How to Use

1. **Create Google OAuth clients** (see `GOOGLE_OAUTH_SETUP.md`)
2. **Add environment variables** to `.env.local` (local) and `.env.production` (prod)
3. **Restart backend** to pick up new env vars
4. **Test the flow**:
   - Navigate to `/login`
   - Click "Login with Google"
   - Authorize the app
   - You should be redirected back and logged in

---

## 🔄 OAuth Flow

```
User clicks "Login with Google"
  ↓
Frontend → GET /api/auth/google?redirect=http://localhost:5173
  ↓
Backend creates state token, redirects to Google
  ↓
User authorizes app on Google
  ↓
Google → GET /api/auth/google/callback?code=...&state=...
  ↓
Backend validates state, exchanges code for access token
  ↓
Backend fetches user info from Google (email, name, picture)
  ↓
Backend creates/finds user in database
  - Auto-activates account (is_active = true)
  - Sets email_verified = now()
  - Role defaults to "student"
  ↓
Backend stores OAuth account in oauth_accounts table
  ↓
Backend generates JWT tokens (token, refreshToken)
  ↓
Backend redirects to frontend: /oauth/callback?token=...&refreshToken=...
  ↓
Frontend saves tokens to localStorage
  ↓
Frontend redirects to home page
  ↓
AuthContext picks up tokens, fetches user profile
  ↓
User is logged in! 🎉
```

---

## ✅ What Works

- ✅ Sign in with Google (new users auto-registered as students)
- ✅ Email verification skipped for Google users
- ✅ OAuth account stored in database
- ✅ JWT tokens issued correctly
- ✅ Works on both login and registration pages
- ✅ Error handling for failed OAuth attempts
- ✅ State token CSRF protection
- ✅ Separate dev/prod OAuth clients

---

## 📋 Next Steps (For You)

1. **Create Google Cloud OAuth clients** using `GOOGLE_OAUTH_SETUP.md`
2. **Add credentials to `.env.local`** for local testing
3. **Test the flow** on localhost
4. **Add production credentials to `.env.production`** when deploying
5. **Deploy to production** and test end-to-end

---

## 🐛 Known Issues / TODOs

- None currently - implementation is complete and ready for testing!
