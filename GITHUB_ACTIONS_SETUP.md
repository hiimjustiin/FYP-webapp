# GitHub Actions CI/CD Setup Guide

This guide explains how to set up automated deployments to AWS EC2 using GitHub Actions.

## Overview

The CI/CD pipeline automatically deploys your Dockerized application to EC2 whenever you push to the `main` branch.

## Architecture

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│   GitHub     │       │   GitHub     │       │    AWS EC2       │
│  Repository  │──────►│   Actions    │──────►│  Docker Compose  │
│   (main)     │ push  │   Runner     │ SSH   │   Containers     │
└──────────────┘       └──────────────┘       └──────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │   Secrets    │
                       │  - SSH Key   │
                       │  - DB Pass   │
                       │  - JWT Secret│
                       └──────────────┘
```

## Setup Steps

### 1. Prepare EC2 Instance

SSH into your EC2 instance and ensure Docker is installed:

```bash
ssh -i ila-pk.pem ec2-user@13.212.19.144

# Install Docker
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Install Docker Compose plugin
sudo dnf install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version

# Important: Log out and back in for group membership to take effect
exit
ssh -i ila-pk.pem ec2-user@13.212.19.144
```

### 2. Set Up GitHub Repository Secrets

Go to your GitHub repository: `https://github.com/ntu-dsair/ila-webapp`

Navigate to: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

#### Required Secrets:

1. **`EC2_SSH_KEY`**
   - Your PEM key content (contents of `ila-pk.pem`)
   - Copy entire content including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`
   ```bash
   cat ila-pk.pem
   # Copy the output and paste as secret value
   ```

2. **`POSTGRES_PASSWORD`**
   - Secure password for PostgreSQL database
   - Example: `MySecureP@ssw0rd2025!`

3. **`JWT_SECRET`**
   - Strong random secret for JWT token signing
   - Generate with: `openssl rand -base64 32`
   - Example output: `3K9x/zQ+7mP2nR8tY4vB6wE1cF5gH8jL`

#### Optional Secrets (for notifications):

4. **`SLACK_WEBHOOK_URL`** (if you want Slack notifications)
5. **`DISCORD_WEBHOOK_URL`** (if you want Discord notifications)

### 3. Configure GitHub Actions Workflow

The workflow file is already created at `.github/workflows/deploy.yml`.

**What it does:**
- ✅ Triggers on push to `main` branch
- ✅ Can be manually triggered from GitHub Actions tab
- ✅ Connects to EC2 via SSH
- ✅ Pulls latest code
- ✅ Builds Docker images
- ✅ Deploys with Docker Compose
- ✅ Verifies deployment

### 4. Initial Deployment

For the first deployment, you can either:

**Option A: Manual deployment first** (Recommended)
```bash
# From your local machine
./deploy-docker.sh
```

This ensures everything is set up correctly before enabling automated deployments.

**Option B: Push to GitHub and let Actions deploy**
```bash
git add .
git commit -m "Set up GitHub Actions deployment"
git push origin main
```

Watch the deployment in GitHub Actions:
`https://github.com/ntu-dsair/ila-webapp/actions`

### 5. Update EC2 Environment Variables

After first deployment, SSH to EC2 and update `.env`:

```bash
ssh -i ila-pk.pem ec2-user@13.212.19.144
cd ~/ila-webapp
nano .env
```

Update these values:
```env
# Use strong passwords in production
POSTGRES_PASSWORD=<your-secure-password>
JWT_SECRET=<your-jwt-secret>

# Update with your domain or IP
CORS_ORIGIN=http://13.212.19.144:3000
VITE_API_BASE_URL=http://13.212.19.144:3001/api
```

Restart containers after updating:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

## Workflow Triggers

### Automatic Deployment (on push to main)
```bash
git add .
git commit -m "Your changes"
git push origin main
# GitHub Actions will automatically deploy
```

### Manual Deployment (from GitHub UI)
1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Deploy to AWS EC2** workflow
4. Click **Run workflow** dropdown
5. Select `main` branch
6. Click **Run workflow** button

## Monitoring Deployments

### View GitHub Actions Logs
1. Go to GitHub repository → **Actions** tab
2. Click on the workflow run
3. Click on the job to see detailed logs

### View Application Logs on EC2
```bash
ssh -i ila-pk.pem ec2-user@13.212.19.144
cd ~/ila-webapp

# View all container logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# View last 100 lines
docker compose logs --tail=100
```

### Check Container Status
```bash
ssh -i ila-pk.pem ec2-user@13.212.19.144

# Check running containers
docker compose ps

# Check container health
docker ps

# Check resource usage
docker stats
```

