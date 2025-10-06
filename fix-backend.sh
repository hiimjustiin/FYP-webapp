#!/bin/bash

# =============================================================================
# Backend Fix Script for AWS EC2
# =============================================================================
# This script attempts to fix common backend issues
# Usage: ssh -i ila-pk.pem ec2-user@13.212.19.144 'bash -s' < fix-backend.sh
# =============================================================================

set -e

cd /home/ec2-user/ila-webapp

echo "============================================"
echo "Fixing Backend Issues"
echo "============================================"
echo ""

echo "[1] Stopping all containers..."
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml down
echo "✓ Containers stopped"
echo ""

echo "[2] Checking .env file..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file missing, cannot proceed"
    echo "Please ensure GitHub Secrets are set correctly"
    exit 1
fi
echo "✓ .env file exists"
echo ""

echo "[3] Cleaning up old containers and images..."
sudo docker system prune -f
echo "✓ Cleanup complete"
echo ""

echo "[4] Rebuilding backend image..."
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend --no-cache
echo "✓ Backend rebuilt"
echo ""

echo "[5] Starting all services..."
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo "✓ Services started"
echo ""

echo "[6] Waiting for services to be ready..."
sleep 10
echo ""

echo "[7] Checking container status..."
sudo docker compose ps
echo ""

echo "[8] Checking backend logs..."
echo "--------------------------------------------"
sudo docker compose logs --tail=30 backend
echo "--------------------------------------------"
echo ""

echo "[9] Testing backend health endpoint..."
sleep 5
if curl -f http://localhost:3001/health 2>/dev/null; then
    echo ""
    echo "✅ Backend is now responding!"
else
    echo ""
    echo "❌ Backend still not responding"
    echo "Check logs: sudo docker compose logs -f backend"
fi

echo ""
echo "============================================"
echo "Fix attempt complete"
echo "============================================"
