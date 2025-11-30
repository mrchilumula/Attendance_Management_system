#!/bin/bash

# After Install Script
echo "Running after install..."

cd /var/app/attendance-backend

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Set permissions
sudo chown -R ec2-user:ec2-user /var/app/attendance-backend

echo "After install complete"
