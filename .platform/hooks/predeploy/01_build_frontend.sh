#!/bin/bash

# Build frontend for production
cd /var/app/current/frontend
npm install
npm run build
