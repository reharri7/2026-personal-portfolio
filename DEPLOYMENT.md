# Digital Ocean Droplet Deployment Guide

Complete step-by-step guide for deploying your portfolio application to a Digital Ocean Droplet.

## Prerequisites

- Digital Ocean account
- Domain name (optional, but recommended)
- GitHub/GitLab repository with your code

---

## Step 1: Create Digital Ocean Droplet

1. **Log into Digital Ocean** → Create → Droplets
2. **Choose configuration:**
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($6-12/month is sufficient to start)
   - **Size:** 1GB RAM minimum (2GB recommended)
   - **Datacenter:** Choose closest to your users
   - **Authentication:** SSH key (recommended) or password
   - **Hostname:** portfolio-server (or your choice)

3. **Wait for droplet creation** and note the IP address

---

## Step 2: Configure Your Domain (Optional but Recommended)

1. **In your domain registrar** (Namecheap, GoDaddy, etc.):
   - Add an **A record** pointing to your droplet IP:
     ```
     Type: A
     Host: @
     Value: YOUR_DROPLET_IP
     TTL: 300
     ```
   - Add a **CNAME record** for www:
     ```
     Type: CNAME
     Host: www
     Value: yourdomain.com
     TTL: 300
     ```

2. **Wait for DNS propagation** (5-30 minutes)

---

## Step 3: Initial Server Setup

SSH into your droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

### Update system packages:
```bash
apt update && apt upgrade -y
```

### Install Docker and Docker Compose:
```bash
# Install Docker
apt install -y docker.io

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Enable Docker to start on boot
systemctl enable docker
systemctl start docker

# Verify installation
docker --version
docker compose version
```

### Install Nginx:
```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### Install Certbot (for SSL):
```bash
apt install -y certbot python3-certbot-nginx
```

---

## Step 4: Deploy Your Application

### Clone your repository:
```bash
cd /root
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git 2026-rhett-harrison-portfolio
cd 2026-rhett-harrison-portfolio
```

### Set up environment variables:
```bash
cp .env.example .env
nano .env
```

**Edit `.env` with your production values:**
```bash
# Database Configuration
POSTGRES_DB=portfolio
POSTGRES_USER=portfolio_user
POSTGRES_PASSWORD=STRONG_RANDOM_PASSWORD_HERE

# Spring Boot Configuration
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_JPA_SHOW_SQL=false

# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=YOUR_RECAPTCHA_SECRET_KEY

# Frontend Configuration
FRONTEND_PORT=8081

# Domain Configuration
DOMAIN_NAME=yourdomain.com
```

**Save and exit** (Ctrl+X, then Y, then Enter)

### Build and start Docker containers:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Verify containers are running:
```bash
docker compose -f docker-compose.prod.yml ps
```

You should see 3 containers: `portfolio-postgres-prod`, `portfolio-backend-prod`, `portfolio-frontend-prod`

---

## Step 5: Configure Nginx Reverse Proxy

### Copy the Nginx configuration:
```bash
cp nginx-host.conf /etc/nginx/sites-available/portfolio
```

### Edit the configuration with your domain:
```bash
nano /etc/nginx/sites-available/portfolio
```

**Replace `yourdomain.com` with your actual domain** (in multiple places)

**Save and exit**

### Enable the site:
```bash
ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
```

### Remove default Nginx site (optional):
```bash
rm /etc/nginx/sites-enabled/default
```

### Test Nginx configuration:
```bash
nginx -t
```

### Reload Nginx:
```bash
systemctl reload nginx
```

---

## Step 6: Set Up SSL Certificate (HTTPS)

### Get SSL certificate with Certbot:
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Follow the prompts:**
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### Verify SSL auto-renewal:
```bash
certbot renew --dry-run
```

---

## Step 7: Enable Auto-Start on Reboot

### Copy systemd service file:
```bash
cp /root/2026-rhett-harrison-portfolio/portfolio.service /etc/systemd/system/
```

### Edit if your installation path is different:
```bash
nano /etc/systemd/system/portfolio.service
```

**Verify `WorkingDirectory` matches your installation path**

### Enable and start the service:
```bash
systemctl daemon-reload
systemctl enable portfolio.service
systemctl start portfolio.service
```

### Check service status:
```bash
systemctl status portfolio.service
```

---

## Step 8: Set Up Automated Database Backups

### Make backup script executable:
```bash
chmod +x /root/2026-rhett-harrison-portfolio/backup-db.sh
```

### Test the backup script:
```bash
/root/2026-rhett-harrison-portfolio/backup-db.sh
```

**Check that backup was created:**
```bash
ls -lh /root/backups/portfolio/
```

### Set up daily automated backups with cron:
```bash
crontab -e
```

**Add this line (runs daily at 2 AM):**
```
0 2 * * * /root/2026-rhett-harrison-portfolio/backup-db.sh >> /var/log/portfolio-backup.log 2>&1
```

**Save and exit**

---

## Step 9: Configure Firewall (Important for Security)

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

**Type `y` and press Enter when prompted**

### Verify firewall status:
```bash
ufw status
```

---

## Step 10: Verify Deployment

1. **Visit your domain:** https://yourdomain.com
2. **Check all services are running:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
3. **Check logs for errors:**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

---

## Useful Commands

### View application logs:
```bash
cd /root/2026-rhett-harrison-portfolio
docker compose -f docker-compose.prod.yml logs -f
```

### Restart application:
```bash
systemctl restart portfolio.service
# OR
cd /root/2026-rhett-harrison-portfolio
docker compose -f docker-compose.prod.yml restart
```

### Update application (after git push):
```bash
cd /root/2026-rhett-harrison-portfolio
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Stop application:
```bash
systemctl stop portfolio.service
# OR
cd /root/2026-rhett-harrison-portfolio
docker compose -f docker-compose.prod.yml down
```

