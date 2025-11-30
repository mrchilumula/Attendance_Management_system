#!/bin/bash

# Before Install Script
echo "Running before install..."

# Install Node.js 18 if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/app/attendance-backend

# Set permissions
sudo chown -R ec2-user:ec2-user /var/app

echo "Before install complete"
