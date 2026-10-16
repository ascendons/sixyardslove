#!/usr/bin/env bash
# ============================================================
# EC2 Bootstrap — runs once as user-data on first boot
# (Also safe to run manually after SSH in)
# ============================================================
# Installs:
#   - Java 17 (OpenJDK)
#   - Nginx (reverse proxy on port 80)
#   - PostgreSQL 16
#   - Creates app user, directories, DB, sudoers rule
# ============================================================
set -euo pipefail
exec > /var/log/syl-bootstrap.log 2>&1
echo "=== Bootstrap started $(date) ==="

# ── Update system ─────────────────────────────────────────────────────────────
apt-get update -y
apt-get upgrade -y

# ── Install packages ──────────────────────────────────────────────────────────
apt-get install -y \
  openjdk-17-jdk-headless \
  nginx \
  postgresql \
  postgresql-contrib \
  curl \
  unzip \
  htop

# ── Verify Java ───────────────────────────────────────────────────────────────
java -version

# ── Nginx: IP-based config (no domain required) ───────────────────────────────
# Remove default site
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/syl-backend <<'NGINX'
server {
    listen 80 default_server;
    server_name _;

    # ── Security headers ──────────────────────────────────────────────
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;

    # ── Proxy all /api/* → Spring Boot on 8081 ────────────────────────
    location /api/ {
        proxy_pass         http://127.0.0.1:8081/;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout    60s;
    }

    # ── Health check (no auth) ────────────────────────────────────────
    location /health {
        proxy_pass http://127.0.0.1:8081/actuator/health;
        access_log off;
    }

    # ── Block direct port 8081 access reminder ────────────────────────
    location / {
        return 200 'Six Yards Love backend OK';
        add_header Content-Type text/plain;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/syl-backend /etc/nginx/sites-enabled/
nginx -t
systemctl enable nginx
systemctl restart nginx

# ── PostgreSQL setup ──────────────────────────────────────────────────────────
systemctl enable postgresql
systemctl start postgresql

# Create DB user and database
sudo -u postgres psql <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'syl_user') THEN
    CREATE USER syl_user WITH PASSWORD 'CHANGE_THIS_PASSWORD_NOW';
  END IF;
END
$$;

SELECT 'CREATE DATABASE syl_db OWNER syl_user'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'syl_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE syl_db TO syl_user;
SQL

# ── App directory ─────────────────────────────────────────────────────────────
mkdir -p /opt/ecom-backend
chown ubuntu:ubuntu /opt/ecom-backend

mkdir -p /etc/ecom-backend
chmod 700 /etc/ecom-backend

# ── Env file (placeholder — fill in real values) ─────────────────────────────
cat > /etc/ecom-backend/env <<'ENV'
# Edit this file: sudo nano /etc/ecom-backend/env
# Then run: sudo systemctl restart ecom-backend
DB_URL=jdbc:postgresql://localhost:5432/syl_db
DB_USERNAME=syl_user
DB_PASSWORD=CHANGE_THIS_PASSWORD_NOW

# Generate: openssl rand -base64 32
JWT_SECRET=CHANGE_THIS_JWT_SECRET_NOW

# Will be updated after first deploy (use CloudFront URL)
CORS_ORIGINS=http://localhost:3000
ENV
chmod 600 /etc/ecom-backend/env

# ── systemd service ──────────────────────────────────────────────────────────
cat > /etc/systemd/system/ecom-backend.service <<'SERVICE'
[Unit]
Description=Six Yards Love E-com Spring Boot Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt/ecom-backend
EnvironmentFile=/etc/ecom-backend/env
ExecStart=/usr/bin/java \
  -Xms256m -Xmx512m \
  -Dspring.profiles.active=prod \
  -jar /opt/ecom-backend/ecom-backend.jar
ExecStop=/bin/kill -SIGTERM $MAINPID
TimeoutStopSec=30
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ecom-backend

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
# Don't start yet — no JAR deployed

# ── Passwordless sudo for GitHub Actions deploy ───────────────────────────────
echo "ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart ecom-backend, /bin/systemctl status ecom-backend, /bin/systemctl start ecom-backend" \
  > /etc/sudoers.d/ecom-backend
chmod 440 /etc/sudoers.d/ecom-backend

# ── Done ─────────────────────────────────────────────────────────────────────
echo "=== Bootstrap complete $(date) ==="
echo "=== Next: deploy the JAR and update /etc/ecom-backend/env ==="