### View Nginx logs:
```bash
tail -f /var/log/nginx/portfolio_access.log
tail -f /var/log/nginx/portfolio_error.log
```

### Restore database from backup:
```bash
# Stop the application first
docker compose -f docker-compose.prod.yml down

# Start only the database
docker compose -f docker-compose.prod.yml up -d postgres

# Restore backup (replace YYYYMMDD_HHMMSS with your backup timestamp)
gunzip -c /root/backups/portfolio/portfolio_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i portfolio-postgres-prod psql -U portfolio_user -d portfolio

# Start all services
docker compose -f docker-compose.prod.yml up -d
```

---

## Monitoring and Maintenance

### Check disk space:
```bash
df -h
```

### Check Docker disk usage:
```bash
docker system df
```

### Clean up unused Docker resources:
```bash
docker system prune -a
```

### Monitor system resources:
```bash
htop  # Install with: apt install htop
```

---

## Troubleshooting

### Container won't start:
```bash
docker compose -f docker-compose.prod.yml logs [service-name]
# Example: docker compose -f docker-compose.prod.yml logs backend
```

### SSL certificate issues:
```bash
certbot certificates
certbot renew --force-renewal
```

### Port already in use:
```bash
# Check what's using the port
lsof -i :8081
# Kill the process if needed
kill -9 PID
```

### Reset everything (DANGER - deletes all data):
```bash
cd /root/2026-rhett-harrison-portfolio
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Security Best Practices

1. **Change default SSH port** (optional but recommended)
2. **Disable root SSH login** after creating a non-root user
3. **Keep system updated:** `apt update && apt upgrade -y`
4. **Monitor logs regularly** for suspicious activity
5. **Use strong passwords** in `.env` file
6. **Never commit `.env` to git**
7. **Set up fail2ban** for SSH protection:
   ```bash
   apt install fail2ban
   systemctl enable fail2ban
   ```

---

## Cost Optimization

- **Droplet Size:** Start with 1GB RAM ($6/month), upgrade if needed
- **Backups:** Digital Ocean backups cost 20% extra, or use your backup script
- **Monitoring:** Use Digital Ocean's free monitoring dashboard
- **Snapshots:** Take snapshots before major updates ($1.20/GB/month)

---

## Next Steps

- Set up monitoring with Digital Ocean's dashboard
- Configure email alerts for server issues
- Set up a staging environment on a separate droplet
- Configure CDN for static assets (optional)
- Set up log rotation to prevent disk filling

---

**Need help?** Check the logs first:
```bash
docker compose -f docker-compose.prod.yml logs -f
tail -f /var/log/nginx/portfolio_error.log
```
