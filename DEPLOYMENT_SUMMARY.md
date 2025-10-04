# Deployment Setup Summary

## ✅ What Was Created

### GitHub Actions CI/CD
- **`.github/workflows/deploy.yml`** - Automated deployment pipeline
- Triggers on push to `main` branch
- Can be manually triggered from GitHub UI
- Handles: SSH connection, code pull, Docker build, container restart

### Deployment Scripts
- **`deploy-docker.sh`** - Automated Docker deployment script (executable)
- Replaces the old PM2-based scripts
- Installs Docker, builds images, starts containers

### Documentation
- **`GITHUB_ACTIONS_SETUP.md`** - Complete CI/CD setup guide
  - How to configure GitHub Secrets
  - Troubleshooting
  - Security best practices
  - Advanced features (notifications, rollback, staging)

- **`DOCKER_DEPLOYMENT.md`** - Comprehensive Docker deployment reference
  - All deployment methods
  - Container management
  - Database backup/restore
  - Production enhancements
  - Troubleshooting guide

- **`DEPLOYMENT_QUICKSTART.md`** - Quick reference card
  - One-page overview of all deployment methods
  - Common commands
  - Access URLs

### Configuration
- **`ecosystem.config.js`** - PM2 config (kept for reference but not used with Docker)
- Your existing Docker files work perfectly:
  - `docker-compose.yml` - Development/base configuration
  - `docker-compose.prod.yml` - Production overrides
  - `Dockerfile` - Frontend build
  - `backend/Dockerfile` - Backend build

---

## 🎯 Recommended Deployment Method

### For Production: GitHub Actions (CI/CD)

**Why?**
- ✅ Fully automated - deploy by pushing to main
- ✅ Consistent deployments
- ✅ Audit trail (who deployed what, when)
- ✅ Easy rollback capability
- ✅ No manual SSH needed
- ✅ Integrates with your existing Docker setup

**Setup Steps:**

1. **Add GitHub Secrets** (one-time setup)
   
   Go to: https://github.com/ntu-dsair/ila-webapp/settings/secrets/actions
   
   Add:
   ```
   EC2_SSH_KEY = (contents of ila-pk.pem)
   POSTGRES_PASSWORD = (strong password)
   JWT_SECRET = (run: openssl rand -base64 32)
   ```

2. **Ensure EC2 is ready**
   ```bash
   # Run once to prepare EC2
   ./deploy-docker.sh
   ```

3. **Deploy automatically**
   ```bash
   git add .
   git commit -m "Enable GitHub Actions deployment"
   git push origin main
   ```
   
   Watch deployment: https://github.com/ntu-dsair/ila-webapp/actions

---

## 📊 Deployment Architecture (Docker-based)

```
Developer Push to GitHub
         │
         ▼
   GitHub Actions
    (CI/CD Runner)
         │
         ├─ SSH to EC2
         ├─ Pull latest code
         ├─ Build Docker images
         ├─ Start containers
         └─ Verify deployment
         │
         ▼
   AWS EC2 Instance
┌─────────────────────────┐
│  Docker Network         │
│  ┌─────────────────┐   │
│  │ Frontend (3000) │   │
│  │   Nginx + Vite  │   │
│  └────────┬────────┘   │
│           │             │
│  ┌────────▼────────┐   │
│  │ Backend (3001)  │   │
│  │    Node.js      │   │
│  └────────┬────────┘   │
│           │             │
│  ┌────────▼────────┐   │
│  │ PostgreSQL      │   │
│  │    (5432)       │   │
│  └─────────────────┘   │
└─────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Option 1: Use GitHub Actions (Recommended)

```bash
# 1. Add secrets to GitHub (see GITHUB_ACTIONS_SETUP.md)

# 2. Push to main
git push origin main

# 3. Watch deployment
# Go to: https://github.com/ntu-dsair/ila-webapp/actions
```

### Option 2: Use Deployment Script

```bash
# From your local machine
./deploy-docker.sh
```

### Option 3: Manual Deployment

```bash
# SSH to EC2
ssh -i ila-pk.pem ec2-user@13.212.19.144

# Deploy
cd ~/ila-webapp
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 🔐 Important: GitHub Secrets Setup

Before using GitHub Actions, add these secrets:

### 1. EC2_SSH_KEY
```bash
# Copy your PEM key content
cat ila-pk.pem
# Paste entire content (including BEGIN/END lines) as secret
```

### 2. POSTGRES_PASSWORD
```bash
# Generate strong password
openssl rand -base64 20
# Use output as secret value
```

### 3. JWT_SECRET
```bash
# Generate JWT secret
openssl rand -base64 32
# Use output as secret value
```

**Add secrets at:**
https://github.com/ntu-dsair/ila-webapp/settings/secrets/actions

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Containers are running: `docker compose ps`
- [ ] Frontend accessible: http://13.212.19.144:3000
- [ ] Backend accessible: http://13.212.19.144:3001/health
- [ ] Database initialized (check logs)
- [ ] Security Group allows ports 3000, 3001
- [ ] Environment variables set correctly
- [ ] GitHub Actions workflow passes

---

## 🛠️ Common Commands

```bash
# SSH to EC2
ssh -i ila-pk.pem ec2-user@13.212.19.144

# Check container status
docker compose ps

# View logs (live)
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend

# Stop all services
docker compose down

# Update and restart
cd ~/ila-webapp
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 🔧 Troubleshooting

### GitHub Actions fails to connect to EC2

**Solution:**
- Verify `EC2_SSH_KEY` secret contains full PEM key content
- Check EC2 Security Group allows SSH (port 22) from anywhere
- Ensure EC2 instance is running

### Containers won't start

```bash
# Check logs
docker compose logs

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Port already in use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000

# Stop Docker containers
docker compose down
```

### Database connection fails

```bash
# Check database logs
docker compose logs postgres

# Verify environment variables
cat .env

# Restart database
docker compose restart postgres
```

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| **GITHUB_ACTIONS_SETUP.md** | Complete CI/CD setup guide |
| **DOCKER_DEPLOYMENT.md** | Docker deployment reference |
| **DEPLOYMENT_QUICKSTART.md** | Quick reference card |
| **DOCKER_README.md** | Docker basics |
| **SETUP_GUIDE.md** | Local development setup |

---

## 🎉 You're All Set!

Your deployment pipeline is now configured with:
- ✅ Automated CI/CD via GitHub Actions
- ✅ Docker containerization
- ✅ Semi-automated deployment script
- ✅ Comprehensive documentation
- ✅ Health checks and verification
- ✅ Production-ready configuration

**Next Steps:**
1. Add GitHub Secrets
2. Push to main branch
3. Watch your app auto-deploy! 🚀

---

## 📞 Need Help?

Check the documentation:
- Setup issues → [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)
- Docker issues → [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- Quick reference → [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)

Check logs:
```bash
# Application logs
docker compose logs -f

# GitHub Actions logs
https://github.com/ntu-dsair/ila-webapp/actions
```
