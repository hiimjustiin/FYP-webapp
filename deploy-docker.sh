#!/bin/bash

# =============================================================================
# Docker-based Deployment Script for AWS EC2
# =============================================================================
# This script deploys the Dockerized application to EC2
# Replaces the previous PM2-based deployment
# =============================================================================

set -e  # Exit on any error

# Configuration
EC2_HOST="13.212.19.144"
EC2_USER="ec2-user"
PEM_KEY="./ila-pk.pem"
DEPLOY_PATH="/home/ec2-user/ila-webapp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
}

# Check if PEM key exists
if [ ! -f "$PEM_KEY" ]; then
    log_error "PEM key not found at $PEM_KEY"
    exit 1
fi

# Set correct permissions for PEM key
chmod 400 "$PEM_KEY"
log_info "PEM key permissions set to 400"

# Test SSH connection
log_info "Testing SSH connection to $EC2_USER@$EC2_HOST..."
if ! ssh -i "$PEM_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'Connection successful'"; then
    log_error "Cannot connect to EC2 instance"
    exit 1
fi
log_info "SSH connection successful"

# Deploy function
deploy() {
    log_info "Starting Docker-based deployment to EC2 instance..."

    ssh -i "$PEM_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" bash << 'ENDSSH'
set -e

echo "============================================"
echo "Step 1: System Updates"
echo "============================================"
sudo dnf update -y

echo ""
echo "============================================"
echo "Step 2: Install Docker"
echo "============================================"
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo dnf install -y docker
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker ec2-user
    echo "Docker installed successfully"
else
    echo "Docker already installed: $(docker --version)"
    # Ensure Docker is running
    sudo systemctl start docker || true
fi

echo ""
echo "============================================"
echo "Step 3: Install Docker Compose"
echo "============================================"
if ! command -v docker compose &> /dev/null; then
    echo "Installing Docker Compose..."
    # Docker Compose V2 is included with Docker, but ensure it's available
    sudo dnf install -y docker-compose-plugin
    echo "Docker Compose installed successfully"
else
    echo "Docker Compose already installed: $(docker compose version)"
fi

echo ""
echo "============================================"
echo "Step 4: Install Git"
echo "============================================"
if ! command -v git &> /dev/null; then
    sudo dnf install -y git
    echo "Git installed successfully"
else
    echo "Git already installed: $(git --version)"
fi

echo ""
echo "============================================"
echo "Step 5: Create deployment directory"
echo "============================================"
mkdir -p /home/ec2-user/ila-webapp
cd /home/ec2-user/ila-webapp
echo "Deployment directory ready"

echo ""
echo "============================================"
echo "Step 6: Clone or update repository"
echo "============================================"
if [ -d ".git" ]; then
    echo "Repository exists, pulling latest changes..."
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    echo "Cloning repository..."
    # For private repos, you need to set up SSH keys or use personal access token
    git clone https://github.com/ntu-dsair/ila-webapp.git . || {
        echo "Clone failed. For private repos, please configure authentication."
        exit 1
    }
fi

echo ""
echo "============================================"
echo "Step 7: Set up environment variables"
echo "============================================"
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Database Configuration
POSTGRES_DB=ila_db
POSTGRES_USER=ila_user
POSTGRES_PASSWORD=ila_secure_password_2025
POSTGRES_PORT=5432

# Application Configuration
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://13.212.19.144:3000

# Port Configuration
FRONTEND_PORT=3000
BACKEND_PORT=3001

# Production Database URL
DATABASE_URL=postgresql://ila_user:ila_secure_password_2025@postgres:5432/ila_db

# API Base URL
VITE_API_BASE_URL=http://13.212.19.144:3001/api
EOF
    echo "⚠️  IMPORTANT: Update .env with secure production values!"
else
    echo ".env file already exists"
fi

echo ""
echo "============================================"
echo "Step 8: Stop existing containers"
echo "============================================"
docker compose -f docker-compose.yml -f docker-compose.prod.yml down || true

echo ""
echo "============================================"
echo "Step 9: Build Docker images"
echo "============================================"
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

echo ""
echo "============================================"
echo "Step 10: Start containers"
echo "============================================"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo ""
echo "============================================"
echo "Step 11: Clean up old images"
echo "============================================"
docker image prune -f

echo ""
echo "============================================"
echo "Step 12: Verify deployment"
echo "============================================"
echo "Container status:"
docker compose ps

echo ""
echo "Waiting for services to start..."
sleep 5

echo ""
echo "Container logs (last 10 lines):"
docker compose logs --tail=10

echo ""
echo "============================================"
echo "✅ Deployment completed successfully!"
echo "============================================"
echo "Frontend: http://13.212.19.144:3000"
echo "Backend API: http://13.212.19.144:3001"
echo ""
echo "Useful commands:"
echo "  docker compose ps                    - Check container status"
echo "  docker compose logs -f               - View live logs"
echo "  docker compose logs -f backend       - View backend logs"
echo "  docker compose logs -f frontend      - View frontend logs"
echo "  docker compose restart               - Restart all containers"
echo "  docker compose down                  - Stop all containers"
echo "  docker compose up -d                 - Start all containers"
echo "============================================"

ENDSSH
}

# Run deployment
log_step "Initiating Docker-based deployment..."
deploy

log_info "Deployment script completed!"
log_info ""
log_info "Your application should now be running on:"
log_info "  - Frontend: http://$EC2_HOST:3000"
log_info "  - Backend: http://$EC2_HOST:3001/api"
log_info "  - Database: PostgreSQL (internal to Docker network)"
log_info ""
log_warn "Post-deployment checklist:"
log_warn "  1. SSH to EC2 and update .env with secure production values"
log_warn "  2. Verify EC2 Security Groups allow ports 3000, 3001"
log_warn "  3. Check container status: docker compose ps"
log_warn "  4. View logs: docker compose logs -f"
log_warn "  5. Set up domain and SSL for production"
