#!/bin/bash

# Stop existing application
echo "Stopping existing application..."

# Stop PM2 if running
if command -v pm2 &> /dev/null; then
    pm2 stop all || true
    pm2 delete all || true
fi

# Kill any process on port 5000
fuser -k 5000/tcp || true

echo "Application stopped"
