# Quick Deployment Reference

Choose your deployment method:

## 🚀 Automated CI/CD (Production)
**GitHub Actions** - Auto-deploy on push to main
```bash
git push origin main
```
📖 Setup guide: [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)

## 🔧 Semi-Automated (Development)
**Docker Script** - One command deployment
```bash
./deploy-docker.sh
```

## 🛠️ Manual (Quick Updates)
**Direct Docker** - On EC2 instance
```bash
ssh -i ila-pk.pem ec2-user@13.212.19.144
cd ~/ila-webapp
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 📚 Documentation

- **[GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)** - Complete CI/CD setup guide
- **[DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)** - Docker deployment reference
- **[DOCKER_README.md](DOCKER_README.md)** - Docker basics (if available)
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Local development setup

---

## ⚡ Quick Commands

```bash
# SSH to EC2
ssh -i ila-pk.pem ec2-user@13.212.19.144

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Check status
docker compose ps
```

---

## 🌐 Access

- Frontend: http://13.212.19.144:3000
- Backend: http://13.212.19.144:3001/api
