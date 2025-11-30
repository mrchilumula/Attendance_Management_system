#!/bin/bash

# Post-deploy hook to ensure services are running
cd /var/app/current/backend

# Restart the application
pm2 restart all || pm2 start dist/index.js --name "attendance-backend"
