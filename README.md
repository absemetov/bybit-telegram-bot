# 🚀 Bybit Trading Terminal

A powerful trading simulator. Includes a web-based charting interface, algorithmic trading engine, Telegram notifications,
and advanced strategy optimization with Sharpe/Sortino metrics.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Variables](#environment-variables)
4. [Build Frontend](#build-frontend)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL with Certbot](#ssl-with-certbot)
7. [Running with PM2](#running-with-pm2)

---

## Prerequisites

- **Ubuntu Server** (20.04 / 22.04 / 24.04 / 25.10)
- Node.js **22.x** (LTS)
- Yarn (classic or modern)
- Git
- Nginx
- PM2 (process manager)
- Domain name (optional, but required for SSL)

---

## Installation

### 1. Update system and install base packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx
```
### 2. Install Node.js 22.x
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```
### 3. Install Yarn
```bash
sudo npm install -g yarn
```
### 4. Clone the repository
```bash
sudo mkdir -p /opt
cd /opt
sudo git clone https://github.com/absemetov/bybit-telegram-bot.git
sudo chown -R $USER:$USER /opt/bybit-telegram-bot
cd /opt/bybit-telegram-bot
```
### 5. Install project dependencies
```bash
yarn install
```
## Environment Variables
Create a .env file from the example and fill in your real keys:
```bash
cp .env.example .env
nano .env
```
### Required variables:
```bash
PORT=3003
#telegram bot
TELEGRAM_BOT_TOKEN=
#bybit api main account
BYBIT_API_KEY=
BYBIT_API_SECRET=
#bybit api for subaccount
BYBIT_SUB_API_KEY=
BYBIT_SUB_API_SECRET=
#firebase
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=""
```
## Build Frontend
The web terminal is built with Vite. Compile the templates and bundle the JavaScript:
```bash
yarn build
```
After the build, the static files will be in the `dist` folder.

## Nginx Configuration
Create a configuration file for your site:
```bash
sudo nano /etc/nginx/sites-available/bybit
```
Paste the following (replace server_name with your domain or IP):
```bash
server {
    listen 80;
    server_name your-domain.com;

    root /opt/bybit-telegram-bot/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```
Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/bybit /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # remove default site if present
sudo nginx -t
sudo systemctl reload nginx
```
## SSL with Certbot
After pointing your domain to the server, obtain a free SSL certificate:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```
Follow the on‑screen instructions. Certbot will automatically renew the certificates.
```bash
sudo certbot renew --dry-run
```
## Running with PM2
Install PM2 globally and start the application:
```bash
sudo npm install -g pm2
yarn start
pm2 save
pm2 startup systemd
```
You may be using [Live Preview](https://a76e317e.bybit-telegram-bot.pages.dev/)