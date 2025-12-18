# ILA AI Feedback Service - Deployment Guide

## Architecture Overview

The ILA webapp now consists of four main services:

1. **Frontend** (React + Vite) - Port 5173 (dev) / 3000 (prod)
2. **Express Backend** (Node.js + TypeScript) - Port 3001
3. **Python AI Service** (FastAPI + Pydantic AI) - Port 8000
4. **PostgreSQL Database** - Port 5432

All services are integrated into Docker Compose for easy deployment.

## Quick Start with Docker Compose

### Prerequisites

- Docker and Docker Compose installed
- OpenAI API key
- At least 2GB free RAM

### 1. Clone and Configure

```bash
# Clone repository
git clone <repo-url>
cd ila-webapp

# Copy environment template
cp .env.example .env

# Edit .env and add your OpenAI API key
nano .env
```

**Required environment variables:**
```bash
# Database
POSTGRES_PASSWORD=<secure-password>

# Backend
JWT_SECRET=<32+ character secret>

# AI Service (CRITICAL)
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### 2. Build and Start All Services

```bash
# Build and start all services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f backend-ai
docker compose logs -f backend
```

### 3. Verify Services

```bash
# Check AI service health
curl http://localhost:8000/health

# Check backend
curl http://localhost:3001/health

# Check frontend
open http://localhost:3000
```

### 4. Run Database Migrations

```bash
# Run migrations (if not already applied)
docker compose exec backend bun db:migrate
```

## Deployment Options

### Option 1: Docker Compose (Recommended for Production)

**Best for:** Production deployments, staging environments, easy scaling

**Pros:**
- ✅ All services containerized and isolated
- ✅ Easy to scale horizontally
- ✅ Consistent environment across dev/staging/prod
- ✅ Built-in networking between services
- ✅ Simple rollback and version management

**Cons:**
- ❌ Requires Docker knowledge
- ❌ Slightly more resource usage (container overhead)

#### Setup Steps:

1. **Create production Docker Compose file:**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ila_db
      POSTGRES_USER: ila_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ila_user -d ila_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://ila_user:${DB_PASSWORD}@postgres:5432/ila_db
      PORT: 3001
      AI_SERVICE_URL: http://ai-service:8000
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      ai-service:
        condition: service_healthy
    restart: unless-stopped

  ai-service:
    build:
      context: ./backend-ai
      dockerfile: Dockerfile
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      DATABASE_URL: postgresql://ila_user:${DB_PASSWORD}@postgres:5432/ila_db
      EXPRESS_BACKEND_URL: http://backend:3001
      API_HOST: 0.0.0.0
      API_PORT: 8000
      ENVIRONMENT: production
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${FRONTEND_API_URL}
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

2. **Create production environment file:**

```bash
# .env.prod
DB_PASSWORD=strong_secure_password_here
JWT_SECRET=super_secret_jwt_key_at_least_32_chars
JWT_REFRESH_SECRET=super_secret_refresh_key_at_least_32_chars
OPENAI_API_KEY=sk-proj-your-actual-key-here
FRONTEND_API_URL=https://your-domain.com
```

3. **Deploy:**

```bash
# On your production server
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale AI service if needed
docker-compose -f docker-compose.prod.yml up -d --scale ai-service=3
```

---

### Option 2: Kubernetes (Recommended for Large Scale)

**Best for:** High-traffic applications, multi-region deployments, enterprise environments

**Pros:**
- ✅ Auto-scaling based on load
- ✅ Self-healing (auto-restart failed containers)
- ✅ Rolling updates with zero downtime
- ✅ Advanced load balancing
- ✅ Multi-cloud support

**Cons:**
- ❌ Complex setup and management
- ❌ Requires Kubernetes expertise
- ❌ Overkill for small deployments

#### Key Manifests:

```yaml
# k8s/ai-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: your-registry/ila-ai-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: openai-api-key
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: connection-string
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ai-service
spec:
  selector:
    app: ai-service
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

