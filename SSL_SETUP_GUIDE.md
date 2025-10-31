# SSL/HTTPS Setup Guide for Single EC2 Instance

## Overview

This guide configures SSL/HTTPS for `ila-analytics.rdc.nie.edu.sg` (13.229.1.151) using **Let's Encrypt** with **Certbot** on a single EC2 instance without a load balancer.

## Prerequisites

✅ Domain: `ila-analytics.rdc.nie.edu.sg`  
✅ DNS A Record: Points to `13.229.1.151`  
✅ EC2 Security Group: Port 80 (HTTP) and 443 (HTTPS) open  

---

## Step 1: Verify DNS Configuration

Before starting, confirm your domain resolves correctly:

```bash
# From your local machine
nslookup ila-analytics.rdc.nie.edu.sg

# Should return: 13.229.1.151
```

---

## Step 2: Update EC2 Security Group

In AWS Console → EC2 → Security Groups:

| Type  | Protocol | Port | Source    | Description |
|-------|----------|------|-----------|-------------|
| HTTP  | TCP      | 80   | 0.0.0.0/0 | HTTP (required for Let's Encrypt validation) |
| HTTPS | TCP      | 443  | 0.0.0.0/0 | HTTPS |
| SSH   | TCP      | 22   | Your IP   | SSH access |

**Important:** Port 80 MUST be open for Let's Encrypt certificate validation.

---

## Step 3: SSH to EC2 and Install Certbot

```bash
# SSH to your EC2 instance
ssh -i ila-pk.pem ec2-user@13.229.1.151

# Update system
sudo dnf update -y

# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx
```

---

## Step 4: Stop Current Docker Containers

We need to free up port 80 temporarily for Let's Encrypt validation:

```bash
cd ~/ila-webapp

# Stop all containers
docker compose down
```

---

## Step 5: Obtain SSL Certificate

```bash
# Run Certbot in standalone mode
sudo certbot certonly --standalone \
  -d ila-analytics.rdc.nie.edu.sg \
  --email your-email@nie.edu.sg \
  --agree-tos \
  --non-interactive

# Your certificates will be saved at:
# /etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/fullchain.pem
# /etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/privkey.pem
```

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/privkey.pem
```

---

## Step 6: Update Nginx Configuration

The new `nginx-ssl.conf` file (included in repo) configures:
- HTTP → HTTPS redirect
- SSL certificate paths
- Proxy to backend API
- Security headers

---

## Step 7: Update Docker Compose for SSL

The updated `docker-compose.yml` will:
- Mount SSL certificates into the frontend container
- Expose port 443 (HTTPS)
- Use the new `nginx-ssl.conf`

---

## Step 8: Deploy with SSL

```bash
cd ~/ila-webapp

# Pull latest changes (includes new nginx-ssl.conf)
git pull origin main

# Update environment variables
nano .env
# Set: CORS_ORIGIN=https://ila-analytics.rdc.nie.edu.sg
# Set: VITE_API_BASE_URL=https://ila-analytics.rdc.nie.edu.sg/api

# Rebuild and restart with SSL
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Verify containers are running
docker compose ps
```

---

## Step 9: Set Up Auto-Renewal

Let's Encrypt certificates expire every 90 days. Set up automatic renewal:

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Create renewal script
sudo tee /usr/local/bin/renew-ssl.sh > /dev/null << 'EOF'
#!/bin/bash
set -e

echo "$(date): Starting SSL renewal process..."

# Stop containers to free port 80
cd ~/ila-webapp
docker compose down

# Renew certificate
certbot renew --standalone --quiet

# Restart containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "$(date): SSL renewal completed successfully"
EOF

# Make executable
sudo chmod +x /usr/local/bin/renew-ssl.sh

# Add to crontab (runs weekly on Sunday at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -

# Verify crontab
crontab -l
```

---

## Step 10: Verify HTTPS is Working

### From Browser
Visit: https://ila-analytics.rdc.nie.edu.sg

### From Command Line
```bash
# Test HTTPS
curl -I https://ila-analytics.rdc.nie.edu.sg

# Verify SSL certificate
echo | openssl s_client -servername ila-analytics.rdc.nie.edu.sg -connect ila-analytics.rdc.nie.edu.sg:443 2>/dev/null | openssl x509 -noout -dates

# Test API endpoint
curl https://ila-analytics.rdc.nie.edu.sg/api/health
```

---

## Troubleshooting

### Certificate Validation Failed

**Error:** `Failed authorization procedure`

**Solution:**
1. Verify DNS: `nslookup ila-analytics.rdc.nie.edu.sg` returns `13.229.1.151`
2. Check Security Group: Port 80 is open to `0.0.0.0/0`
3. Ensure no other service is using port 80: `sudo netstat -tulpn | grep :80`

### Container Won't Start

```bash
# Check logs
docker compose logs frontend

# Verify certificate files exist
sudo ls -la /etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/

# Check Nginx syntax
docker compose exec frontend nginx -t
```

### HTTPS Not Working

```bash
# Check if port 443 is listening
sudo netstat -tulpn | grep :443

# Check frontend logs
docker compose logs frontend

# Verify certificate permissions
sudo chmod 755 /etc/letsencrypt/live/
sudo chmod 755 /etc/letsencrypt/archive/
```

### HTTP Still Accessible

This is normal! HTTP (port 80) redirects to HTTPS (port 443). Test:
```bash
curl -I http://ila-analytics.rdc.nie.edu.sg
# Should return: 301 Moved Permanently
# Location: https://ila-analytics.rdc.nie.edu.sg
```

---

## Manual Certificate Renewal

If automatic renewal fails:

```bash
# Stop containers
cd ~/ila-webapp
docker compose down

# Renew certificate
sudo certbot renew --standalone

# Restart containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify renewal
sudo certbot certificates
```

---

## Certificate Information

```bash
# View certificate details
sudo certbot certificates

# Check expiry date
sudo openssl x509 -in /etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/fullchain.pem -noout -dates

# List all certificates
sudo ls -la /etc/letsencrypt/live/
```

---

## Security Best Practices

### 1. Strong SSL Configuration
The `nginx-ssl.conf` includes:
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS (HTTP Strict Transport Security)
- Security headers (X-Frame-Options, X-Content-Type-Options)

### 2. Regular Updates
```bash
# Update system monthly
sudo dnf update -y

# Update Docker images
cd ~/ila-webapp
docker compose pull
docker compose up -d --build
```

### 3. Monitor Certificate Expiry
```bash
# Add to crontab for weekly email alerts
(crontab -l 2>/dev/null; echo "0 9 * * 1 certbot certificates | mail -s 'SSL Certificate Status' your-email@nie.edu.sg") | crontab -
```

---

## Architecture Diagram

```
                    Internet
                        │
                        ▼
              Port 80 (HTTP) ────────┐
                        │            │
                        ▼            │ 301 Redirect
              Port 443 (HTTPS)       │
                        │            │
                        ▼            ▼
              ┌─────────────────────────┐
              │   Nginx (SSL/TLS)       │
              │   - Terminates SSL      │
              │   - Serves React app    │
              │   - Proxies to backend  │
              └─────────────────────────┘
                        │
                        ▼
              ┌─────────────────────────┐
              │   Backend (Express)     │
              │   Port 3001 (internal)  │
              └─────────────────────────┘
                        │
                        ▼
              ┌─────────────────────────┐
              │   PostgreSQL            │
              │   Port 5432 (internal)  │
              └─────────────────────────┘
```

---

## Environment Variables Update

After SSL setup, update `.env` on EC2:

```env
# Frontend
CORS_ORIGIN=https://ila-analytics.rdc.nie.edu.sg
VITE_API_BASE_URL=https://ila-analytics.rdc.nie.edu.sg/api

# Backend
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=postgresql://ila_user:your_password@postgres:5432/ila_db
```

---

## Quick Reference Commands

```bash
# View certificate status
sudo certbot certificates

# Test renewal (dry run)
sudo certbot renew --dry-run

# Manual renewal
sudo /usr/local/bin/renew-ssl.sh

# Check HTTPS is working
curl -I https://ila-analytics.rdc.nie.edu.sg

# View renewal logs
sudo tail -f /var/log/ssl-renewal.log

# Restart containers
cd ~/ila-webapp
docker compose restart frontend
```

---

## Important Notes

1. **Let's Encrypt Rate Limits:** 
   - 50 certificates per domain per week
   - 5 duplicate certificates per week
   - Test with `--dry-run` flag first

2. **Certificate Validity:**
   - Let's Encrypt certificates are valid for 90 days
   - Auto-renewal runs 30 days before expiry
   - Manual renewal can be done anytime

3. **Port Requirements:**
   - Port 80 required for initial validation and renewals
   - Port 443 for HTTPS traffic
   - Backend port 3001 only accessible internally

4. **ACM Certificates:**
   - Your existing ACM certificate cannot be used on EC2 directly
   - ACM is only for use with ELB, CloudFront, or API Gateway
   - You can keep it for future use if you add a load balancer

---

## Migration from ACM (Future)

If you later add an Application Load Balancer:

1. Create ALB in AWS Console
2. Attach your ACM certificate to ALB
3. Point ALB to EC2 instance
4. Update DNS to point to ALB
5. Remove Let's Encrypt certificate from EC2
6. Nginx only needs HTTP (ALB handles SSL termination)

---

## Support

Certificate issues: https://community.letsencrypt.org/  
Certbot documentation: https://certbot.eff.org/docs/  
Nginx SSL guide: https://nginx.org/en/docs/http/configuring_https_servers.html
