# 🚀 Vercel Deployment Guide - Attendance Management System

Complete step-by-step guide to deploy the Attendance Management System on Vercel.

---

## 📋 Overview

- **Frontend**: React + Vite → Deploy on Vercel
- **Backend**: Node.js + Express → Deploy on Vercel Serverless Functions or Render/Railway
- **Database**: MySQL → Use Planetscale or AWS RDS

---

## Part 1: Frontend Deployment (Vercel)

### Prerequisites
- GitHub account with repository pushed
- Vercel account (sign up at vercel.com)

### Step 1: Push Frontend to GitHub

```bash
# Initialize git (if not already done)
cd d:\Attendance_Management
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Attendance_Management.git
git push -u origin main
```

### Step 2: Create Vercel Account & Connect GitHub

1. Visit [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → Choose **"GitHub"**
3. Authorize Vercel to access your GitHub repositories
4. Click **"New Project"**

### Step 3: Import Frontend Repository

1. Select your **Attendance_Management** repository
2. Click **"Import"**

### Step 4: Configure Frontend Build Settings

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 5: Add Environment Variables

Click **"Environment Variables"** and add:

```
VITE_API_URL=https://your-backend-url.com/api
```

**Note**: Replace `your-backend-url` with your backend API URL (see Part 2)

### Step 6: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Your frontend will be live at `https://your-project.vercel.app`

---

## Part 2: Backend Deployment Options

### Option A: Deploy on Vercel (Recommended for testing)

#### Step 1: Create `vercel.json` Configuration

Create `backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DB_HOST": "@db_host",
    "DB_USER": "@db_user",
    "DB_PASSWORD": "@db_password",
    "DB_NAME": "@db_name",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

#### Step 2: Create `backend/package.json` Scripts

Make sure your `package.json` has:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

#### Step 3: Update `backend/src/config.ts`

```typescript
export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'attendance_management'
  }
};
```

#### Step 4: Setup Database (Planetscale)

1. Visit [planetscale.com](https://planetscale.com)
2. Sign up and create new database
3. Get connection string (username, password, host)
4. Create tables using provided migration scripts

#### Step 5: Deploy Backend to Vercel

```bash
cd backend
vercel deploy --prod
```

This will prompt you to:
- Link to existing project or create new
- Set environment variables
- Deploy

#### Step 6: Add Environment Variables in Vercel Dashboard

```
DB_HOST: your-db-host.psdb.cloud
DB_USER: your-db-username
DB_PASSWORD: your-db-password
DB_NAME: attendance_management
JWT_SECRET: your-secret-key-here
NODE_ENV: production
```

---

### Option B: Deploy on Render (Better for long-running apps)

#### Step 1: Create Account

1. Visit [render.com](https://render.com)
2. Sign up with GitHub

#### Step 2: Create New Web Service

1. Click **"New+"** → **"Web Service"**
2. Connect to GitHub repository
3. Select your repository

#### Step 3: Configure Service

```
Name: attendance-backend
Environment: Node
Build Command: npm install && npm run build
Start Command: npm start
```

#### Step 4: Add Environment Variables

Dashboard → Environment:

```
DB_HOST: your-planetscale-host
DB_USER: your-username
DB_PASSWORD: your-password
DB_NAME: attendance_management
JWT_SECRET: your-secret-key
NODE_ENV: production
```

#### Step 5: Deploy

Click **"Deploy"** and wait for completion. Your backend will be at `https://your-backend.onrender.com`

---

### Option C: Deploy on Railway (Fast & Simple)

1. Visit [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub"**
4. Choose repository and branch
5. Add MySQL plugin from Railway marketplace
6. Set environment variables
7. Deploy

---

## Part 3: Database Setup (Planetscale)

### Step 1: Create Database

1. Sign up at [planetscale.com](https://planetscale.com)
2. Create new database
3. Get connection credentials

### Step 2: Connect and Initialize

```bash
# Install mysql client
npm install -g mysql2

# Connect to database
mysql -h your-host.psdb.cloud -u your-user -p

# Run initialization script
source backend/src/database/init.sql
```

### Step 3: Seed Data

```bash
# Add sample data
npm run db:seed
```

---

## Part 4: Update Frontend API URL

### Step 1: Update Environment Variables

`frontend/.env.production`:

```
VITE_API_URL=https://your-backend-url.com/api
```

### Step 2: Update Frontend Config

`frontend/src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Step 3: Redeploy Frontend

```bash
git add .
git commit -m "Update API URL for production"
git push origin main
```

Vercel will automatically redeploy.

---

## Part 5: Verification Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend API deployed (Vercel/Render/Railway)
- [ ] Database created on Planetscale
- [ ] Environment variables configured
- [ ] Frontend connects to backend API
- [ ] Login page accessible
- [ ] Can login with credentials
- [ ] Attendance features working
- [ ] CORS enabled on backend
- [ ] SSL certificates active (auto)

---

## Useful Commands

### Check Deployment Status

```bash
# Vercel CLI
vercel logs          # View logs
vercel env list      # View environment variables

# Frontend rebuild
vercel rebuild

# Backend logs
vercel logs --backend
```

### Local Testing Before Deploy

```bash
# Test frontend build
npm run build
npm run preview

# Test backend
npm run build
npm start
```

### Database Backup

```bash
# Export database
mysqldump -h host -u user -p database > backup.sql

# Import database
mysql -h host -u user -p database < backup.sql
```

---

## Troubleshooting

### Issue: CORS Errors
**Solution**: Add to backend `src/index.ts`:
```typescript
app.use(cors({
  origin: 'https://your-frontend.vercel.app',
  credentials: true
}));
```

### Issue: Database Connection Fails
**Solution**: 
- Check credentials in environment variables
- Verify database is accessible
- Check firewall rules (Planetscale allows all IPs by default)

### Issue: Build Fails on Vercel
**Solution**:
- Check logs: `vercel logs`
- Verify all dependencies are listed in `package.json`
- Ensure TypeScript compiles: `npm run build` locally

### Issue: Slow Initial Load
**Solution**:
- Add cold start optimization
- Use Render instead of Vercel for backend
- Add caching headers

---

## Production URLs

Once deployed:

- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://your-backend.onrender.com/api`
- **Database**: `your-db.psdb.cloud`

---

## Final Steps

1. **Test all features** on production URL
2. **Update documentation** with new URLs
3. **Setup monitoring** (Vercel built-in analytics)
4. **Configure custom domain** (optional)
5. **Enable auto-deployments** on `git push`

---

## Support & Resources

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Planetscale Docs](https://planetscale.com/docs)
- [Express.js Deployment](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Happy Deploying! 🎉**
