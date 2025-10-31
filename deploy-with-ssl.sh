#!/bin/bash

# Quick SSL Deployment Script
# Run this on EC2 after obtaining SSL certificates

set -e

WEBAPP_DIR="$HOME/ila-webapp"
DOMAIN="ila-analytics.rdc.nie.edu.sg"

echo "==================================="
echo "Deploying with SSL"
echo "==================================="
echo ""

# Check if certificates exist
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "Error: SSL certificates not found!"
    echo "Run setup-ssl.sh first to obtain certificates"
    exit 1
fi

cd $WEBAPP_DIR

# Update environment for HTTPS
echo "Updating environment variables for HTTPS..."
if [ -f ".env" ]; then
    # Backup original .env
    cp .env .env.backup
    
    # Update CORS_ORIGIN to HTTPS
    sed -i "s|CORS_ORIGIN=http://|CORS_ORIGIN=https://|g" .env
    sed -i "s|VITE_API_BASE_URL=http://|VITE_API_BASE_URL=https://|g" .env
    
    echo "✓ Environment variables updated"
else
    echo "Warning: .env file not found"
fi

# Pull latest code
echo ""
echo "Pulling latest changes..."
git pull origin main || echo "Could not pull from git, using local files"

# Stop current containers
echo ""
echo "Stopping current containers..."
docker compose down

# Rebuild and start with SSL
echo ""
echo "Building and starting containers with SSL..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Wait for containers to start
echo ""
echo "Waiting for containers to start..."
sleep 10

# Check container status
echo ""
echo "Container status:"
docker compose ps

# Test HTTPS
echo ""
echo "Testing HTTPS..."
if curl -k -s -o /dev/null -w "%{http_code}" https://localhost | grep -q "200\|301\|302"; then
    echo "✓ HTTPS is working!"
else
    echo "! HTTPS check returned unexpected status"
    echo "Check logs: docker compose logs frontend"
fi

echo ""
echo "==================================="
echo "Deployment Complete!"
echo "==================================="
echo ""
echo "Access your site at: https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f          # View all logs"
echo "  docker compose logs -f frontend # View frontend logs"
echo "  docker compose ps               # Check container status"
echo "  docker compose restart frontend # Restart frontend"
echo ""
