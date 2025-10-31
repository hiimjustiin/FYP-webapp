# SSL Implementation Summary

## Decision: Use Let's Encrypt (Not ACM)

**Why?**
- You have a **single EC2 instance** without an Application Load Balancer (ALB)
- **AWS Certificate Manager (ACM)** certificates can ONLY be used with:
  - Application/Network Load Balancers
  - CloudFront distributions
  - API Gateway
  - NOT directly on EC2 instances

**Solution: Let's Encrypt with Certbot**
- Free SSL certificates (valid 90 days, auto-renewable)
- Works directly on EC2 instances
- Industry standard with excellent support
- Automatic renewal via cron job

---

## What Was Created

### 1. Configuration Files

- **`nginx-ssl.conf`** - Nginx configuration with SSL/HTTPS support
  - HTTP → HTTPS redirect (port 80 → 443)
  - SSL certificate paths for Let's Encrypt
  - Security headers (HSTS, X-Frame-Options, etc.)
  - Strong TLS 1.2/1.3 configuration

### 2. Setup Scripts

- **`setup-ssl.sh`** - Complete SSL setup automation
  - Verifies DNS configuration
  - Installs Certbot
  - Obtains SSL certificate from Let's Encrypt
  - Sets up auto-renewal cron job
  - Deploys application with HTTPS

- **`deploy-with-ssl.sh`** - Quick deployment with existing SSL
  - Updates environment variables to HTTPS
  - Rebuilds and restarts containers with SSL
  - Verifies HTTPS is working

### 3. Docker Updates

- **`Dockerfile`** - Updated to support SSL
  - Includes both HTTP and HTTPS configurations
  - Auto-detects SSL certificates on startup
  - Switches to SSL config if certificates exist
  - Exposes both port 80 (HTTP) and 443 (HTTPS)

- **`docker-compose.yml`** - Updated for SSL support
  - Mounts `/etc/letsencrypt` directory (read-only)
  - Exposes port 443 for HTTPS
  - Supports both HTTP and HTTPS modes

### 4. Documentation

- **`SSL_SETUP_GUIDE.md`** - Complete implementation guide
  - Step-by-step SSL setup instructions
  - Troubleshooting section
  - Auto-renewal configuration
  - Security best practices
  - Command reference

---

## Implementation Steps (Run on EC2)

### Step 1: SSH to EC2
```bash
ssh -i ila-pk.pem ec2-user@13.229.1.151
```

### Step 2: Pull Latest Code
```bash
cd ~/ila-webapp
git pull origin main
```

### Step 3: Update Email in Script
```bash
nano setup-ssl.sh
# Change: EMAIL="your-email@nie.edu.sg"
# To your actual NIE email address
```

### Step 4: Run SSL Setup
```bash
./setup-ssl.sh
```

This script will:
1. ✅ Verify DNS points to your EC2 IP (13.229.1.151)
2. ✅ Install Certbot
3. ✅ Stop Docker containers
4. ✅ Obtain SSL certificate from Let's Encrypt
5. ✅ Set up auto-renewal (cron job every Sunday at 3 AM)
6. ✅ Deploy application with HTTPS

### Step 5: Update Environment Variables
```bash
cd ~/ila-webapp
nano .env
```

Update these values to use HTTPS:
```env
CORS_ORIGIN=https://ila-analytics.rdc.nie.edu.sg
VITE_API_BASE_URL=https://ila-analytics.rdc.nie.edu.sg/api
```

### Step 6: Redeploy with Updated Environment
```bash
./deploy-with-ssl.sh
```

### Step 7: Verify HTTPS
```bash
# Test from EC2
curl -I https://ila-analytics.rdc.nie.edu.sg

# Or visit in browser:
# https://ila-analytics.rdc.nie.edu.sg
```

---

## How It Works

### Architecture with SSL

```
                    Internet
                        │
                        ▼
              Port 80 (HTTP)
                        │
                        │ 301 Redirect
                        ▼
              Port 443 (HTTPS)
                        │
                        ▼
              ┌─────────────────────────┐
              │   Nginx Container       │
              │   - SSL Termination     │
              │   - Serves React app    │
              │   - Proxies to backend  │
              └─────────────────────────┘
                        │
                        ▼
              ┌─────────────────────────┐
              │   Backend Container     │
              │   Port 3001 (internal)  │
              └─────────────────────────┘
                        │
                        ▼
              ┌─────────────────────────┐
              │   PostgreSQL            │
              │   Port 5432 (internal)  │
              └─────────────────────────┘
```

### Certificate Management

1. **Initial Setup:**
   - Certbot runs in standalone mode
   - Validates domain ownership via HTTP-01 challenge (port 80)
   - Obtains certificate from Let's Encrypt
   - Saves to `/etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/`

2. **Auto-Renewal:**
   - Cron job runs weekly (Sunday 3 AM)
   - Certbot checks if certificate expires in <30 days
   - If needed, stops containers, renews cert, restarts containers
   - Logged to `/var/log/ssl-renewal.log`

3. **Docker Integration:**
   - Certificates mounted read-only into Nginx container
   - Startup script detects certificates and switches config
   - Zero downtime for renewals (automated)

---

## Security Configuration

### SSL/TLS Settings
- **Protocols:** TLS 1.2, TLS 1.3 only (no SSL, no TLS 1.0/1.1)
- **Ciphers:** Strong cipher suites (ECDHE, AES-GCM, ChaCha20)
- **Perfect Forward Secrecy:** Enabled
- **Session Caching:** 1 day, 50MB shared cache

