#!/bin/bash
# Wolent CMS + Flower Blog startup script
# Usage: bash /root/wolent-cms/start.sh

export PATH="/root/.hermes/node/bin:$PATH"

echo "🌸 Starting Wolent CMS + Flower Blog..."

# Kill existing processes
fuser -k 3001/tcp 2>/dev/null
fuser -k 3002/tcp 2>/dev/null
kill $(pgrep cloudflared) 2>/dev/null
sleep 2

# Start Wolent CMS (API + Admin on port 3001)
echo "⚙️  Starting Wolent CMS on port 3001..."
cd /root/wolent-cms
DATABASE_URL="file:/root/wolent-cms/packages/database/prisma/dev.db" \
  node packages/core/dist/index.js &
CMS_PID=$!
sleep 3

# Verify CMS started
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ | grep -q "200"; then
  echo "✅ Wolent CMS running (PID: $CMS_PID)"
else
  echo "❌ Wolent CMS failed to start!"
fi

# Start Flower Blog (Next.js on port 3002)
echo "🌸 Starting Flower Blog on port 3002..."
cd /root/flower-blog
WOLENT_API_URL=http://localhost:3001 \
WOLENT_API_TOKEN=6454e346ac2ab93036e3af1c327070cc7a2dae6f806a4e259b52093990494488d3fa9643d602f454b56c8339add6d80f \
  npm run start -- -p 3002 &
BLOG_PID=$!
sleep 3

# Verify Blog started
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 | grep -q "200"; then
  echo "✅ Flower Blog running (PID: $BLOG_PID)"
else
  echo "❌ Flower Blog failed to start!"
fi

# Start Cloudflare Tunnels
echo "🌐 Starting Cloudflare tunnels..."
cloudflared tunnel --url http://localhost:3001 &
sleep 5
cloudflared tunnel --url http://localhost:3002 &
sleep 5

echo ""
echo "========================================="
echo "🌸 All services started!"
echo "========================================="
echo "CMS Admin + API: http://localhost:3001"
echo "Flower Blog:     http://localhost:3002"
echo ""
echo "Check tunnel URLs above from cloudflared logs"
echo "Admin: admin@flowers.com / FlowerAdmin2024!"
echo "========================================="
