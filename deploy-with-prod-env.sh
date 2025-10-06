#!/bin/bash

# =============================================================================
# Deploy with Production Environment Configuration
# =============================================================================
# This script applies the environment separation fix
# =============================================================================

set -e

echo "🚀 Deploying with Separate Production Configuration"
echo "===================================================="
echo ""
echo "This will:"
echo "  1. Pull latest code with environment separation"
echo "  2. Create .env.production on EC2"
echo "  3. Stop all containers"
echo "  4. Remove old database"
echo "  5. Start fresh with production config"
echo ""
read -p "Press ENTER to continue or Ctrl+C to cancel..."
echo ""

ssh -i ila-pk.pem ec2-user@13.212.19.144 'bash -s' << 'ENDSSH'
set -e

cd /home/ec2-user/ila-webapp

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📥 Step 1/7: Pulling latest code..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git fetch origin
git checkout jdanas/dev
git pull origin jdanas/dev
echo "✓ Code updated"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 2/7: Creating .env.production..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat > .env.production << 'EOF'
# Database Configuration
POSTGRES_DB=ila_db
POSTGRES_USER=ila_user
POSTGRES_PASSWORD=JPBFpINsKQ4hQDrJYSDe
POSTGRES_PORT=5432

# Application Configuration
NODE_ENV=production
JWT_SECRET=nqAX46vHRp2TtjlCVjF7q1+5IDpY2EaYjnEA1m7Et8A=
CORS_ORIGIN=http://13.212.19.144:3000

# Port Configuration
FRONTEND_PORT=3000
BACKEND_PORT=3001

# Production Database URL
DATABASE_URL=postgresql://ila_user:JPBFpINsKQ4hQDrJYSDe@postgres:5432/ila_db

# API Base URL
VITE_API_BASE_URL=http://13.212.19.144:3001/api

# Frontend Production Settings
VITE_BYPASS_AUTH=false
EOF
echo "✓ Production environment file created"
echo ""

echo "Verifying .env.production content:"
cat .env.production | grep -E "(POSTGRES_PASSWORD|JWT_SECRET|DATABASE_URL)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛑 Step 3/7: Stopping containers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml down
echo "✓ Containers stopped"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  Step 4/7: Removing old database volume..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo docker volume rm ila-webapp_postgres_prod_data 2>/dev/null || echo "(Volume already removed)"
echo "✓ Old database removed"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Step 5/7: Rebuilding images..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend --no-cache
echo "✓ Backend rebuilt"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Step 6/7: Starting containers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo "✓ Containers started"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ Step 7/7: Waiting for initialization (35s)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 35
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📊 Container Status:"
sudo docker compose ps
echo ""

echo "🔐 PostgreSQL Environment:"
sudo docker compose exec postgres env | grep POSTGRES_PASSWORD
echo ""

echo "🔐 Backend Environment:"
sudo docker compose exec backend env | grep -E "(DATABASE_URL|NODE_ENV)" | head -2
echo ""

echo "📋 Backend Logs (last 15 lines):"
echo "─────────────────────────────────────────"
sudo docker compose logs --tail=15 backend
echo "─────────────────────────────────────────"
echo ""

echo "🩺 Backend Health Check:"
if curl -f -s http://localhost:3001/health; then
    echo ""
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ SUCCESS! Backend is working!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 Your application is ready:"
    echo "   Frontend:     http://13.212.19.144:3000"
    echo "   Backend API:  http://13.212.19.144:3001"
    echo "   Registration: http://13.212.19.144:3000/register"
    echo ""
    echo "🎉 Environment separation implemented successfully!"
    echo "   - Local development: uses .env"
    echo "   - Production: uses .env.production"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ Backend health check failed"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Check logs with:"
    echo "  sudo docker compose logs -f backend"
    echo ""
fi
ENDSSH

echo ""
echo "===================================================="
echo "Deployment complete!"
echo "===================================================="
