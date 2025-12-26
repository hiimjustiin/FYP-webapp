#!/bin/bash

# =============================================================================
# GitHub Secrets Setup Helper
# =============================================================================
# This script helps you generate the required secrets for GitHub Actions
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}GitHub Secrets Setup Helper${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if required tools are installed
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: openssl is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}Generating secrets for GitHub Actions...${NC}"
echo ""

# 1. EC2_SSH_KEY
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}1. EC2_SSH_KEY${NC}"
echo -e "${YELLOW}============================================${NC}"
if [ -f "ila-pk.pem" ]; then
    echo -e "${GREEN}✓ PEM key found: ila-pk.pem${NC}"
    echo ""
    echo "Copy the following content as EC2_SSH_KEY secret:"
    echo -e "${BLUE}--- START COPYING FROM NEXT LINE ---${NC}"
    cat ila-pk.pem
    echo -e "${BLUE}--- END COPYING AT PREVIOUS LINE ---${NC}"
else
    echo -e "${RED}✗ PEM key not found at ./ila-pk.pem${NC}"
    echo "Please ensure ila-pk.pem is in the project root"
fi

echo ""
echo -e "${GREEN}Press Enter to continue...${NC}"
read

# 2. POSTGRES_PASSWORD
echo ""
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}2. POSTGRES_PASSWORD${NC}"
echo -e "${YELLOW}============================================${NC}"
POSTGRES_PASSWORD=$(openssl rand -base64 20 | tr -d "=+/" | cut -c1-20)
echo -e "${GREEN}Generated secure password:${NC}"
echo -e "${BLUE}$POSTGRES_PASSWORD${NC}"
echo ""
echo "Copy this as POSTGRES_PASSWORD secret"

echo ""
echo -e "${GREEN}Press Enter to continue...${NC}"
read

# 3. JWT_SECRET
echo ""
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}3. JWT_SECRET${NC}"
echo -e "${YELLOW}============================================${NC}"
JWT_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}Generated JWT secret:${NC}"
echo -e "${BLUE}$JWT_SECRET${NC}"
echo ""
echo "Copy this as JWT_SECRET secret"

echo ""
echo -e "${GREEN}Press Enter to continue...${NC}"
read

# Summary
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Summary - Add these to GitHub Secrets${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Go to: https://github.com/ntu-dsair/ila-webapp/settings/secrets/actions"
echo ""
echo -e "${YELLOW}Secret Name: EC2_SSH_KEY${NC}"
echo "Value: (contents of ila-pk.pem shown above)"
echo ""
echo -e "${YELLOW}Secret Name: POSTGRES_PASSWORD${NC}"
echo -e "Value: ${BLUE}$POSTGRES_PASSWORD${NC}"
echo ""
echo -e "${YELLOW}Secret Name: JWT_SECRET${NC}"
echo -e "Value: ${BLUE}$JWT_SECRET${NC}"
echo ""

# Save to file for reference (optional)
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}Save secrets to file?${NC}"
echo -e "${YELLOW}============================================${NC}"
echo "Would you like to save these secrets to a file for reference?"
echo -e "${RED}WARNING: This file will contain sensitive data!${NC}"
echo "Save to .github-secrets.txt? (y/N)"
read -r SAVE_TO_FILE

if [[ "$SAVE_TO_FILE" =~ ^[Yy]$ ]]; then
    cat > .github-secrets.txt << EOF
# GitHub Secrets for ila-webapp
# Generated: $(date)
# 
# IMPORTANT: Delete this file after adding secrets to GitHub!
# This file is in .gitignore and should NEVER be committed.

1. EC2_SSH_KEY
--------------
(Copy contents of ila-pk.pem)

2. POSTGRES_PASSWORD
--------------------
$POSTGRES_PASSWORD

3. JWT_SECRET
-------------
$JWT_SECRET

Instructions:
1. Go to: https://github.com/ntu-dsair/ila-webapp/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret with the name and value above
4. Delete this file after adding secrets: rm .github-secrets.txt
EOF
    
    chmod 600 .github-secrets.txt
    echo -e "${GREEN}✓ Secrets saved to .github-secrets.txt${NC}"
    echo -e "${RED}⚠️  Remember to delete this file after use!${NC}"
    echo -e "${RED}    Run: rm .github-secrets.txt${NC}"
else
    echo -e "${GREEN}Secrets not saved to file${NC}"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Next Steps${NC}"
echo -e "${GREEN}============================================${NC}"
echo "1. Add the three secrets to GitHub"
echo "2. Update .env on EC2 with the same values"
echo "3. Push to main branch to trigger deployment"
echo ""
echo -e "${BLUE}GitHub Secrets URL:${NC}"
echo "https://github.com/ntu-dsair/ila-webapp/settings/secrets/actions"
echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
