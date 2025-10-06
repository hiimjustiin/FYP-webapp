#!/bin/bash

# =============================================================================
# Backend Diagnostics Script for AWS EC2
# =============================================================================
# Run this script on your EC2 instance to diagnose backend issues
# Usage: ssh -i ila-pk.pem ec2-user@13.212.19.144 'bash -s' < diagnose-backend.sh
# =============================================================================

set +e  # Don't exit on errors, we want to see all diagnostics

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Backend Diagnostics - ILA WebApp${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check 1: Docker running
echo -e "${YELLOW}[1] Checking if Docker is running...${NC}"
if systemctl is-active --quiet docker; then
    echo -e "${GREEN}✓ Docker service is running${NC}"
else
    echo -e "${RED}✗ Docker service is NOT running${NC}"
    echo "  Fix: sudo systemctl start docker"
fi
echo ""

# Check 2: Navigate to app directory
echo -e "${YELLOW}[2] Checking application directory...${NC}"
if [ -d "/home/ec2-user/ila-webapp" ]; then
    echo -e "${GREEN}✓ Application directory exists${NC}"
    cd /home/ec2-user/ila-webapp
else
    echo -e "${RED}✗ Application directory NOT found${NC}"
    echo "  Expected: /home/ec2-user/ila-webapp"
    exit 1
fi
echo ""

# Check 3: Container status
echo -e "${YELLOW}[3] Checking container status...${NC}"
CONTAINERS=$(sudo docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}")
echo "$CONTAINERS"
echo ""

BACKEND_STATUS=$(sudo docker compose ps backend --format "{{.Status}}" 2>/dev/null)
if [[ "$BACKEND_STATUS" == *"Up"* ]]; then
    echo -e "${GREEN}✓ Backend container is running${NC}"
else
    echo -e "${RED}✗ Backend container is NOT running${NC}"
    echo "  Status: $BACKEND_STATUS"
fi
echo ""

# Check 4: Backend logs (last 20 lines)
echo -e "${YELLOW}[4] Backend logs (last 20 lines)...${NC}"
echo -e "${BLUE}--------------------------------------------${NC}"
sudo docker compose logs --tail=20 backend
echo -e "${BLUE}--------------------------------------------${NC}"
echo ""

# Check 5: Port listening
echo -e "${YELLOW}[5] Checking if backend port (3001) is listening...${NC}"
if sudo netstat -tulpn 2>/dev/null | grep -q ":3001"; then
    echo -e "${GREEN}✓ Port 3001 is listening${NC}"
    sudo netstat -tulpn | grep ":3001"
elif sudo ss -tulpn 2>/dev/null | grep -q ":3001"; then
    echo -e "${GREEN}✓ Port 3001 is listening${NC}"
    sudo ss -tulpn | grep ":3001"
else
    echo -e "${RED}✗ Port 3001 is NOT listening${NC}"
    echo "  Backend is not accepting connections"
fi
echo ""

# Check 6: Environment file
echo -e "${YELLOW}[6] Checking .env file...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    echo "  Checking critical variables..."
    
    if grep -q "POSTGRES_PASSWORD" .env; then
        echo -e "  ${GREEN}✓${NC} POSTGRES_PASSWORD is set"
    else
        echo -e "  ${RED}✗${NC} POSTGRES_PASSWORD is missing"
    fi
    
    if grep -q "JWT_SECRET" .env; then
        echo -e "  ${GREEN}✓${NC} JWT_SECRET is set"
    else
        echo -e "  ${RED}✗${NC} JWT_SECRET is missing"
    fi
    
    if grep -q "DATABASE_URL" .env; then
        echo -e "  ${GREEN}✓${NC} DATABASE_URL is set"
    else
        echo -e "  ${RED}✗${NC} DATABASE_URL is missing"
    fi
else
    echo -e "${RED}✗ .env file NOT found${NC}"
    echo "  Backend cannot start without environment variables"
fi
echo ""

# Check 7: Database connectivity
echo -e "${YELLOW}[7] Checking database connectivity...${NC}"
POSTGRES_STATUS=$(sudo docker compose ps postgres --format "{{.Status}}" 2>/dev/null)
if [[ "$POSTGRES_STATUS" == *"Up"* ]]; then
    echo -e "${GREEN}✓ PostgreSQL container is running${NC}"
    
    # Try to connect to database
    if sudo docker compose exec -T postgres pg_isready -U ila_user &>/dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is accepting connections${NC}"
    else
        echo -e "${YELLOW}⚠ PostgreSQL is running but not ready yet${NC}"
    fi
else
    echo -e "${RED}✗ PostgreSQL container is NOT running${NC}"
    echo "  Status: $POSTGRES_STATUS"
fi
echo ""

# Check 8: Test backend endpoint from inside EC2
echo -e "${YELLOW}[8] Testing backend endpoint (localhost)...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Backend health endpoint responding (HTTP $HTTP_CODE)${NC}"
    curl -s http://localhost:3001/health | jq . 2>/dev/null || curl -s http://localhost:3001/health
else
    echo -e "${RED}✗ Backend health endpoint NOT responding (HTTP $HTTP_CODE)${NC}"
    echo "  Tried: http://localhost:3001/health"
fi
echo ""

# Check 9: Network connectivity
echo -e "${YELLOW}[9] Checking Docker network...${NC}"
if sudo docker network ls | grep -q "ila-network"; then
    echo -e "${GREEN}✓ Docker network 'ila-network' exists${NC}"
else
    echo -e "${RED}✗ Docker network 'ila-network' NOT found${NC}"
fi
echo ""

# Check 10: Disk space
echo -e "${YELLOW}[10] Checking disk space...${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "${GREEN}✓ Disk space OK (${DISK_USAGE}% used)${NC}"
else
    echo -e "${RED}✗ Low disk space (${DISK_USAGE}% used)${NC}"
    echo "  Consider cleaning up Docker images: sudo docker system prune -a"
fi
echo ""

# Summary and recommendations
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Summary & Recommendations${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

if [[ "$BACKEND_STATUS" != *"Up"* ]]; then
    echo -e "${RED}❌ BACKEND IS NOT RUNNING${NC}"
    echo ""
    echo "Recommended fixes:"
    echo "1. Check backend logs for errors:"
    echo "   sudo docker compose logs backend"
    echo ""
    echo "2. Restart the backend:"
    echo "   sudo docker compose restart backend"
    echo ""
    echo "3. If still not working, rebuild and restart:"
    echo "   sudo docker compose down"
    echo "   sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
elif [ "$HTTP_CODE" != "200" ]; then
    echo -e "${YELLOW}⚠️  BACKEND RUNNING BUT NOT RESPONDING${NC}"
    echo ""
    echo "Recommended fixes:"
    echo "1. Check backend logs:"
    echo "   sudo docker compose logs -f backend"
    echo ""
    echo "2. Verify environment variables:"
    echo "   cat .env"
    echo ""
    echo "3. Restart backend:"
    echo "   sudo docker compose restart backend"
else
    echo -e "${GREEN}✅ BACKEND APPEARS TO BE WORKING${NC}"
    echo ""
    echo "If registration still fails:"
    echo "1. Check EC2 Security Group allows port 3001"
    echo "2. Test from outside: curl http://13.212.19.144:3001/health"
    echo "3. Check browser console for CORS errors"
    echo "4. Verify API endpoint in frontend: VITE_API_BASE_URL"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo "For real-time logs, run:"
echo "  sudo docker compose logs -f backend"
echo ""
echo "To restart all services:"
echo "  sudo docker compose restart"
echo -e "${BLUE}============================================${NC}"
