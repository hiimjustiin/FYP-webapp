# Docker Deployment Guide for AWS EC2

Complete guide for deploying the ILA WebApp using Docker on AWS EC2.

## 🎯 Deployment Options

| Method             | Use Case            | Complexity | Automation |
| ------------------ | ------------------- | ---------- | ---------- |
| **GitHub Actions** | Production          | Medium     | ✅ Full    |
| **Docker Script**  | Development/Testing | Low        | ⚡ Semi    |
| **Manual Docker**  | Quick Updates       | Low        | ❌ Manual  |

---

## 🚀 Method 1: GitHub Actions (Recommended)

Automated CI/CD with GitHub Actions - deploys automatically on push to `main`.

### Quick Setup

1. **Add GitHub Secrets:**
   Go to: `Settings` → `Secrets and variables` → `Actions`

   Add these secrets:

   - `EC2_SSH_KEY`: Content of your `ila-pk.pem` file
   - `POSTGRES_PASSWORD`: Strong database password
   - `JWT_SECRET`: Generated with `openssl rand -base64 32`

2. **Push to main branch:**

   ```bash
   git push origin main
   ```

3. **Monitor deployment:**
   Watch at: https://github.com/ntu-dsair/ila-webapp/actions

**📖 Full guide:** See [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)

---

## 🔧 Method 2: Docker Deployment Script

Semi-automated deployment from your local machine.

### Usage

```bash
# Make executable (first time only)
chmod +x deploy-docker.sh

# Deploy
./deploy-docker.sh
```

### What It Does

1. ✅ Connects to EC2 via SSH
2. ✅ Installs Docker and Docker Compose
3. ✅ Clones/updates your repository
4. ✅ Builds Docker images
5. ✅ Starts containers with docker-compose
6. ✅ Verifies deployment

---

## 🛠️ Method 3: Manual Docker Deployment

Direct deployment on EC2 instance.

### First Time Setup

```bash
# SSH into EC2
ssh -i ila-pk.pem ec2-user@13.229.1.151

# Install Docker
sudo dnf install -y docker docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Log out and back in for group membership
exit
ssh -i ila-pk.pem ec2-user@13.229.1.151

# Clone repository
cd ~
git clone https://github.com/ntu-dsair/ila-webapp.git
cd ila-webapp

# Create .env file
nano .env
# (Add your environment variables - see below)

# Deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Subsequent Deployments

```bash
ssh -i ila-pk.pem ec2-user@13.229.1.151
cd ~/ila-webapp

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Clean up old images
docker image prune -f
```

---

## ⚙️ Configuration

### Environment Variables (.env)

Create `.env` file on EC2 with production values:

```env
# Database Configuration
POSTGRES_DB=ila_db
POSTGRES_USER=ila_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_PORT=5432

# Application Configuration
NODE_ENV=production
JWT_SECRET=your_jwt_secret_from_openssl_rand
CORS_ORIGIN=http://13.229.1.151:3000

# Port Configuration
FRONTEND_PORT=3000
BACKEND_PORT=3001

# Database URL
DATABASE_URL=postgresql://ila_user:your_secure_password_here@postgres:5432/ila_db

# API Base URL
VITE_API_BASE_URL=http://13.229.1.151:3001/api
```

### EC2 Security Group Rules

Configure inbound rules in AWS Console:

| Type  | Protocol | Port | Source    | Description    |
| ----- | -------- | ---- | --------- | -------------- |
| SSH   | TCP      | 22   | Your IP   | SSH access     |
| HTTP  | TCP      | 3000 | 0.0.0.0/0 | Frontend       |
| HTTP  | TCP      | 3001 | 0.0.0.0/0 | Backend API    |
| HTTPS | TCP      | 443  | 0.0.0.0/0 | SSL (optional) |

**Note:** PostgreSQL (5432) should NOT be exposed externally - it runs within the Docker network.

---

## 🐳 Docker Architecture

```
┌─────────────────────────────────────────────┐
│         AWS EC2 (Amazon Linux 2023)         │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │        Docker Network: ila-network     │ │
│  │                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │  Frontend    │  │   Backend    │  │ │
│  │  │  (Nginx)     │  │  (Node.js)   │  │ │
│  │  │  Port: 3000  │  │  Port: 3001  │  │ │
│  │  └──────────────┘  └──────────────┘  │ │
│  │          │                  │         │ │
│  │          └──────────┬───────┘         │ │
│  │                     │                 │ │
│  │            ┌────────▼────────┐        │ │
│  │            │   PostgreSQL    │        │ │
│  │            │   Port: 5432    │        │ │
│  │            │  (internal only)│        │ │
│  │            └─────────────────┘        │ │
│  │                                        │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                      │
                      ▼
              Internet Users
        http://13.229.1.151:3000
```

---

## 📊 Container Management

### Check Container Status

```bash
# List all containers
docker compose ps

