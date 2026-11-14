# Metropolitan University — Integrated Financial Management & Digital Clearance Portal
## Document: Operations, Production Deployment & Disaster Recovery Guide
**Document Code:** `CPCS-MU-DOC-010`  
**Version:** 1.0.0  
**Effective Date:** Spring Semester 2026  
**Audience:** Metropolitan University IT Directorate, System Administrators, DevOps Engineers  

---

### 1. Architectural Topology & Deployment Overview

The Metropolitan University Integrated Financial Management & Digital Clearance Portal (CPCS) is designed as a secure, modular monolith with distinct decoupled tiers. The system can be deployed either via containerized Docker Compose orchestration or directly on enterprise Linux / Windows virtual machines.

```
                              [ HTTPS / 443 ]
                                     │
                     ┌───────────────▼───────────────┐
                     │   NGINX Gateway / Reverse     │
                     │   Proxy (SSL Termination,     │
                     │   Gzip, Security Headers)     │
                     └───────┬───────────────┬───────┘
                             │               │
                 Static / SPA│               │/api/* requests
                             ▼               ▼
                     ┌───────────────┐ ┌───────────────┐
                     │ React SPA     │ │ Node/Express  │
                     │ Static Bundle │ │ API Server    │
                     │ (Port 80/443) │ │ (Port 5000)   │
                     └───────────────┘ └───────┬───────┘
                                               │ Prisma ORM
                                               │ (Connection Pool)
                                               ▼
                                       ┌───────────────┐
                                       │  PostgreSQL   │
                                       │  16 / 18      │
                                       │  (Port 5432)  │
                                       └───────────────┘
```

---

### 2. System Hardware & Software Prerequisites

#### Minimum Production Specifications
- **CPU:** 4 vCPUs (x86_64 or ARM64)
- **RAM:** 8 GB DDR4 (16 GB recommended for peak semester registration periods)
- **Disk Storage:** 80 GB SSD/NVMe (RAID-1 or enterprise EBS with automated snapshotting)
- **Network:** 100 Mbps uplink with static public IP and firewall rules

#### Software Requirements
- **Docker Engine:** v24.0+ & **Docker Compose** v2.20+ (for containerized setup)
- **Node.js:** v20.x or v22.x LTS (for bare-metal / VM setup)
- **PostgreSQL:** v16.x or v18.x with `pgcrypto` support
- **Reverse Proxy:** Nginx 1.24+ or Cloudflare Enterprise edge termination

---

### 3. Production Deployment Option A: Docker Compose (Recommended)

The repository provides a turnkey, multi-stage production Docker Compose stack (`docker-compose.yml`) containing:
1. `postgres`: Production PostgreSQL 16 Alpine container with persistent named volume and healthcheck.
2. `backend`: Multi-stage Alpine container running the Express API, generating custom Prisma clients, and running unprivileged.
3. `frontend`: Multi-stage build running Vite compile and serving static assets through Nginx with reverse-proxying.

#### Step 1: Clone Repository & Create Environment Configuration
```bash
git clone https://github.com/metropolitan-university/cpcs-portal.git
cd cpcs-portal

# Copy environment template
cp backend/.env.example backend/.env
```

#### Step 2: Configure Production Environment Variables (`backend/.env`)
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://postgres:SecureProductionPassword2026!@postgres:5432/cpcs_db?schema=public&connection_limit=25"
JWT_SECRET="MU_SECURE_JWT_SIGNING_KEY_$(openssl rand -hex 32)"
FRONTEND_URL="https://clearance.metrouni.edu.bd"
```

#### Step 3: Build & Launch Container Stack
```bash
docker compose up -d --build
```

#### Step 4: Execute Initial Migrations & Seed Demo Data
```bash
# Push Prisma schema to PostgreSQL
docker compose exec backend npx prisma db push

# Seed Metropolitan University departments, fee categories, and roles
docker compose exec backend npm run seed
```

#### Step 5: Verify Running Health
```bash
docker compose ps
curl -I http://localhost:5000/api/health
```

---

### 4. Production Deployment Option B: Bare-Metal / Virtual Machine (PM2 + Systemd)

For institutional deployments on dedicated university servers (Ubuntu 22.04 LTS / Debian 12 / Windows Server 2022).

#### Step 1: Install Node.js, PM2 & PostgreSQL
```bash
# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

#### Step 2: Configure Dedicated PostgreSQL Database
```sql
sudo -u postgres psql
CREATE DATABASE cpcs_db;
CREATE USER cpcs_admin WITH ENCRYPTED PASSWORD 'StrongAdminPass2026!';
GRANT ALL PRIVILEGES ON DATABASE cpcs_db TO cpcs_admin;
ALTER DATABASE cpcs_db OWNER TO cpcs_admin;
\q
```