### Option 3: Serverless (AWS Lambda / Google Cloud Run)

**Best for:** Cost-sensitive deployments, variable traffic, pay-per-use model

**Pros:**
- ✅ No server management
- ✅ Pay only for actual usage
- ✅ Auto-scaling to zero
- ✅ Fast deployment

**Cons:**
- ❌ Cold start latency (2-5 seconds)
- ❌ Vendor lock-in
- ❌ Limited execution time (15 min max)
- ❌ Not ideal for long-running AI tasks

#### AWS Lambda Setup (with API Gateway):

```bash
# Install Serverless Framework
npm install -g serverless

# Create serverless.yml for AI service
```

```yaml
# backend-ai/serverless.yml
service: ila-ai-service

provider:
  name: aws
  runtime: python3.11
  region: us-east-1
  timeout: 300  # 5 minutes
  memorySize: 3008  # Maximum for Lambda
  environment:
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}
    DATABASE_URL: ${env:DATABASE_URL}

functions:
  analyze:
    handler: main.lambda_handler
    events:
      - http:
          path: /api/evaluate
          method: post
          cors: true
  
  feedback:
    handler: main.lambda_handler
    events:
      - http:
          path: /api/feedback/{submissionId}
          method: get
          cors: true

plugins:
  - serverless-python-requirements
```

**Note:** Lambda is **NOT recommended** for this AI service because:
- AI analysis takes 30-60 seconds (slower cold starts)
- Better suited for persistent containers

---

### Option 4: Platform-as-a-Service (Heroku, Railway, Render)

**Best for:** Quick deployments, startups, proof-of-concept

**Pros:**
- ✅ Extremely easy setup (git push to deploy)
- ✅ Built-in CI/CD
- ✅ Managed databases
- ✅ Free tier available

**Cons:**
- ❌ More expensive at scale
- ❌ Less control over infrastructure
- ❌ Vendor lock-in

#### Railway.app Deployment (Recommended PaaS):

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
railway login
```

2. **Initialize project:**
```bash
cd ila-webapp
railway init
```

3. **Deploy each service:**
```bash
# Deploy Express backend
cd backend
railway up

# Deploy Python AI service
cd ../backend-ai
railway up

# Deploy frontend
cd ..
railway up
```

4. **Set environment variables in Railway dashboard:**
- `DATABASE_URL` (auto-provisioned)
- `OPENAI_API_KEY`
- `AI_SERVICE_URL` (internal Railway URL)

---

## Recommended Deployment Strategy

### **For Development/Small Teams:** Docker Compose
- Easy to manage
- Consistent with dev environment
- Low cost (single VPS)

### **For Production/Moderate Scale:** Docker Compose + Nginx Reverse Proxy
```
                    ┌─────────────┐
                    │   Nginx     │ (SSL, Load Balancing)
                    │  (Port 80)  │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐   ┌──────────┐
    │ Frontend │    │ Backend  │   │   AI     │
    │ (Port    │    │ (Port    │   │ Service  │
    │  3000)   │    │  3001)   │   │ (Port    │
    └──────────┘    └──────────┘   │  8000)   │
                          │         └──────────┘
                          ▼
                    ┌──────────┐
                    │PostgreSQL│
                    │ (Port    │
                    │  5432)   │
                    └──────────┘
```

**nginx.conf:**
```nginx
upstream backend {
    server backend:3001;
}