### Security Headers
- **HSTS:** Enabled (1 year, includeSubDomains)
- **X-Frame-Options:** SAMEORIGIN
- **X-Content-Type-Options:** nosniff
- **X-XSS-Protection:** Enabled with blocking
- **Referrer-Policy:** no-referrer-when-downgrade

### HTTP → HTTPS Redirect
- All HTTP traffic automatically redirects to HTTPS
- Except Let's Encrypt validation path (/.well-known/acme-challenge/)

---

## Maintenance

### Check Certificate Status
```bash
sudo certbot certificates
```

### Manual Renewal (if needed)
```bash
cd ~/ila-webapp
docker compose down
sudo certbot renew --standalone
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Test Renewal (Dry Run)
```bash
sudo certbot renew --dry-run
```

### View Renewal Logs
```bash
sudo tail -f /var/log/ssl-renewal.log
```

### Check Certificate Expiry
```bash
sudo openssl x509 -in /etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/fullchain.pem -noout -dates
```

---

## Troubleshooting

### Certificate Validation Failed

**Problem:** DNS doesn't resolve or port 80 is blocked

**Solution:**
```bash
# Verify DNS
nslookup ila-analytics.rdc.nie.edu.sg
# Should return: 13.229.1.151

# Check port 80 is accessible
curl -I http://ila-analytics.rdc.nie.edu.sg
```

### HTTPS Not Working

**Problem:** Nginx can't read certificates

**Solution:**
```bash
# Check certificate files exist
sudo ls -la /etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/

# Check permissions
sudo chmod 755 /etc/letsencrypt/live/
sudo chmod 755 /etc/letsencrypt/archive/

# Restart frontend container
docker compose restart frontend

# Check logs
docker compose logs frontend
```

### Auto-Renewal Failed

**Problem:** Cron job can't access Docker

**Solution:**
```bash
# Check cron job
crontab -l

# Manually test renewal script
sudo /usr/local/bin/renew-ssl.sh

# Check logs
sudo cat /var/log/ssl-renewal.log
```

---

## What About Your ACM Certificate?

### Keep It for Future Use

You can keep your ACM certificate (`ila-analytics.rdc.nie.edu.sg`) for future use if you decide to:

1. **Add an Application Load Balancer (ALB):**
   - Create ALB in AWS Console
   - Attach ACM certificate to ALB HTTPS listener
   - Point ALB target group to your EC2 instance
   - Update DNS to point to ALB

2. **Use CloudFront:**
   - Create CloudFront distribution
   - Attach ACM certificate to CloudFront
   - Point CloudFront origin to your EC2 instance

3. **Current Setup:**
   - ACM certificate cannot be used (no ALB/CloudFront)
   - Let's Encrypt is the correct choice
   - Both can coexist (ACM in AWS, Let's Encrypt on EC2)

### Migration Path to ALB (Future)

If you add a load balancer later:

1. Create ALB with ACM certificate
2. Point DNS to ALB (not EC2 IP)
3. Remove Let's Encrypt from EC2
4. Update Nginx to use regular HTTP (ALB handles SSL)
5. Update Security Group (only allow traffic from ALB)

---

## Cost Comparison

| Solution | Cost | Renewal | Maintenance |
|----------|------|---------|-------------|
| **Let's Encrypt** | Free | Auto (every 90 days) | Minimal (cron job) |
| **ACM** | Free | Auto | None (managed) |
| **ACM + ALB** | ~$16/month (ALB) | Auto | None (managed) |

For a single EC2 instance, **Let's Encrypt is the most cost-effective** solution.

---

## Quick Reference

### URLs
- **HTTP (redirects):** http://ila-analytics.rdc.nie.edu.sg
- **HTTPS:** https://ila-analytics.rdc.nie.edu.sg
- **API:** https://ila-analytics.rdc.nie.edu.sg/api

### Common Commands
```bash
# Deploy with SSL
./deploy-with-ssl.sh

# Check certificate
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# View logs
docker compose logs -f frontend
sudo tail -f /var/log/ssl-renewal.log

# Restart containers
docker compose restart

# Check HTTPS
curl -I https://ila-analytics.rdc.nie.edu.sg
```

### Certificate Location
```
/etc/letsencrypt/live/ila-analytics.rdc.nie.edu.sg/
├── fullchain.pem  (certificate + intermediate)
├── privkey.pem    (private key)
├── cert.pem       (certificate only)
└── chain.pem      (intermediate only)
```

---

## Support

- **Let's Encrypt Community:** https://community.letsencrypt.org/
- **Certbot Documentation:** https://certbot.eff.org/docs/
- **Nginx SSL Guide:** https://nginx.org/en/docs/http/configuring_https_servers.html

---

## Next Steps

1. ✅ SSH to EC2: `ssh -i ila-pk.pem ec2-user@13.229.1.151`
2. ✅ Pull latest code: `cd ~/ila-webapp && git pull`
3. ✅ Update email in `setup-ssl.sh`
4. ✅ Run: `./setup-ssl.sh`
5. ✅ Update `.env` with HTTPS URLs
6. ✅ Redeploy: `./deploy-with-ssl.sh`
7. ✅ Test: Visit `https://ila-analytics.rdc.nie.edu.sg`

**Certificate will auto-renew every 90 days via cron job!**
