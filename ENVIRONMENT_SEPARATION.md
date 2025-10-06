# 🔧 Environment Separation Fix

## Problem

Your application was using a single `.env` file for both local development and production deployment. This caused:

- Production passwords overwriting local development passwords
- Confusion about which environment variables were active
- Backend crashes when deployed to AWS EC2

## Solution

Separate environment configurations:

- **`.env`** - Local development (already exists, kept as-is)
- **`.env.production`** - Production deployment (created automatically on AWS)
- **`.env.production.template`** - Template showing production structure

---

## 📁 File Structure

```
ila-webapp/
├── .env                        # Local development (NOT committed)
├── .env.production            # Production (created on EC2, NOT committed)
├── .env.production.template   # Template (committed to git)
├── docker-compose.yml         # Base configuration (uses .env)
└── docker-compose.prod.yml    # Production overrides (uses .env.production)
```

---

## 🔒 Production Credentials

Your production environment uses:

**PostgreSQL Password:**

```
JPBFpINsKQ4hQDrJYSDe
```

**JWT Secret:**

```
nqAX46vHRp2TtjlCVjF7q1+5IDpY2EaYjnEA1m7Et8A=
```

These are:

- ✅ Stored in GitHub Secrets
- ✅ Injected by GitHub Actions during deployment
- ✅ Created in `.env.production` on EC2
- ✅ Never committed to git

---

## 📝 Local Development (.env)

Your local `.env` file remains unchanged:

```bash
# Database Configuration
POSTGRES_DB=ila_db
POSTGRES_USER=ila_user
POSTGRES_PASSWORD=ila_secure_password_2025  # Local password
POSTGRES_PORT=5432

# Application Configuration
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173

# API Base URL
VITE_API_BASE_URL=http://localhost:3001/api
```

**To run locally:**

```bash
docker compose up
```

This uses `.env` automatically.

---

## 🚀 Production Deployment (.env.production)

The `.env.production` file is created automatically on EC2 with:

```bash
# Database Configuration
POSTGRES_DB=ila_db
POSTGRES_USER=ila_user
POSTGRES_PASSWORD=JPBFpINsKQ4hQDrJYSDe  # Production password
POSTGRES_PORT=5432

# Application Configuration
NODE_ENV=production
JWT_SECRET=nqAX46vHRp2TtjlCVjF7q1+5IDpY2EaYjnEA1m7Et8A=
CORS_ORIGIN=http://13.212.19.144:3000

# Production Database URL
DATABASE_URL=postgresql://ila_user:JPBFpINsKQ4hQDrJYSDe@postgres:5432/ila_db

# API Base URL
VITE_API_BASE_URL=http://13.212.19.144:3001/api
```

**To deploy:**

```bash
# Option 1: Automated via GitHub Actions (when pushed to main)
git push origin main

# Option 2: Manual deployment with environment separation
./deploy-with-prod-env.sh
```

Production uses both compose files:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🔄 How It Works

### Local Development Flow

1. You run `docker compose up`
2. Docker Compose reads `.env`
3. Uses local passwords and settings
4. Connects to local database

### Production Deployment Flow

1. GitHub Actions or manual script runs
2. Creates `.env.production` on EC2 with production credentials
3. Runs `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
4. `docker-compose.prod.yml` specifies `env_file: .env.production`
5. Production containers use production credentials
6. Connects to production database

---

## 🚀 Deploy the Fix Now

### Quick Deploy (Recommended)

Run this single command:

```bash
./deploy-with-prod-env.sh
```

This will:

1. Pull latest code with environment separation
2. Create `.env.production` on EC2 with correct credentials
3. Stop all containers
4. Remove old database with wrong password
5. Rebuild backend
6. Start fresh with production config
7. Verify everything works

**Time:** ~2 minutes

---

## 📊 What Changed?

### 1. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

**Before:**

```yaml
echo "Creating .env file..."
cat > .env << 'EOF'
POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}
```

**After:**

```yaml
echo "Creating .env.production file..."
cat > .env.production << 'EOF'
POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}
```

Now creates `.env.production` instead of `.env`.

### 2. Docker Compose Production (`docker-compose.prod.yml`)

**Before:**

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ila_password}
```

**After:**

