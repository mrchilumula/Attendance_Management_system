#!/bin/bash

# Start Server Script
echo "Starting application..."

cd /var/app/attendance-backend

# Set environment variables (these should be set in EC2 or AWS Systems Manager)
export NODE_ENV=production
export PORT=5000

# Start with PM2
pm2 start dist/index.js --name "attendance-backend"

# Save PM2 process list
pm2 save

# Setup PM2 to restart on reboot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "Application started"
