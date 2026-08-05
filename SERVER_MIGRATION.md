# Server Migration Guide — Finance App (QOBOX)

This guide covers moving the Finance app from one server to another, including database restore, environment setup, build, and production deployment.

**Production URL (current):** `https://finance.aau.co.in`

---

## What you need to copy from the old server

| Item | Location | Notes |
|------|----------|-------|
| Database backup | `backups/finance_app_migration_*.tar.gz` | Created by `scripts/backup-database.sh` |
| Backend secrets | `backend/.env` | **Never commit to git.** Contains DB password, JWT secret, Cloudinary keys |
| Frontend env (optional) | `.env` or `.env.production` | API URL for builds |
| SSL certificates | `/etc/letsencrypt/` or your cert path | If using HTTPS |
| Nginx config | `/etc/nginx/sites-available/` | Not in repo — copy manually |
| Cloudinary media | Cloudinary dashboard | Files are stored in Cloudinary, not on disk |

---

## New server requirements

| Software | Version |
|----------|---------|
| Ubuntu / Debian (recommended) | 22.04+ |
| Java (Eclipse Temurin) | **21** |
| Node.js | **≥ 24** |
| npm | Latest bundled with Node |
| PostgreSQL | **14+** (18.x used in Docker dev) |
| PM2 | Latest (`npm install -g pm2`) |
| Nginx | For reverse proxy + static files |
| Git | To clone the repository |

### Install prerequisites (Ubuntu/Debian example)

```bash
# Java 21
sudo apt update
sudo apt install -y openjdk-21-jdk

# Node.js 24 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# PM2
sudo npm install -g pm2

# Nginx
sudo apt install -y nginx
```

---

## 1. Clone the repository

```bash
sudo mkdir -p /apps
sudo chown "$USER:$USER" /apps
git clone <your-repo-url> /apps/finanace
cd /apps/finanace
```

---

## 2. Set up PostgreSQL

```bash
sudo -u postgres psql <<'SQL'
CREATE USER finance_user WITH PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE finance_app OWNER finance_user;
GRANT ALL PRIVILEGES ON DATABASE finance_app TO finance_user;
SQL
```

---

## 3. Restore the database

Copy the backup archive from the old server:

```bash
scp old-server:/apps/finanace/backups/finance_app_migration_*.tar.gz /apps/finanace/backups/
cd /apps/finanace/backups
tar -xzf finance_app_migration_*.tar.gz
```

Restore using the custom-format dump (recommended):

```bash
# Drop and recreate if restoring over an empty DB with schema conflicts:
# sudo -u postgres dropdb finance_app && sudo -u postgres createdb finance_app -O finance_user

sudo -u postgres pg_restore \
  -d finance_app \
  --no-owner \
  --role=finance_user \
  finance_app_*_full.dump
```

Or restore from plain SQL:

```bash
sudo -u postgres psql -d finance_app -f finance_app_*_full.sql
```

> **Note:** A full restore includes the `databasechangelog` table. Liquibase will not re-run already-applied migrations. On a fresh empty database, you can also skip restore and let Liquibase create the schema on first startup (you will lose existing data).

---

## 4. Configure environment variables

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` — copy values from the **old server's** `backend/.env`:

```env
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/finance_app
SPRING_DATASOURCE_USERNAME=finance_user
SPRING_DATASOURCE_PASSWORD=YOUR_STRONG_PASSWORD

# CRITICAL: use the SAME secret from the old server or all users must re-login
JHIPSTER_SECURITY_AUTHENTICATION_JWT_BASE64_SECRET=<copy-from-old-server>

CLOUDINARY_CLOUD_NAME=<copy-from-old-server>
CLOUDINARY_API_KEY=<copy-from-old-server>
CLOUDINARY_API_SECRET=<copy-from-old-server>
```

### Frontend (`.env.production` or root `.env`)

```bash
cp .env.example .env.production
```

```env
VITE_USE_BACKEND=true
VITE_API_BASE_URL=https://finance.aau.co.in
```

Change `VITE_API_BASE_URL` if the domain changes on the new server.

---

## 5. Build and start the application

```bash
cd /apps/finanace

