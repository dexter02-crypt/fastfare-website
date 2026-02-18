#!/bin/bash
# ═══════════════════════════════════════════════
# FastFare Auto Deploy Script
# Just run: bash deploy.sh
# ═══════════════════════════════════════════════

set -e
DOMAIN="fastfare.org"
REPO="https://github.com/dexter02-crypt/fastfare-website.git"
APP_DIR="/var/www/fastfare"

echo "🚀 FastFare Auto Deploy Starting..."
echo "═══════════════════════════════════════"

# ── Step 1: Install everything ──
echo "📦 Installing Node.js, Nginx, PM2..."
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

# Preserve existing .env if it exists
if [ -f /root/fastfare-backup.env ]; then
    cp /root/fastfare-backup.env .env
    echo "✅ Restored .env from backup"
else
    # Generate JWT secret
    JWT=$(openssl rand -hex 32)

    cat > .env << ENVEOF
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://fastfare:fastfare@cluster1.brrqru3.mongodb.net/?appName=Cluster1
JWT_SECRET=$JWT
BACKEND_URL=https://$DOMAIN
GSTIN_VERIFY_API_KEY=15ae8a07ed2c3975f0a9006262b3cf16

# Razorpay
RAZORPAY_KEY_ID=rzp_live_u8ji0UIci9le5W
RAZORPAY_KEY_SECRET=rMiwNkvCNgF2bOh3m6Z9NJ8A

# Didit.me KYC
DIDIT_API_KEY=cHJUH-OVRDyO-_hvcGHZ6ezfSpPKP0i1qDxqZ8cP8GY
DIDIT_WEBHOOK_SECRET=d3gxma_T7gW4OvtSKSo-AUXD-B7wXdDmTbJC5Dflre0
DIDIT_WORKFLOW_ID=b17c98eb-b0d1-464b-a994-74cc61a716b7
DIDIT_API_URL=https://verification.didit.me/v2

# Admin seed (production)
ADMIN_EMAIL=admin@fastfare.com
ADMIN_PASSWORD=FastFare@Admin2026!
ENVEOF

    # Backup .env for future deploys
    cp .env /root/fastfare-backup.env
    echo "✅ Backend .env created & backed up"
fi

echo "✅ Backend configured"

# ── Step 4: Start backend with PM2 ──
echo "🔄 Starting backend..."
pm2 delete fastfare-api 2>/dev/null || true
cd $APP_DIR/backend
NODE_ENV=production pm2 start src/server.js --name fastfare-api --node-args="--max-old-space-size=512"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "✅ Backend running on port 5000"

# ── Step 5: Build Frontend ──
echo "🏗️  Building frontend..."
cd $APP_DIR/frontend-ui
npm install

cat > .env.production << FEENVEOF
VITE_API_URL=https://$DOMAIN
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAa1oV7WmW3CvLvDzvdWLUzO3FzahBzhZk
FEENVEOF

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

    # Frontend SPA
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
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

    # Socket.io WebSocket proxy
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }

    # Uploaded files
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
echo "📋 PM2 status: pm2 status"
echo "📋 View logs:  pm2 logs fastfare-api"
echo "═══════════════════════════════════════"
