#!/bin/bash

# =============================================================================
# Reset PostgreSQL Password - Run from Local Machine
# =============================================================================
# This script will:
# 1. Stop all containers
# 2. Remove the PostgreSQL data volume (THIS WILL DELETE ALL DATA)
# 3. Recreate containers with the correct password from .env
# 4. Re-initialize the database
# =============================================================================

set -e

echo "⚠️  DATABASE RESET WARNING"
echo "===================================="
echo "This will DELETE ALL DATA in the PostgreSQL database!"
echo "The database will be recreated with the password from .env"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to proceed): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "🔧 Resetting PostgreSQL Database on EC2"
echo "===================================="
echo ""

ssh -i ila-pk.pem ec2-user@13.229.1.151 << 'ENDSSH'
set -e

cd /home/ec2-user/ila-webapp

echo "📋 Step 1: Checking current password in .env..."
CURRENT_PASSWORD=$(grep "^POSTGRES_PASSWORD=" .env | cut -d'=' -f2)
echo "Password in .env: $CURRENT_PASSWORD"
echo ""

echo "🛑 Step 2: Stopping all containers..."
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml down
echo "✓ Containers stopped"
echo ""

echo "🗑️  Step 3: Removing PostgreSQL data volume..."
sudo docker volume rm ila-webapp_postgres-data || echo "(Volume may not exist, continuing...)"
echo "✓ PostgreSQL data removed"
echo ""

echo "📦 Step 4: Recreating containers..."
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo "✓ Containers created"
echo ""

echo "⏳ Step 5: Waiting for PostgreSQL to initialize (30 seconds)..."
sleep 30
echo ""

echo "📊 Step 6: Checking container status..."
sudo docker compose ps
echo ""

echo "🔍 Step 7: Checking PostgreSQL logs..."
echo "--------------------------------------------"
sudo docker compose logs postgres | tail -20
echo "--------------------------------------------"
echo ""

echo "🩺 Step 8: Testing database connection from backend..."
sleep 5
if curl -f http://localhost:3001/health 2>/dev/null; then
    echo ""
    echo "✅ SUCCESS! Backend connected to database!"
    echo ""
    echo "🌐 Your application is ready:"
    echo "   - Frontend: http://13.229.1.151:3000"
    echo "   - Backend: http://13.229.1.151:3001"
    echo "   - Registration: http://13.229.1.151:3000/register"
else
    echo ""
    echo "❌ Backend still not connecting"
    echo ""
    echo "📋 Backend logs:"
    echo "--------------------------------------------"
    sudo docker compose logs --tail=30 backend
    echo "--------------------------------------------"
fi
ENDSSH

echo ""
echo "===================================="
echo "Database reset complete!"
echo "===================================="
