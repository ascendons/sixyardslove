# AWS + CI/CD Setup Guide — Six Yards Love E-com

Complete, step-by-step guide to deploy sixyardslove.com on AWS.
**Cost estimate: ~$10–15/month** (EC2 t3.micro + S3 + CloudFront + data transfer).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [IAM User with minimal permissions](#2-iam-user-with-minimal-permissions)
3. [S3 — Frontend Hosting](#3-s3--frontend-hosting)
4. [ACM — SSL Certificate](#4-acm--ssl-certificate)
5. [CloudFront — CDN for Frontend](#5-cloudfront--cdn-for-frontend)
6. [EC2 — Backend Server](#6-ec2--backend-server)
7. [PostgreSQL on EC2](#7-postgresql-on-ec2)
8. [Nginx + SSL on EC2](#8-nginx--ssl-on-ec2)
9. [systemd Service](#9-systemd-service)
10. [DNS Records](#10-dns-records)
11. [GitHub Secrets](#11-github-secrets)
12. [CI/CD Workflow Summary](#12-cicd-workflow-summary)
13. [Cost Breakdown](#13-cost-breakdown)
14. [Common Pitfalls](#14-common-pitfalls)

---

## 1. Prerequisites

- AWS account (free tier eligible)
- GitHub repo with this monorepo
- Domain `sixyardslove.com` registered at external registrar (e.g., GoDaddy, Namecheap)
- Local tools: `aws cli`, `ssh`

Install AWS CLI:
```bash
brew install awscli        # macOS
aws configure              # enter your IAM key/secret, region (e.g. ap-south-1), output: json
```

---

## 2. IAM User with Minimal Permissions

Create a dedicated deploy user. **Never use your root account in CI.**

### In AWS Console → IAM → Users → Create User

Name: `syl-github-deploy`

Attach these **inline policies** (not broad managed policies):

**Policy 1 — S3 deploy access** (replace `YOUR_BUCKET_NAME`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket", "s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    }
  ]
}
```

**Policy 2 — CloudFront invalidation**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "*"
    }
  ]
}
```

After creating the user → **Security credentials → Create access key** → choose "Application running outside AWS" → save the key ID and secret.

---

## 3. S3 — Frontend Hosting

> The S3 bucket will NOT be public. CloudFront will access it via OAC (Origin Access Control). This is more secure than static website hosting.

### Step 1 — Create bucket

```bash
# Use ap-south-1 (Mumbai) for India users, or us-east-1 for global
aws s3 mb s3://syl-frontend --region ap-south-1
```

### Step 2 — Block all public access (leave defaults ON)

In console: S3 → your bucket → Permissions → Block Public Access → keep all 4 checkboxes ON.

### Step 3 — Do NOT enable Static Website Hosting

CloudFront will handle routing (including SPA fallback to index.html).

---

## 4. ACM — SSL Certificate

> CRITICAL: ACM certificates for CloudFront MUST be created in **us-east-1**, regardless of where your S3/EC2 are.

### Step 1 — Request certificate

AWS Console → Certificate Manager → **switch region to us-east-1** → Request certificate

- Domain: `sixyardslove.com`
- Add another name: `www.sixyardslove.com`
- Validation: DNS validation (recommended)

### Step 2 — Validate domain ownership

ACM will show you two CNAME records to add to your DNS provider.
Add them at your registrar (GoDaddy/Namecheap/etc.) and wait 5–30 minutes for validation.

### Step 3 — Note the certificate ARN

You'll need it in the next step.

---

## 5. CloudFront — CDN for Frontend

### Step 1 — Create distribution

AWS Console → CloudFront → Create distribution

| Setting | Value |
|---------|-------|
| Origin domain | Select your S3 bucket from dropdown |
| Origin access | **Origin access control settings (recommended)** |
| Create new OAC | Yes (default settings) |
| Viewer protocol policy | **Redirect HTTP to HTTPS** |
| Allowed HTTP methods | GET, HEAD |
| Cache policy | CachingOptimized |
| Compress objects | Yes |
| Alternate domain names (CNAMEs) | `sixyardslove.com`, `www.sixyardslove.com` |
| Custom SSL certificate | Select the ACM cert from us-east-1 |
| Default root object | `index.html` |

### Step 2 — SPA routing (React Router fix)

After creating, go to the distribution → **Error pages** → Create custom error response:

| HTTP error code | Response page path | HTTP response code |
|-----------------|--------------------|--------------------|
| 403 | /index.html | 200 |
| 404 | /index.html | 200 |

This makes React Router work for direct URL access (e.g. `sixyardslove.com/products/123`).

### Step 3 — Update S3 bucket policy

After creating OAC, CloudFront will show you a bucket policy to copy. Go to:
S3 → your bucket → Permissions → Bucket policy → paste it.

### Step 4 — Note the distribution ID

You'll need it for the `CLOUDFRONT_DISTRIBUTION_ID` GitHub secret.

---

## 6. EC2 — Backend Server

### Step 1 — Launch instance

AWS Console → EC2 → Launch Instance

| Setting | Value |
|---------|-------|
| Name | syl-backend |
| AMI | Ubuntu 24.04 LTS (free tier eligible) |
| Instance type | **t3.micro** (~$8.50/month, or free tier t2.micro for 12 months) |
| Key pair | Create new → download `.pem` file → store safely |
| Network | Default VPC |
| Auto-assign public IP | Enable |

**Security group rules** (create new: `syl-backend-sg`):

| Type | Port | Source | Purpose |
|------|------|--------|---------|
| SSH | 22 | Your IP only (My IP) | Admin access |
| HTTP | 80 | 0.0.0.0/0 | Nginx (redirects to HTTPS) |
| HTTPS | 443 | 0.0.0.0/0 | API traffic |

> Do NOT open port 8081 to the internet. Nginx proxies to it internally.

### Step 2 — Allocate an Elastic IP

EC2 → Elastic IPs → Allocate → Associate with your instance.
This gives you a static IP that survives reboots.

### Step 3 — Connect and install Java

```bash
# SSH in (replace with your key and IP)
ssh -i ~/Downloads/syl-key.pem ubuntu@YOUR_ELASTIC_IP

# Install Java 17
sudo apt update && sudo apt install -y openjdk-17-jdk nginx certbot python3-certbot-nginx

# Verify
java -version   # should show openjdk 17
```

### Step 4 — Create app directory

```bash
sudo mkdir -p /opt/ecom-backend
sudo chown ubuntu:ubuntu /opt/ecom-backend
sudo mkdir -p /etc/ecom-backend
```

---

## 7. PostgreSQL on EC2

Running Postgres on the same EC2 is the cheapest option. For production scale, use RDS, but t3.micro + local Postgres works fine for early-stage.

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql <<'SQL'
CREATE USER syl_user WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE DATABASE syl_db OWNER syl_user;
GRANT ALL PRIVILEGES ON DATABASE syl_db TO syl_user;
SQL

# Initialize schema (copy your SQL files to EC2 first, or run via CI)
# psql -U syl_user -d syl_db -f /path/to/schema.sql
```

The DB URL for your env file:
```
DB_URL=jdbc:postgresql://localhost:5432/syl_db
```

---

## 8. Nginx + SSL on EC2

### Step 1 — Install Nginx config

```bash
# Copy the config file (from your repo: infra/nginx/api.sixyardslove.com.conf)
sudo cp /path/to/infra/nginx/api.sixyardslove.com.conf /etc/nginx/sites-available/api.sixyardslove.com
sudo ln -s /etc/nginx/sites-available/api.sixyardslove.com /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### Step 2 — Get SSL certificate via Let's Encrypt

> Make sure your DNS is pointing to EC2 BEFORE running this (see DNS section).

```bash
sudo certbot --nginx -d api.sixyardslove.com

# Follow prompts — certbot will:
# 1. Verify domain ownership via HTTP
# 2. Get a free certificate
# 3. Auto-update your nginx config with SSL paths

# Verify auto-renewal
sudo certbot renew --dry-run
```

Certbot auto-renews via a systemd timer — nothing else needed.

---

## 9. systemd Service

```bash
# Copy service file from your repo
sudo cp /path/to/infra/systemd/ecom-backend.service /etc/systemd/system/

# Create the env file (NEVER commit this file)
sudo cp /path/to/infra/systemd/env.example /etc/ecom-backend/env
sudo nano /etc/ecom-backend/env    # fill in real values
sudo chmod 600 /etc/ecom-backend/env

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable ecom-backend
sudo systemctl start ecom-backend

# Check status
sudo systemctl status ecom-backend

# View live logs
journalctl -u ecom-backend -f
```

---

## 10. DNS Records

Add these at your registrar's DNS management panel.

### For sixyardslove.com (Frontend → CloudFront)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | `YOUR_CF_DISTRIBUTION.cloudfront.net` | 3600 |
| CNAME | @ (root) | `YOUR_CF_DISTRIBUTION.cloudfront.net` | 3600 |

> **Note:** Some registrars don't support CNAME at root. Use an ALIAS/ANAME record if available, or use Cloudflare (free) as a DNS proxy.

### For api.sixyardslove.com (Backend → EC2)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | api | `YOUR_EC2_ELASTIC_IP` | 3600 |

### Google Workspace MX Records (preserve these — do not touch)

Your registrar already has these. Just don't delete them when adding the above.

| Type | Name | Priority | Value |
|------|------|----------|-------|
| MX | @ | 1 | ASPMX.L.GOOGLE.COM |
| MX | @ | 5 | ALT1.ASPMX.L.GOOGLE.COM |
| MX | @ | 5 | ALT2.ASPMX.L.GOOGLE.COM |
| MX | @ | 10 | ALT3.ASPMX.L.GOOGLE.COM |
| MX | @ | 10 | ALT4.ASPMX.L.GOOGLE.COM |

---

## 11. GitHub Secrets

Go to: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

| Secret Name | Value | Where used |
|-------------|-------|------------|
| `AWS_ACCESS_KEY_ID` | IAM user key ID | Both jobs |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret | Both jobs |
| `AWS_REGION` | e.g. `ap-south-1` | Frontend job |
| `S3_BUCKET_NAME` | e.g. `syl-frontend` | Frontend job |
| `CLOUDFRONT_DISTRIBUTION_ID` | From CloudFront console | Frontend job |
| `VITE_API_URL` | `https://api.sixyardslove.com` | Frontend build |
| `EC2_HOST` | Your Elastic IP address | Backend job |
| `EC2_USERNAME` | `ubuntu` | Backend job |
| `EC2_SSH_KEY` | Contents of your `.pem` file | Backend job |
| `RZP_KEY_ID` | Razorpay key ID | Backend job |
| `RZP_KEY_SECRET` | Razorpay key secret | Backend job |

To get the SSH key content:
```bash
cat ~/Downloads/syl-key.pem
# Copy the entire output including BEGIN/END lines
```

---

## 12. CI/CD Workflow Summary

```
Push to main
    │
    ├── syl-web/** changed?
    │       ↓
    │   npm ci → npm run build
    │       ↓
    │   aws s3 sync dist/ → S3
    │       ↓
    │   CloudFront invalidation
    │
    └── backend/** changed?
            ↓
        mvn package -DskipTests
            ↓
        scp JAR → EC2:/opt/ecom-backend/ecom-backend.jar
            ↓
        ssh → sudo systemctl restart ecom-backend
```

Both can run in parallel if both change at once.

---

## 13. Cost Breakdown

| Service | Spec | Monthly Cost |
|---------|------|--------------|
| EC2 t3.micro | 2 vCPU, 1GB RAM | ~$8.50 (or free for 12mo with t2.micro) |
| S3 | ~1GB storage + requests | ~$0.50 |
| CloudFront | 1TB data transfer free/mo | ~$0–2 |
| ACM certificate | For CloudFront | **Free** |
| Let's Encrypt (API SSL) | On EC2 | **Free** |
| Elastic IP | When attached to running instance | **Free** |
| Data transfer | Depends on traffic | ~$0–5 |
| **Total** | | **~$10–16/month** |

> Free tier: t2.micro is free for 12 months. After that, t3.micro at ~$8.50/month.
> Postgres on same EC2 = no extra cost vs RDS ($15+/month).

---

## 14. Common Pitfalls

### Frontend

| Pitfall | Fix |
|---------|-----|
| React Router returns 403/404 on refresh | Set CloudFront error pages: 403→index.html (200), 404→index.html (200) |
| Old assets served after deploy | CloudFront invalidation is in the workflow — ensure `CLOUDFRONT_DISTRIBUTION_ID` secret is set |
| `VITE_API_URL` is undefined in production | Set it as a GitHub secret named `VITE_API_URL`, already wired in the workflow |
| ACM certificate not appearing in CloudFront | Cert must be in **us-east-1** even if everything else is in another region |
| CNAME at root domain not working | Use Cloudflare free DNS (supports CNAME flattening at root) or ALIAS record at registrar |

### Backend

| Pitfall | Fix |
|---------|-----|
| App starts but API returns 403 | Check CORS_ORIGINS in `/etc/ecom-backend/env` — must include `https://sixyardslove.com` |
| Port 8081 unreachable | Correct — it's internal only. Nginx proxies to it. Don't open it in security groups |
| Service won't start after deploy | Run `journalctl -u ecom-backend -n 50` to see the error |
| SSH deploy fails | Ensure security group allows SSH from GitHub Actions IPs, OR allow from 0.0.0.0/0 temporarily (then restrict) |
| JWT_SECRET changed between deploys | Env file is persistent on EC2, won't change unless you edit it manually |
| Postgres connection refused | Check `sudo systemctl status postgresql` and that `DB_URL` uses `localhost`, not `127.0.0.1` (or vice versa) |

### CI/CD

| Pitfall | Fix |
|---------|-----|
| Both jobs always run | Make sure you push from a branch with history; `fetch-depth: 0` is required for path-filter |
| `mvn package` times out | First run downloads dependencies — subsequent runs use cache. Normal behavior |
| SCP fails with "Permission denied" | The ubuntu user must own `/opt/ecom-backend/` — set with `sudo chown ubuntu:ubuntu /opt/ecom-backend` |
| `systemctl restart` requires sudo password | Add ubuntu to sudoers for this specific command (see below) |

### Fix for passwordless sudo restart

On EC2, run once:
```bash
echo "ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart ecom-backend, /bin/systemctl status ecom-backend" \
  | sudo tee /etc/sudoers.d/ecom-backend
```