## Troubleshooting

### Deployment Fails with SSH Error

**Problem:** Cannot connect to EC2
```
Error: Permission denied (publickey)
```

**Solution:**
1. Verify `EC2_SSH_KEY` secret is correctly set with full PEM key content
2. Ensure EC2 Security Group allows SSH (port 22) from GitHub Actions IPs
3. GitHub Actions uses dynamic IPs - consider using a bastion host or GitHub's IP ranges

**Better solution:** Use AWS Systems Manager Session Manager instead of SSH:
- No open SSH port needed
- More secure
- Requires IAM role setup

### Deployment Succeeds but App Doesn't Work

**Check containers:**
```bash
ssh -i ila-pk.pem ec2-user@13.212.19.144
cd ~/ila-webapp
docker compose ps
```

**Check logs:**
```bash
docker compose logs backend
docker compose logs frontend
```

**Common issues:**
- Database not initialized: `docker compose logs postgres`
- Environment variables incorrect: Check `.env` file
- Ports blocked: Verify EC2 Security Groups

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Connect to database manually
docker compose exec postgres psql -U ila_user -d ila_db

# Run database initialization
docker compose exec postgres psql -U ila_user -d ila_db -f /docker-entrypoint-initdb.d/01-init.sql
```

### Container Keeps Restarting

```bash
# Check exit codes
docker compose ps

# View container logs
docker compose logs <service-name>

# Check resource usage
docker stats
```

## Security Best Practices

### 1. Secrets Management
- ✅ Never commit secrets to Git
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/staging/prod

### 2. EC2 Security Group
Configure inbound rules:
```
SSH (22)       - Your IP only
HTTP (3000)    - 0.0.0.0/0 (or your domain)
HTTP (3001)    - 0.0.0.0/0 (or your domain)
HTTPS (443)    - 0.0.0.0/0 (if using SSL)
PostgreSQL (5432) - No external access (Docker network only)
```

### 3. Docker Security
```bash
# Run containers as non-root user
# Update Dockerfile with:
USER node

# Scan images for vulnerabilities
docker scan ila-webapp

# Keep base images updated
docker compose pull
```

### 4. Environment Variables
- Use strong passwords (20+ characters, mixed case, numbers, symbols)
- Generate JWT secret: `openssl rand -base64 32`
- Use different values for each environment

## Advanced Configuration

### Enable Health Checks in Workflow

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Health Check
  run: |
    # Wait for services to be ready
    timeout 60 bash -c 'until curl -f http://${{ env.EC2_HOST }}:3001/api/health; do sleep 2; done'
    echo "✅ Backend is healthy"
    
    curl -f http://${{ env.EC2_HOST }}:3000 || exit 1
    echo "✅ Frontend is healthy"
```

### Add Slack Notifications

Add to end of workflow:

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1.25.0
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: incoming-webhook
    payload: |
      {
        "text": "Deployment ${{ job.status }}: ${{ github.repository }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Deployment *${{ job.status }}* for `${{ github.ref }}`"
            }
          }
        ]
      }
```

### Add Rollback Capability

Create `.github/workflows/rollback.yml`:

```yaml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      commit:
        description: 'Commit SHA to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback to commit
        run: |
          ssh ${{ env.EC2_USER }}@${{ env.EC2_HOST }} << 'EOF'
            cd ~/ila-webapp
            git fetch
            git reset --hard ${{ github.event.inputs.commit }}
            docker compose down
            docker compose up -d --build
          EOF
```

## Staging Environment

To add a staging environment:

1. Create `staging` branch in GitHub
2. Duplicate workflow as `.github/workflows/deploy-staging.yml`
3. Update EC2 host to staging server
4. Use different ports (e.g., 4000, 4001)

## Cost Optimization

- Use EC2 Instance Scheduler to stop instances during off-hours
- Use spot instances for non-critical environments
- Set up CloudWatch alarms for cost monitoring
- Clean up old Docker images regularly

## Next Steps

1. ✅ Set up GitHub Secrets
2. ✅ Configure EC2 Security Groups
3. ✅ Run first deployment
4. ✅ Test application
5. ✅ Set up monitoring
6. 🔲 Add SSL certificate (Let's Encrypt)
7. 🔲 Set up custom domain
8. 🔲 Configure automated backups
9. 🔲 Add staging environment
10. 🔲 Set up CloudWatch monitoring

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Check EC2 application logs: `docker compose logs -f`
3. Verify EC2 Security Groups
4. Verify GitHub Secrets are correctly set
5. Check EC2 instance status in AWS Console

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