# Install frontend dependencies
npm install

# Build backend + frontend and start via PM2
bash scripts/production-restart.sh
```

This script:
1. Builds the Spring Boot JAR (`backend/target/backend-0.0.1-SNAPSHOT.jar`)
2. Builds the frontend to `dist/client`
3. Starts/restarts the backend with PM2
4. Waits for `http://127.0.0.1:8080/management/health`

### PM2 startup on boot

```bash
pm2 startup
# Run the command PM2 prints, then:
pm2 save
```

---

## 6. Configure Nginx

Create `/etc/nginx/sites-available/finance`:

```nginx
server {
    listen 80;
    server_name finance.aau.co.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name finance.aau.co.in;

    ssl_certificate     /etc/letsencrypt/live/finance.aau.co.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/finance.aau.co.in/privkey.pem;

    root /apps/finanace/dist/client;
    index index.html;

    # API → Spring Boot
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 5m;
    }

    # Actuator / management (restrict in production)
    location /management/ {
        allow 127.0.0.1;
        deny all;
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA — all other routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/finance /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d finance.aau.co.in
```

---

## 7. Update DNS

Point `finance.aau.co.in` (or your domain) A record to the new server's public IP. Wait for propagation, then verify:

```bash
curl -s https://finance.aau.co.in/api/management/health
```

---

## 8. If the domain changes

Update these files and rebuild:

1. `backend/src/main/resources/config/application-prod.yml` — add new origin to `jhipster.cors.allowed-origins`
2. `.env.production` — `VITE_API_BASE_URL`
3. Rebuild: `bash scripts/production-restart.sh`

---

## Architecture overview

```
Browser
   │
   ▼
Nginx (:443)
   ├── /          → /apps/finanace/dist/client  (static React SPA)
   └── /api/*     → http://127.0.0.1:8080      (Spring Boot via PM2)
                        │
                        ▼
                   PostgreSQL (:5432/finance_app)
                        │
                        ▼
                   Cloudinary (file uploads)
```

---

## Useful commands

| Task | Command |
|------|---------|
| Create DB backup | `bash scripts/backup-database.sh` |
| Rebuild + restart prod | `bash scripts/production-restart.sh` |
| View backend logs | `pm2 logs finance-backend` |
| Backend status | `pm2 status` |
| Health check | `curl http://127.0.0.1:8080/management/health` |
| Build backend only | `cd backend && ./mvnw -ntp -q package -DskipTests` |
| Build frontend only | `npm run build` |

---

## Troubleshooting

### Backend won't start

```bash
pm2 logs finance-backend --lines 100
```

Common causes:
- Missing or wrong `backend/.env` values
- PostgreSQL not running: `sudo systemctl status postgresql`
- Port 8080 in use: `ss -tlnp | grep 8080`

### Database connection refused

```bash
sudo -u postgres psql -d finance_app -c 'SELECT 1'
```

Check `SPRING_DATASOURCE_URL`, username, and password in `backend/.env`.

### Users forced to re-login after migration

The `JHIPSTER_SECURITY_AUTHENTICATION_JWT_BASE64_SECRET` changed. Copy the exact value from the old server.

### File uploads fail

Verify `CLOUDINARY_*` env vars in `backend/.env` match the old server (or update Cloudinary account).

### 502 Bad Gateway from Nginx

Backend is down or not listening on 8080:

```bash
pm2 restart finance-backend
curl http://127.0.0.1:8080/management/health
```

---

## Alternative deployment targets

| Target | Config file | Notes |
|--------|-------------|-------|
| Render | `backend/Dockerfile` | Set `DATABASE_URL`, JWT secret, Cloudinary env vars |
| Vercel (frontend only) | `vercel.json` | Proxies `/api` to Render backend |
| Cloudflare Workers | `wrangler.jsonc` | TanStack Start SSR path |
| Docker Compose | `backend/src/main/docker/app.yml` | App + PostgreSQL containers |

For self-hosted production (recommended for this project), use the PM2 + Nginx flow above.