#### Step 3: Build & Setup Backend API
```bash
cd /opt/metrouni/cpcs/backend
npm ci --omit=dev
npx prisma generate
npx prisma db push
npm run seed

# Launch with PM2 Process Manager
pm2 start src/index.js --name "mu-cpcs-backend" -i max
pm2 save
pm2 startup
```

#### Step 4: Build Frontend Assets
```bash
cd /opt/metrouni/cpcs/frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/mu-clearance/
```

#### Step 5: Configure Nginx Virtual Host (`/etc/nginx/sites-available/cpcs.metrouni.edu.bd`)
```nginx
server {
    listen 80;
    server_name clearance.metrouni.edu.bd;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name clearance.metrouni.edu.bd;

    ssl_certificate /etc/letsencrypt/live/clearance.metrouni.edu.bd/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clearance.metrouni.edu.bd/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Frontend Single Page Application
    root /var/www/mu-clearance;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
```

---

### 5. Automated Database Backup & Disaster Recovery (DR)

Metropolitan University's financial transactions and graduation certificates require zero data loss guarantees (RPO < 1 hour, RTO < 30 minutes).

#### Automated Backup Script (`/opt/metrouni/scripts/backup-db.sh`)
```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/metrouni/cpcs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/cpcs_db_backup_$TIMESTAMP.sql.gz"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

echo "[$(date)] Starting CPCS database backup..."
pg_dump -U cpcs_admin -h localhost -d cpcs_db --clean --if-exists | gzip > $FILENAME

chmod 600 $FILENAME
echo "[$(date)] Backup completed successfully: $FILENAME"

# Prune backups older than 30 days
find $BACKUP_DIR -type f -name "cpcs_db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Cleaned up backups older than $RETENTION_DAYS days."
```

#### Scheduled Cron Job
Add to root crontab (`crontab -e`):
```cron
# Execute automated backup every 6 hours (00:00, 06:00, 12:00, 18:00)
0 */6 * * * /opt/metrouni/scripts/backup-db.sh >> /var/log/cpcs_backup.log 2>&1
```

#### Database Restoration Procedure
To restore from a backup snapshot:
```bash
# 1. Unpack and stream into psql
gunzip < /var/backups/metrouni/cpcs/cpcs_db_backup_20261111_120000.sql.gz | psql -U cpcs_admin -d cpcs_db

# 2. Re-sync Prisma client if schema updated
cd /opt/metrouni/cpcs/backend && npx prisma db push
```

---

### 6. Production Health Checks & Verification Commands

| Component | Target URL / Command | Expected Output |
|---|---|---|
| **API Health Check** | `GET /api/health` | `HTTP 200 { "status": "UP", "database": "CONNECTED" }` |
| **Frontend Assets** | `GET /` | `HTTP 200 (HTML document loaded)` |
| **Certificate QR Validator** | `GET /api/certificates/verify/:token` | `HTTP 200 { "valid": true, "status": "CLEARED" }` |
| **Backend Unit Tests** | `npm --prefix backend test` | `pass 6, fail 0` |
| **Frontend Production Build** | `npm --prefix frontend run build` | `built in ~4s with zero errors` |

---

### 7. Troubleshooting & Operational Runbook

#### 1. Windows `EPERM` File Locking on Prisma Engine
- **Symptom:** `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`.
- **Cause:** Anti-virus or IDE holding file lock on default `node_modules/.prisma/client`.
- **Resolution:** The schema is already permanently configured with `output = "../src/generated/client"`. Run `npm run setup:db -- <password>` to execute schema pushes cleanly without permission collisions.

#### 2. PostgreSQL Authentication Failure (`scram-sha-256`)
- **Symptom:** `FATAL: password authentication failed for user "postgres"`.
- **Cause:** Local PostgreSQL password mismatch in `.env`.
- **Resolution:** Run the automated database setup script:
  ```bash
  node backend/setup-db.js <your_postgres_password>
  ```
  This creates `cpcs_db`, pushes Prisma tables, and executes the seed script.

#### 3. Bank Slip Image Upload Storage
- **Symptom:** `ENOENT: no such file or directory, open 'uploads/slips/...'`.
- **Resolution:** Ensure the directory exists and has write permissions:
  ```bash
  mkdir -p backend/uploads/slips
  chmod 755 backend/uploads/slips
  ```

---

**Certified for Institutional Deployment**  
*Metropolitan University IT Infrastructure Directorate — Bateshwar, Sylhet-3103, Bangladesh*