# Detailed container info
docker ps

# Check container logs
docker compose logs -f

# Check specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Restart Containers

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

### Stop/Start Containers

```bash
# Stop all containers
docker compose down

# Start containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Stop and remove volumes (DANGER: deletes database)
docker compose down -v
```

### View Logs

```bash
# All logs (live)
docker compose logs -f

# Backend logs only
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100

# Logs since 10 minutes ago
docker compose logs --since 10m
```

### Resource Monitoring

```bash
# Monitor CPU/Memory usage
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

## 🗄️ Database Management

### Access PostgreSQL

```bash
# Connect to database
docker compose exec postgres psql -U ila_user -d ila_db

# Run SQL queries
docker compose exec postgres psql -U ila_user -d ila_db -c "SELECT * FROM users;"

# Execute SQL file
docker compose exec postgres psql -U ila_user -d ila_db -f /docker-entrypoint-initdb.d/01-init.sql
```

### Backup Database

```bash
# Create backup
docker compose exec postgres pg_dump -U ila_user ila_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
cat backup.sql | docker compose exec -T postgres psql -U ila_user -d ila_db
```

### Reset Database

```bash
# Stop containers
docker compose down

# Remove postgres volume (DANGER: deletes all data)
docker volume rm ila-webapp_postgres_data

# Restart (will reinitialize database)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🔧 Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker compose logs backend
docker compose logs frontend
docker compose logs postgres

# Check container status
docker compose ps

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Port Already in Use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Stop the conflicting process
sudo kill -9 <PID>

# Or change ports in .env
```

### Database Connection Failed

```bash
# Check if postgres is running
docker compose ps postgres

# Check postgres logs
docker compose logs postgres

# Verify DATABASE_URL in backend logs
docker compose logs backend | grep DATABASE_URL

# Test connection manually
docker compose exec postgres psql -U ila_user -d ila_db
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up Docker resources
docker system prune -a --volumes

# Remove unused images
docker image prune -a
```

### Frontend Shows 404

```bash
# Check if frontend is running
docker compose ps frontend

# Check frontend logs
docker compose logs frontend

# Verify build artifacts exist
docker compose exec frontend ls -la /usr/share/nginx/html

# Rebuild frontend
docker compose build frontend --no-cache
docker compose restart frontend
```

### Backend API Not Responding

```bash
# Check backend logs
docker compose logs backend

# Check if backend is listening on port
docker compose exec backend netstat -tulpn | grep 3001

# Restart backend
docker compose restart backend

# Check environment variables
docker compose exec backend printenv
```

---

## 🔒 Security Best Practices

### 1. Secrets Management

```bash
# Generate strong JWT secret
openssl rand -base64 32

# Generate strong passwords (20+ characters)
openssl rand -base64 20

# Never commit secrets to Git
# Always use .env file (already in .gitignore)
```

### 2. Update Security Group

- **SSH (22)**: Restrict to your IP only
- **HTTP (3000, 3001)**: Allow from anywhere OR restrict to your domain's IP
- **PostgreSQL (5432)**: DO NOT expose externally

### 3. Regular Updates

```bash
# Update system packages
sudo dnf update -y

# Update Docker images
docker compose pull

# Rebuild containers
docker compose up -d --build
```

### 4. Enable Firewall (Optional)

```bash
# Install firewalld
sudo dnf install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Allow necessary ports
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

---

## 🌐 Production Enhancements

### Add SSL/HTTPS with Let's Encrypt

```bash
# Install certbot
sudo dnf install -y certbot python3-certbot-nginx

# Get certificate (requires domain name)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

### Add Nginx Reverse Proxy

Create `/etc/nginx/conf.d/ila-webapp.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

### Enable CloudWatch Monitoring

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure and start agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

---

## 📋 Quick Reference

### Common Commands

```bash
# Deploy/Update
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# View logs
docker compose logs -f

# Restart
docker compose restart

# Stop
docker compose down

# Clean up
docker system prune -a
```

### Access URLs

- **Frontend**: http://13.229.1.151:3000
- **Backend API**: http://13.229.1.151:3001/api
- **Database**: postgres://ila_user:password@postgres:5432/ila_db (internal)

### SSH Access

```bash
ssh -i ila-pk.pem ec2-user@13.229.1.151
```

---

## 📚 Additional Resources

- [GitHub Actions Setup Guide](GITHUB_ACTIONS_SETUP.md)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🆘 Support

If you encounter issues:

1. Check container logs: `docker compose logs -f`
2. Verify EC2 Security Groups allow traffic
3. Confirm `.env` file has correct values
4. Check EC2 instance has enough disk space
5. Review GitHub Actions logs (if using CI/CD)

For urgent issues, SSH to EC2 and check:

```bash
docker compose ps        # Container status
docker compose logs      # Application logs
df -h                    # Disk space
free -h                  # Memory usage
```