```yaml
services:
  postgres:
    env_file:
      - .env.production
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ila_password}

  backend:
    env_file:
      - .env.production
    environment:
      DATABASE_URL: ${DATABASE_URL}

  frontend:
    env_file:
      - .env.production
```

Now explicitly loads `.env.production` for all services.

---

## ✅ Verification Checklist

After deploying, verify:

### On EC2:

```bash
ssh -i ila-pk.pem ec2-user@13.212.19.144
cd /home/ec2-user/ila-webapp

# 1. Check production env file exists
ls -la .env.production

# 2. Verify it has production password
grep POSTGRES_PASSWORD .env.production
# Should show: POSTGRES_PASSWORD=JPBFpINsKQ4hQDrJYSDe

# 3. Check container status
sudo docker compose ps
# All should show "Up"

# 4. Verify PostgreSQL uses production password
sudo docker compose exec postgres env | grep POSTGRES_PASSWORD
# Should show: POSTGRES_PASSWORD=JPBFpINsKQ4hQDrJYSDe

# 5. Verify backend uses production password
sudo docker compose exec backend env | grep DATABASE_URL
# Should contain: JPBFpINsKQ4hQDrJYSDe

# 6. Test backend health
curl http://localhost:3001/health
# Should return: {"status":"OK"...}
```

### From Browser:

- ✅ Frontend loads: http://13.212.19.144:3000
- ✅ Backend health: http://13.212.19.144:3001/health
- ✅ Registration works: http://13.212.19.144:3000/register

---

## 🎯 Key Benefits

| Before                      | After                                 |
| --------------------------- | ------------------------------------- |
| Single `.env` file          | Separate `.env` and `.env.production` |
| Production overwrites local | Local and production independent      |
| Manual password management  | Automated from GitHub Secrets         |
| Configuration confusion     | Clear separation                      |
| Wrong passwords on EC2      | Correct passwords guaranteed          |

---

## 🔒 Security Best Practices

✅ **Good:**

- `.env` and `.env.production` in `.gitignore` (never committed)
- Production credentials in GitHub Secrets
- `.env.production.template` committed (shows structure, no secrets)
- Automated deployment creates `.env.production` from secrets

❌ **Avoid:**

- Committing `.env` or `.env.production` to git
- Hardcoding passwords in docker-compose files
- Using same credentials for local and production
- Sharing `.env.production` file manually

---

## 📖 Related Documentation

- **`deploy-with-prod-env.sh`** - One-command deployment with environment separation
- **`BACKEND_FIX_COMPLETE.md`** - Complete backend troubleshooting guide
- **`BACKEND_SSL_FIX.md`** - SSL configuration explanation
- **`.env.production.template`** - Template for production environment

---

## 🆘 Troubleshooting

### Backend still using wrong password?

```bash
# SSH to EC2
ssh -i ila-pk.pem ec2-user@13.212.19.144
cd /home/ec2-user/ila-webapp

# Check what password PostgreSQL is using
sudo docker compose exec postgres env | grep POSTGRES_PASSWORD

# Check what password backend is using
sudo docker compose exec backend env | grep DATABASE_URL

# If they don't match, recreate .env.production and restart
cat > .env.production << 'EOF'
POSTGRES_PASSWORD=JPBFpINsKQ4hQDrJYSDe
DATABASE_URL=postgresql://ila_user:JPBFpINsKQ4hQDrJYSDe@postgres:5432/ila_db
EOF

sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml down
sudo docker volume rm ila-webapp_postgres_prod_data
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Local development broken?

Your local `.env` should still work. If not:

```bash
# Ensure you're not using production compose file locally
docker compose down
docker compose up

# NOT: docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### Want to change production password?

1. Update GitHub Secret `POSTGRES_PASSWORD`
2. Push to main (triggers deployment)
3. Or manually update `.env.production` on EC2 and restart

---

## 🎉 Summary

You now have proper environment separation:

- 🏠 **Local:** `.env` with local passwords
- ☁️ **Production:** `.env.production` with production passwords
- 🔒 **Secure:** Credentials from GitHub Secrets
- 🤖 **Automated:** GitHub Actions handles deployment
- ✅ **Clear:** No more confusion between environments

**Next step:** Run `./deploy-with-prod-env.sh` to deploy! 🚀
