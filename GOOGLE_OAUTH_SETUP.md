# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for both local development and production environments.

## Overview

The ILA webapp supports "Sign in with Google" using OAuth 2.0. You'll need to create **two separate OAuth clients** in Google Cloud Console:
1. **Local Development** client (for `http://localhost:5173`)
2. **Production** client (for `https://ila-analytics.rdc.nie.edu.sg`)

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **NEW PROJECT**
3. Name it (e.g., "ILA Webapp")
4. Click **CREATE**

---

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Click **CREATE**
4. Fill in the required fields:
   - **App name**: ILA - Interdisciplinary Learning Analytics
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **SAVE AND CONTINUE**
6. **Scopes**: Click **ADD OR REMOVE SCOPES**, then add:
   - `openid`
   - `email`
   - `profile`
7. Click **UPDATE** → **SAVE AND CONTINUE**
8. **Test users** (optional for development): Add test email addresses
9. Click **SAVE AND CONTINUE** → **BACK TO DASHBOARD**

---

## Step 3: Create OAuth Credentials

### For **Local Development**

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: ILA Webapp (Localhost)
5. **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `http://localhost:3001`
6. **Authorized redirect URIs**:
   - `http://localhost:3001/api/auth/google/callback`
7. Click **CREATE**
8. **Save** the **Client ID** and **Client secret** (you'll need these for `.env.local`)

### For **Production**

1. Repeat the same steps, but create a **new** OAuth client ID
2. **Name**: ILA Webapp (Production)
3. **Authorized JavaScript origins**:
   - `https://ila-analytics.rdc.nie.edu.sg`
4. **Authorized redirect URIs**:
   - `https://ila-analytics.rdc.nie.edu.sg/api/auth/google/callback`
5. Click **CREATE**
6. **Save** the **Client ID** and **Client secret** (you'll need these for production `.env`)

---

## Step 4: Configure Environment Variables

### **Local Development** (`.env.local`)

Add the following to your `.env.local` file in the project root:

```bash
# Google OAuth (Local Development)
GOOGLE_CLIENT_ID=your-localhost-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-localhost-client-secret

# Backend public URL (where Google will redirect after auth)
BACKEND_PUBLIC_URL=http://localhost:3001

# Frontend base URL (where the callback page lives)
FRONTEND_BASE_URL=http://localhost:5173

# CORS origins (include both frontend and backend)
CORS_ORIGIN=http://localhost:5173,http://localhost:3001
```

### **Production** (`.env.production`)

Add the following to your `.env.production` file:

```bash
# Google OAuth (Production)
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret

# Backend public URL (where Google will redirect after auth)
BACKEND_PUBLIC_URL=https://ila-analytics.rdc.nie.edu.sg

# Frontend base URL (where the callback page lives)
FRONTEND_BASE_URL=https://ila-analytics.rdc.nie.edu.sg

# CORS origins
CORS_ORIGIN=https://ila-analytics.rdc.nie.edu.sg
```

---

## Step 5: Update `.env.example`

Add these new variables to `.env.example` for future reference:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
BACKEND_PUBLIC_URL=http://localhost:3001
FRONTEND_BASE_URL=http://localhost:5173
```

---

## How It Works

1. **User clicks "Login with Google"**
   - Frontend redirects to: `GET /api/auth/google?redirect=http://localhost:5173`

2. **Backend starts OAuth flow**
   - Creates a signed state token (containing the frontend origin)
   - Redirects user to Google's OAuth consent page

3. **User authorizes the app**
   - Google redirects back to: `GET /api/auth/google/callback?code=...&state=...`

4. **Backend exchanges code for tokens**
   - Verifies the state token
   - Exchanges Google's authorization code for an access token
   - Fetches user info from Google (`email`, `name`, `picture`)
   - Creates or finds the user in the database
   - Sets `is_active = true` and `email_verified = now()` (skips OTP verification)
   - Stores OAuth account in `oauth_accounts` table
   - Generates app JWT tokens

5. **Backend redirects to frontend**
   - Redirects to: `http://localhost:5173/oauth/callback?token=...&refreshToken=...`

6. **Frontend callback page**
   - Extracts tokens from URL
   - Saves them to localStorage
   - Redirects to home page
   - `AuthContext` picks up the tokens and fetches user profile

---

## Testing

### Local Development

1. Start the backend:
   ```bash
   cd backend
   bun run dev
   ```

2. Start the frontend:
   ```bash
   bun run dev
   ```

3. Navigate to `http://localhost:5173/login`
4. Click **Login with Google**
5. You should be redirected to Google's consent screen
6. After authorizing, you should be redirected back and logged in

### Production

1. Deploy your app with the production environment variables
2. Navigate to `https://ila-analytics.rdc.nie.edu.sg/login`
3. Click **Login with Google**
4. Test the flow end-to-end

---

## Security Notes

- **State parameter**: Prevents CSRF attacks by verifying the redirect came from the same origin
- **HTTPS in production**: Google OAuth requires HTTPS for production redirect URIs
- **Separate clients**: Using separate OAuth clients for dev/prod prevents accidental cross-environment issues
- **Token storage**: JWT tokens are stored in localStorage and automatically refreshed before expiry

---

## Troubleshooting

### "redirect_uri_mismatch" error

- Check that the redirect URI in Google Cloud Console **exactly matches** what the backend is sending
- For localhost: `http://localhost:3001/api/auth/google/callback`
- For production: `https://ila-analytics.rdc.nie.edu.sg/api/auth/google/callback`

### "Invalid state parameter"

- Check that `JWT_SECRET` is set in your environment variables
- State tokens expire after 10 minutes - user might have waited too long on Google's consent screen

### "No email" error

- User's Google account must have an email address
- Ensure you requested the `email` scope in the OAuth consent screen

### Backend can't reach Google

- Check your network/firewall settings
- Verify the backend can make HTTPS requests to `https://accounts.google.com` and `https://www.googleapis.com`

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