upstream ai_service {
    server ai-service:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # AI Service (internal only - not exposed publicly)
    # location /ai/ {
    #     deny all;  # Block external access
    # }
}
```

### **For Enterprise/High Scale:** Kubernetes + Cloud Provider
- AWS EKS / Google GKE / Azure AKS
- Horizontal pod autoscaling
- Multi-region deployment
- Advanced monitoring (Prometheus/Grafana)

---

## Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Use environment variables for secrets (never commit .env)
- [ ] Enable HTTPS with SSL certificates (Let's Encrypt)
- [ ] Set up CORS properly (whitelist only your frontend domain)
- [ ] Use rate limiting on all APIs
- [ ] Implement API key rotation for OpenAI
- [ ] Enable database SSL connections
- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)

### Performance
- [ ] Set up Redis for caching AI results
- [ ] Enable database connection pooling
- [ ] Configure CDN for frontend assets (CloudFlare, CloudFront)
- [ ] Implement request queuing for AI service
- [ ] Set up horizontal scaling for AI service (3+ instances)
- [ ] Enable database read replicas for analytics queries
- [ ] Configure proper resource limits (CPU, memory)

### Monitoring
- [ ] Set up application logging (ELK stack, Datadog, LogRocket)
- [ ] Configure health check endpoints
- [ ] Implement error tracking (Sentry)
- [ ] Monitor AI service costs (OpenAI usage dashboard)
- [ ] Set up alerts for failures/high latency
- [ ] Track token usage and costs per submission
- [ ] Database performance monitoring (pg_stat_statements)

### Backup & Recovery
- [ ] Automated daily database backups
- [ ] Test restore procedures
- [ ] Database migration rollback plan
- [ ] Version control for AI prompts/rubrics
- [ ] Disaster recovery documentation

### CI/CD
- [ ] Set up GitHub Actions for automated testing
- [ ] Implement automated database migrations
- [ ] Blue-green deployment strategy
- [ ] Rollback automation
- [ ] Automated smoke tests after deployment

---

## Cost Estimation (Monthly)

### Small Deployment (100-500 submissions/month)
- **VPS (DigitalOcean/Linode):** $20-40/month
- **PostgreSQL:** Included in VPS
- **OpenAI API:** ~$10-50/month (100-500 submissions × $0.02-0.10)
- **Total:** ~$30-90/month

### Medium Deployment (1,000-5,000 submissions/month)
- **VPS (Managed Kubernetes):** $100-200/month
- **Managed PostgreSQL:** $50-100/month
- **OpenAI API:** ~$100-500/month
- **Redis Cache:** $15-30/month
- **Total:** ~$265-830/month

### Large Deployment (10,000+ submissions/month)
- **Kubernetes Cluster:** $500-1,000/month
- **Managed PostgreSQL (HA):** $200-400/month
- **OpenAI API:** ~$1,000-5,000/month (with caching optimizations)
- **Redis Cache:** $50-100/month
- **CDN:** $20-50/month
- **Total:** ~$1,770-6,550/month

---

## Quick Start Commands

### Local Development
```bash
# Terminal 1: Start PostgreSQL
docker-compose up -d postgres

# Terminal 2: Start Express Backend
cd backend && bun dev

# Terminal 3: Start Python AI Service
cd backend-ai && python main.py

# Terminal 4: Start Frontend
bun dev
```

### Production Deployment (Docker Compose)
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose exec backend bun db:migrate

# Check logs
docker-compose logs -f ai-service

# Scale AI service
docker-compose up -d --scale ai-service=3
```

### Database Migrations
```bash
# Create new migration
cd backend && bun db:migrate:create migration-name

# Run migrations
bun db:migrate

# Rollback last migration
bun db:migrate:down
```

---

## Support & Troubleshooting

### Common Issues

**Issue:** AI service taking too long (>60s)
- **Solution:** Increase token limit, enable caching, scale horizontally

**Issue:** Database connection errors
- **Solution:** Check `DATABASE_URL`, verify PostgreSQL is running, check connection pool limits

**Issue:** OpenAI API rate limits
- **Solution:** Implement request queuing, upgrade OpenAI tier, add retry logic

**Issue:** High costs
- **Solution:** Enable caching (30-50% cost reduction), optimize token usage, batch submissions

---

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [OpenAI API Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [PostgreSQL Production Checklist](https://www.postgresql.org/docs/current/runtime-config.html)
