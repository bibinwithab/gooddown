# Production Deployment Guide

**Document Version:** 1.0.0  
**Last Updated:** December 2025  
**Environment:** Windows/Linux Server  
**Target Platforms:** On-Premises LAN, VPS, Cloud (AWS/Azure)

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Network (LAN) Deployment](#local-network-lan-deployment)
3. [VPS/Cloud Deployment](#vpscloud-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Reverse Proxy Setup](#reverse-proxy-setup)
6. [SSL/HTTPS Configuration](#sslhttps-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Infrastructure Requirements

- [ ] **Server:** Windows Server 2019+ or Linux (Ubuntu 20.04+, CentOS 8+)
- [ ] **CPU:** Minimum 2 cores
- [ ] **RAM:** Minimum 4 GB
- [ ] **Storage:** Minimum 50 GB (SSD recommended)
- [ ] **Network:** Static IP address, port 80 & 443 open

### Software Prerequisites

- [ ] Node.js v16+ installed
- [ ] PostgreSQL 12+ installed and running
- [ ] npm or yarn installed
- [ ] Git installed (for version control)
- [ ] Optional: Docker & Docker Compose
- [ ] Optional: Nginx or Apache (for reverse proxy)

### Code Requirements

- [ ] Repository cloned with latest stable release
- [ ] Environment variables configured (.env file)
- [ ] Database migrations applied
- [ ] Initial data seeded
- [ ] Frontend build tested locally

### Security Requirements

- [ ] SSL certificate obtained (free via Let's Encrypt)
- [ ] Firewall rules configured
- [ ] Database credentials secured
- [ ] API keys and secrets in environment variables
- [ ] User accounts created with strong passwords

---

## Local Network (LAN) Deployment

### Step 1: Prepare Deployment Server

**Windows Server Setup:**

```powershell
# 1. Install Node.js
# Download from https://nodejs.org/ (LTS version)
# Run installer, add to PATH

# 2. Verify installation
node --version
npm --version

# 3. Install PostgreSQL
# Download from https://www.postgresql.org/
# Run installer, note admin password

# 4. Create database
psql -U postgres
CREATE DATABASE jobin_agency;
CREATE USER jobin_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE jobin_agency TO jobin_user;
```

**Linux Setup:**

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Create database
sudo -u postgres createdb jobin_agency
sudo -u postgres createuser jobin_user
sudo -u postgres psql -c "ALTER USER jobin_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jobin_agency TO jobin_user;"
```

### Step 2: Clone and Setup Application

```bash
# Clone repository
git clone <repository-url> /opt/jobin-billing
cd /opt/jobin-billing

# Backend setup
cd backend
npm install

# Create .env file
cat > .env << EOF
PGHOST=localhost
PGPORT=5432
PGUSER=jobin_user
PGPASSWORD=secure_password_here
PGDATABASE=jobin_agency
PORT=5000
NODE_ENV=production
EOF

# Frontend setup
cd ../frontend
npm install
npm run build

# Copy built frontend to backend public directory
cp -r dist/* ../backend/public/
```

### Step 3: Start Application

**Option A: Direct Start**

```bash
cd backend
npm start
```

**Option B: Background Process (Linux)**

```bash
# Using nohup
nohup npm start > app.log 2>&1 &

# Using screen
screen -S jobin-app
npm start
# Detach: Ctrl+A then D
```

**Option C: Windows Service**

```powershell
# Using NSSM (Non-Sucking Service Manager)
# Download from https://nssm.cc/

# Install service
nssm install JobinBilling "C:\Program Files\nodejs\node.exe" "C:\path\to\backend\server.js"
nssm set JobinBilling AppDirectory "C:\path\to\backend"
nssm start JobinBilling

# View service status
nssm status JobinBilling
```

### Step 4: Configure Network Access

**Windows Firewall:**

```powershell
# Allow port 5000
netsh advfirewall firewall add rule name="Allow Node.js" dir=in action=allow protocol=tcp localport=5000

# List active ports
netstat -ano | findstr :5000
```

**Linux Firewall (UFW):**

```bash
sudo ufw allow 5000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### Step 5: Access Application

**Local Network Access:**

```
http://<server-ip>:5000
```

**Example:**

```
http://192.168.1.100:5000
```

---

## VPS/Cloud Deployment

### AWS EC2 Deployment

#### Step 1: Launch EC2 Instance

```bash
# Instance Type: t3.small or larger
# AMI: Ubuntu 22.04 LTS
# Storage: 50 GB SSD
# Security Group: Allow HTTP (80), HTTPS (443), SSH (22)
```

#### Step 2: Connect and Configure

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y nodejs npm postgresql postgresql-contrib

# Create database and user
sudo -u postgres createdb jobin_agency
sudo -u postgres createuser jobin_user --createdb
sudo -u postgres psql -c "ALTER USER jobin_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jobin_agency TO jobin_user;"
```

#### Step 3: Deploy Application

```bash
# Clone repository
cd /home/ubuntu
git clone <repository-url> jobin-billing
cd jobin-billing/backend

# Install and configure
npm install
cat > .env << EOF
PGHOST=localhost
PGPORT=5432
PGUSER=jobin_user
PGPASSWORD=secure_password
PGDATABASE=jobin_agency
PORT=5000
NODE_ENV=production
EOF

# Build frontend
cd ../frontend
npm install
npm run build
cp -r dist/* ../backend/public/

# Test start
cd ../backend
npm start
```

#### Step 4: Systemd Service (Recommended)

**Create Service File:**

```bash
sudo nano /etc/systemd/system/jobin-app.service
```

**Content:**

```ini
[Unit]
Description=Jobin Billing Application
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/jobin-billing/backend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Enable and Start:**

```bash
sudo systemctl enable jobin-app
sudo systemctl start jobin-app
sudo systemctl status jobin-app
```

### Azure App Service Deployment

```bash
# Login to Azure
az login

# Create resource group
az group create --name jobin-rg --location eastus

# Create App Service Plan
az appservice plan create --name jobin-plan --resource-group jobin-rg --sku B2 --is-linux

# Create Web App
az webapp create --resource-group jobin-rg --plan jobin-plan --name jobin-billing --runtime "NODE|18-lts"

# Deploy code
az webapp deployment source config-zip --resource-group jobin-rg --name jobin-billing --src package.zip
```

---

## Docker Deployment

### Step 1: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copy frontend and build
COPY frontend/ /app/frontend/
WORKDIR /app/frontend
RUN npm ci && npm run build
RUN cp -r dist/* /app/backend/public/

WORKDIR /app/backend

EXPOSE 5000

ENV NODE_ENV=production
CMD ["node", "server.js"]
```

### Step 2: Create Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: jobin-db
    environment:
      POSTGRES_USER: jobin_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: jobin_agency
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jobin_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: jobin-app
    environment:
      PGHOST: postgres
      PGPORT: 5432
      PGUSER: jobin_user
      PGPASSWORD: secure_password
      PGDATABASE: jobin_agency
      PORT: 5000
      NODE_ENV: production
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
```

### Step 3: Build and Run

```bash
# Build Docker image
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Cleanup
docker system prune -a
```

---

## Reverse Proxy Setup

### Nginx Configuration

**Create Config File:**

```bash
sudo nano /etc/nginx/sites-available/jobin
```

**Configuration:**

```nginx
upstream jobin_app {
    server localhost:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Proxy settings
    location / {
        proxy_pass http://jobin_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

**Enable Site:**

```bash
sudo ln -s /etc/nginx/sites-available/jobin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Apache Configuration

```bash
# Enable required modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
sudo a2enmod rewrite

# Create config
sudo nano /etc/apache2/sites-available/jobin.conf
```

**Configuration:**

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com

    RewriteEngine On
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    ServerAlias www.your-domain.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/your-domain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/

    <Directory /var/www>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

---

## SSL/HTTPS Configuration

### Let's Encrypt Setup

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check certificate
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout
```

---

## Monitoring & Logging

### Application Logging

**Backend Logs:**

```bash
# View logs
tail -f app.log

# Log rotation setup
sudo nano /etc/logrotate.d/jobin-app
```

**Configuration:**

```
/var/log/jobin-app.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
}
```

### System Monitoring

**Health Check Script:**

```bash
#!/bin/bash
# health-check.sh

# Check if app is running
curl -f http://localhost:5000 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "App is healthy"
else
    echo "App is down, restarting..."
    systemctl restart jobin-app
fi

# Check database
psql -h localhost -U jobin_user -d jobin_agency -c "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "Database is healthy"
else
    echo "Database is down"
fi
```

**Cron Job:**

```bash
# Add to crontab
*/5 * * * * /path/to/health-check.sh >> /var/log/health-check.log
```

---

## Backup & Disaster Recovery

### Database Backups

```bash
# Daily backup
0 2 * * * pg_dump -U jobin_user -d jobin_agency | gzip > /backup/jobin_$(date +\%Y\%m\%d).sql.gz

# Keep for 30 days
find /backup -name "jobin_*.sql.gz" -mtime +30 -delete
```

### Code Backup

```bash
# Regular git commits
git add .
git commit -m "Production snapshot: $(date)"
git push origin main

# Local backup
tar -czf /backup/code_$(date +%Y%m%d).tar.gz /opt/jobin-billing
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check if port is in use
lsof -i :5000

# Check logs
journalctl -u jobin-app -f

# Manual start with verbose output
cd /path/to/backend
npm start

# Check environment variables
env | grep PG
```

### Database Connection Issues

```bash
# Test connection
psql -h localhost -U jobin_user -d jobin_agency -c "SELECT 1"

# Check PostgreSQL status
sudo systemctl status postgresql

# Check credentials
cat /path/to/.env | grep PG
```

### Memory Issues

```bash
# Monitor memory usage
free -h

# Monitor app memory
ps aux | grep node

# Set node memory limit
export NODE_OPTIONS="--max-old-space-size=2048"
npm start
```

---

**Document Version:** 1.0.0  
**Last Updated:** December 22, 2025  
**Maintained By:** DevOps & System Administration Team
