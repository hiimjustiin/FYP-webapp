# Docker Compose Quick Start Guide

## Complete Production-Ready Setup in 5 Minutes

This guide will get all four services running (Frontend, Backend, AI Service, Database) using Docker Compose.

### Step 1: Prerequisites

✅ Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))  
✅ OpenAI API key ([Get one here](https://platform.openai.com/api-keys))  
✅ At least 2GB free RAM  

### Step 2: Configure Environment

```bash
# Navigate to project directory
cd ila-webapp

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
# OR
code .env
```

**Minimum required configuration:**

```bash
# .env
POSTGRES_PASSWORD=your_secure_db_password_here
JWT_SECRET=your_32_character_secret_key_here_change_this
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here
```

### Step 3: Build and Start Services

```bash
# Build all images and start containers
docker compose up -d --build

# This will:
# - Build frontend (React + Vite)
# - Build backend (Express + TypeScript) 
# - Build AI service (FastAPI + Pydantic AI)
# - Start PostgreSQL database
```

**Expected output:**
```
[+] Building 45.2s (4/4) FINISHED
[+] Running 4/4
 ✔ Container ila-postgres      Started
 ✔ Container ila-backend-ai    Started  
 ✔ Container ila-backend       Started
 ✔ Container ila-frontend      Started
```

### Step 4: Run Database Migrations

```bash
# Apply database schema and seed data
docker compose exec backend bun db:migrate

# Expected output:
# > Migrating files:
# > - 1728270000000_enhance-projects-schema.js
# > - 1759907496990_add-email-verification-otp.js
# > - 1760671987000_enhance-projects-for-ui.js
# > - 1760800000000_add-course-enrollments.js
# > - 1761105666275_add-dimensions-and-submissions.js
# > - 1761287574829_add-instructor-dashboard-support.js
```

### Step 5: Verify Services

```bash
# Check all containers are running
docker compose ps

# Should show:
# NAME               STATUS        PORTS
# ila-postgres       Up (healthy)  0.0.0.0:5432->5432/tcp
# ila-backend-ai     Up (healthy)  0.0.0.0:8000->8000/tcp
# ila-backend        Up            0.0.0.0:3001->3001/tcp
# ila-frontend       Up            0.0.0.0:80->80/tcp

# Test AI service health
curl http://localhost:8000/health

# Test backend
curl http://localhost:3001/api/health

# Open frontend in browser
open http://localhost:3000
# OR visit: http://localhost:3000
```

### Step 6: View Logs (Optional)

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend-ai
docker compose logs -f backend
docker compose logs -f frontend

# Last 100 lines
docker compose logs --tail=100 backend-ai
```

## 🎉 Success!

Your services are now running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Web UI |
| **Backend API** | http://localhost:3001 | REST API |
| **AI Service** | http://localhost:8000 | AI Feedback |
| **AI Docs** | http://localhost:8000/docs | API Documentation |
| **PostgreSQL** | localhost:5432 | Database |

## Common Commands

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v

# Restart a specific service
docker compose restart backend-ai

# Rebuild after code changes
docker compose up -d --build backend

# View resource usage
docker stats

# Access container shell
docker compose exec backend sh
docker compose exec backend-ai bash

# Run database migrations
docker compose exec backend bun db:migrate

# Create new migration
docker compose exec backend bun db:migrate:create my-migration-name

# Rollback last migration
docker compose exec backend bun db:migrate:down
```

## Troubleshooting

### Port Already in Use

```bash
# Find what's using the port
lsof -i :3000  # frontend
lsof -i :3001  # backend
lsof -i :8000  # AI service
lsof -i :5432  # postgres

# Kill the process or change ports in .env
```

### AI Service Health Check Failing

```bash
# Check logs
docker compose logs backend-ai

# Verify OpenAI API key is set
docker compose exec backend-ai env | grep OPENAI_API_KEY

# Manually test health endpoint
docker compose exec backend-ai curl http://localhost:8000/health
```

### Database Connection Issues

```bash
# Check postgres is running
docker compose ps postgres

# Check connection from backend
docker compose exec backend psql $DATABASE_URL -c "SELECT 1"

# Restart postgres
docker compose restart postgres
```

### Build Errors

```bash
# Clean build (removes cached layers)
docker compose build --no-cache backend-ai

# Remove all containers and rebuild
docker compose down
docker compose up -d --build
```

## Production Deployment

For production deployment with SSL, monitoring, and backups, see:
- [DEPLOYMENT_AI_SERVICE.md](./DEPLOYMENT_AI_SERVICE.md) - Comprehensive deployment guide
- [docker-compose.prod.yml](./docker-compose.prod.yml) - Production configuration

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Database password | `secure_password_123` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your-super-secret-jwt-key` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-abc123...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_SERVICE_PORT` | AI service port | `8000` |
| `BACKEND_PORT` | Backend API port | `3001` |
| `FRONTEND_PORT` | Frontend HTTP port | `80` |
| `OPENAI_MODEL` | AI model to use | `gpt-4o` |
| `OPENAI_TEMPERATURE` | AI temperature (0-1) | `0.3` |
| `MAX_INPUT_TOKENS` | Token limit per submission | `10000` |
| `CACHE_ENABLED` | Enable Redis caching | `false` |
| `LOG_LEVEL` | Logging level | `INFO` |

See [.env.example](./.env.example) for complete list.

## Next Steps

1. **Login to the app** at http://localhost:3000
   - Default admin: `admin@example.com` / `admin123` (from seed data)
   
2. **Create a course** and add students

3. **Submit a project** to test AI feedback

4. **Monitor AI processing**:
   ```bash
   # Watch AI service logs
   docker compose logs -f backend-ai | grep "submission_id"
   ```

5. **Check costs** (optional):
   ```bash
   # View token usage in logs
   docker compose logs backend-ai | grep "tokens_used"
   ```

## Support

- **Issues**: Check [DEPLOYMENT_AI_SERVICE.md](./DEPLOYMENT_AI_SERVICE.md) troubleshooting section
- **Logs**: `docker compose logs -f`
- **Status**: `docker compose ps`
- **Resources**: `docker stats`
