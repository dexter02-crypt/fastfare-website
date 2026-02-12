#!/bin/bash
# ═══════════════════════════════════════════════
# FastFare Auto Deploy Script
# Just run: bash deploy.sh
# ═══════════════════════════════════════════════

set -e
DOMAIN="fastfare.org"
REPO="https://github.com/sid7985/fastfare-website.git"
APP_DIR="/var/www/fastfare"

echo "🚀 FastFare Auto Deploy Starting..."
echo "═══════════════════════════════════════"

# ── Step 1: Install everything ──
echo "📦 Installing Node.js, Nginx, PM2, MongoDB..."
apt update -y
apt install -y curl gnupg nginx git

# Node.js 20
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "✅ Node.js $(node -v)"

# PM2
npm install -g pm2 2>/dev/null
echo "✅ PM2 installed"

# MongoDB 7
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
    echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update -y && apt install -y mongodb-org
fi
systemctl enable --now mongod
echo "✅ MongoDB running"

# ── Step 2: Clone code ──
echo "📂 Cloning repository..."
rm -rf $APP_DIR
mkdir -p $APP_DIR
git clone $REPO $APP_DIR
echo "✅ Code cloned"

# ── Step 3: Setup Backend ──
echo "⚙️  Setting up backend..."
cd $APP_DIR/backend
npm install --production

# Generate JWT secret
JWT=$(openssl rand -hex 32)

# Create .env
cat > .env << ENVEOF
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://localhost:27017/fastfare
JWT_SECRET=$JWT
BACKEND_URL=https://$DOMAIN

# Add your API keys below (site works without them, just payments/KYC won't)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
DIDIT_API_URL=https://api.didit.me
DIDIT_API_KEY=
DIDIT_WORKFLOW_ID=
DIDIT_WEBHOOK_SECRET=
ENVEOF

echo "✅ Backend configured"

# ── Step 4: Start backend with PM2 ──
echo "🔄 Starting backend..."
pm2 delete fastfare-api 2>/dev/null || true
cd $APP_DIR/backend
pm2 start src/server.js --name fastfare-api
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "✅ Backend running on port 5000"

# ── Step 5: Build Frontend ──
echo "🏗️  Building frontend..."
cd $APP_DIR/frontend-ui
npm install
echo "VITE_API_URL=https://$DOMAIN/api" > .env.production
npm run build
echo "✅ Frontend built"

# ── Step 6: Configure Nginx ──
echo "🌐 Setting up Nginx..."
cat > /etc/nginx/sites-available/fastfare << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/frontend-ui/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 10M;
    }

    location /uploads/ {
        alias $APP_DIR/backend/uploads/;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/fastfare /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo "✅ Nginx configured"

# ── Step 7: Firewall ──
echo "🔒 Setting up firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
echo "✅ Firewall enabled"

# ── Step 8: SSL ──
echo "🔐 Setting up SSL..."
apt install -y certbot python3-certbot-nginx
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "⚠️  SSL setup skipped - make sure DNS is pointed to this server first"

echo ""
echo "═══════════════════════════════════════"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════"
echo ""
echo "🌐 Site: https://$DOMAIN"
echo "🔧 API:  https://$DOMAIN/api"
echo ""
echo "📝 To add your API keys later:"
echo "   nano $APP_DIR/backend/.env"
echo "   pm2 restart fastfare-api"
echo ""
echo "📋 PM2 status: pm2 status"
echo "📋 View logs:  pm2 logs fastfare-api"
echo "═══════════════════════════════════════"
