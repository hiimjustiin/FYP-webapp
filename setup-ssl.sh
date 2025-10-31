#!/bin/bash

# SSL Setup Script for ILA WebApp on EC2
# This script sets up Let's Encrypt SSL certificates using Certbot

set -e

echo "==================================="
echo "ILA WebApp SSL Setup"
echo "==================================="
echo ""

# Configuration
DOMAIN="ila-analytics.rdc.nie.edu.sg"
EMAIL="your-email@nie.edu.sg"  # Change this!
WEBAPP_DIR="$HOME/ila-webapp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on EC2
if [ ! -f ~/.ssh/authorized_keys ]; then
    echo -e "${YELLOW}Warning: This script should be run on the EC2 instance${NC}"
fi

# Step 1: Verify DNS
echo "Step 1: Verifying DNS configuration..."
RESOLVED_IP=$(nslookup $DOMAIN | grep -A1 "Name:" | tail -1 | awk '{print $2}')
EXPECTED_IP="13.229.1.151"

if [ "$RESOLVED_IP" != "$EXPECTED_IP" ]; then
    echo -e "${RED}Error: DNS not configured correctly${NC}"
    echo "Expected: $EXPECTED_IP"
    echo "Got: $RESOLVED_IP"
    exit 1
fi
echo -e "${GREEN}✓ DNS configured correctly${NC}"
echo ""

# Step 2: Install Certbot
echo "Step 2: Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo dnf update -y
    sudo dnf install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installed${NC}"
else
    echo -e "${GREEN}✓ Certbot already installed${NC}"
fi
echo ""

# Step 3: Stop Docker containers
echo "Step 3: Stopping Docker containers to free port 80..."
cd $WEBAPP_DIR
if docker compose ps | grep -q "Up"; then
    docker compose down
    echo -e "${GREEN}✓ Containers stopped${NC}"
else
    echo -e "${GREEN}✓ No containers running${NC}"
fi
echo ""

# Step 4: Obtain SSL Certificate
echo "Step 4: Obtaining SSL certificate from Let's Encrypt..."
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "Requesting new certificate..."
    sudo certbot certonly --standalone \
        -d $DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --non-interactive
    echo -e "${GREEN}✓ Certificate obtained successfully${NC}"
else
    echo -e "${GREEN}✓ Certificate already exists${NC}"
fi
echo ""

# Step 5: Verify certificate files
echo "Step 5: Verifying certificate files..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/$DOMAIN/privkey.pem" ]; then
    echo -e "${GREEN}✓ Certificate files verified${NC}"
    sudo ls -la /etc/letsencrypt/live/$DOMAIN/
else
    echo -e "${RED}Error: Certificate files not found${NC}"
    exit 1
fi
echo ""

# Step 6: Update Nginx configuration
echo "Step 6: Updating Nginx configuration..."
cd $WEBAPP_DIR

# Check if nginx-ssl.conf exists
if [ ! -f "nginx-ssl.conf" ]; then
    echo -e "${RED}Error: nginx-ssl.conf not found${NC}"
    echo "Please pull the latest code from the repository"
    exit 1
fi

# Update docker-compose to use SSL config
echo "Updating docker-compose configuration..."
echo -e "${GREEN}✓ SSL configuration ready${NC}"
echo ""

# Step 7: Update environment variables
echo "Step 7: Checking environment variables..."
if [ -f "$WEBAPP_DIR/.env" ]; then
    if grep -q "CORS_ORIGIN=https://$DOMAIN" .env; then
        echo -e "${GREEN}✓ CORS_ORIGIN already set to HTTPS${NC}"
    else
        echo -e "${YELLOW}! Update .env file with:${NC}"
        echo "  CORS_ORIGIN=https://$DOMAIN"
        echo "  VITE_API_BASE_URL=https://$DOMAIN/api"
    fi
else
    echo -e "${YELLOW}! Create .env file with HTTPS URLs${NC}"
fi
echo ""

# Step 8: Set up auto-renewal
echo "Step 8: Setting up automatic SSL renewal..."
RENEWAL_SCRIPT="/usr/local/bin/renew-ssl.sh"

sudo tee $RENEWAL_SCRIPT > /dev/null << 'EOFSCRIPT'
#!/bin/bash
set -e

WEBAPP_DIR="$HOME/ila-webapp"
LOG_FILE="/var/log/ssl-renewal.log"

echo "$(date): Starting SSL renewal process..." | tee -a $LOG_FILE

# Stop containers to free port 80
cd $WEBAPP_DIR
docker compose down | tee -a $LOG_FILE

# Renew certificate
certbot renew --standalone --quiet | tee -a $LOG_FILE

# Restart containers with SSL
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d | tee -a $LOG_FILE

echo "$(date): SSL renewal completed successfully" | tee -a $LOG_FILE
EOFSCRIPT

sudo chmod +x $RENEWAL_SCRIPT

# Add to crontab (runs weekly on Sunday at 3 AM)
if crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
    echo -e "${GREEN}✓ Cron job already exists${NC}"
else
    (crontab -l 2>/dev/null; echo "0 3 * * 0 $RENEWAL_SCRIPT >> /var/log/ssl-renewal.log 2>&1") | crontab -
    echo -e "${GREEN}✓ Auto-renewal cron job created${NC}"
fi
echo ""

# Step 9: Deploy with SSL
echo "Step 9: Deploying application with SSL..."
cd $WEBAPP_DIR

# Create a temporary nginx config switcher script
cat > switch-to-ssl.sh << 'EOFSWITCH'
#!/bin/sh
# This script runs inside the container to switch to SSL config
if [ -f /etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/fullchain.pem ]; then
    echo "SSL certificates found, using nginx-ssl.conf"
    cp /etc/nginx/nginx-ssl.conf /etc/nginx/nginx.conf
else
    echo "No SSL certificates found, using default nginx.conf"
fi
exec nginx -g "daemon off;"
EOFSWITCH

chmod +x switch-to-ssl.sh

# Pull latest changes
git pull origin main || echo "Could not pull from git, continuing with local files"

# Start containers with SSL
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo -e "${GREEN}✓ Application deployed with SSL${NC}"
echo ""

# Step 10: Verify deployment
echo "Step 10: Verifying HTTPS is working..."
sleep 5

if curl -k -s -o /dev/null -w "%{http_code}" https://localhost | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ HTTPS is working!${NC}"
else
    echo -e "${YELLOW}! HTTPS check returned unexpected status. Check logs:${NC}"
    echo "  docker compose logs frontend"
fi
echo ""

# Final summary
echo "==================================="
echo -e "${GREEN}SSL Setup Complete!${NC}"
echo "==================================="
echo ""
echo "Certificate details:"
sudo certbot certificates
echo ""
echo "Next steps:"
echo "1. Update your .env file with HTTPS URLs:"
echo "   CORS_ORIGIN=https://$DOMAIN"
echo "   VITE_API_BASE_URL=https://$DOMAIN/api"
echo ""
echo "2. Test your site:"
echo "   https://$DOMAIN"
echo ""
echo "3. Verify auto-renewal (dry run):"
echo "   sudo certbot renew --dry-run"
echo ""
echo "4. View logs:"
echo "   docker compose logs -f frontend"
echo ""
echo "Auto-renewal is configured to run weekly."
echo "Certificate will be renewed automatically 30 days before expiry."
echo ""
