#!/bin/bash

# ILA Webapp Docker Setup Script
# This script sets up the ILA webapp with Docker

set -e  # Exit on any error

echo "🦉 ILA Webapp Docker Setup"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://www.docker.com/get-started"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${BLUE}ℹ️  You can edit .env file to customize configuration${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Create backend package-lock if pnpm-lock exists
if [ -f "backend/package.json" ] && [ ! -f "backend/pnpm-lock.yaml" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v npm &> /dev/null; then
        npm install
    else
        echo -e "${RED}❌ Neither pnpm nor npm found. Please install one of them.${NC}"
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
fi

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping any existing containers...${NC}"
docker-compose down 2>/dev/null || true

# Build and start containers
echo -e "${YELLOW}🏗️  Building and starting containers...${NC}"
docker-compose up --build -d

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
while ! docker-compose exec -T postgres pg_isready -U ila_user > /dev/null 2>&1; do
    echo -e "${YELLOW}.${NC}" -n
    sleep 1
done
echo

# Check if services are running
echo -e "${YELLOW}🔍 Checking service status...${NC}"
sleep 5

if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API is running${NC}"
else
    echo -e "${RED}❌ Backend API is not responding${NC}"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is not responding${NC}"
fi

echo -e "\n${GREEN}🎉 Setup completed successfully!${NC}"
echo
echo -e "${BLUE}📱 Access your application:${NC}"
echo -e "   Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "   Backend:  ${BLUE}http://localhost:3001${NC}"
echo -e "   pgAdmin:  ${BLUE}http://localhost:5050${NC} (optional)"
echo
echo -e "${BLUE}🔐 Default login credentials:${NC}"
echo -e "   Admin:      admin@ila.com / admin123"
echo -e "   Instructor: instructor@ila.com / instructor123"
echo -e "   Student:    student1@ila.com / student123"
echo
echo -e "${BLUE}📋 Useful commands:${NC}"
echo -e "   View logs:        ${YELLOW}docker-compose logs -f${NC}"
echo -e "   Stop services:    ${YELLOW}docker-compose down${NC}"
echo -e "   Restart services: ${YELLOW}docker-compose restart${NC}"
echo -e "   Update services:  ${YELLOW}docker-compose up --build${NC}"
echo
echo -e "${GREEN}Happy coding! 🚀${NC}"
