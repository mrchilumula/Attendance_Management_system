# 🚀 Pre-Deployment Checklist

Use this checklist before deploying to production.

## Backend Preparation

- [ ] **Build & Test**
  ```bash
  cd backend
  npm run build
  npm start
  ```
  Test on `http://localhost:5000`

- [ ] **Environment Variables Configured**
  - [ ] DB_HOST
  - [ ] DB_USER
  - [ ] DB_PASSWORD
  - [ ] DB_NAME
  - [ ] JWT_SECRET
  - [ ] NODE_ENV=production

- [ ] **Database Migration**
  - [ ] Tables created on Planetscale/RDS
  - [ ] Initial seed data inserted
  - [ ] Backups configured

- [ ] **CORS Configuration**
  - [ ] Frontend URL whitelisted
  - [ ] Credentials enabled
  - [ ] Preflight requests allowed

- [ ] **Error Handling**
  - [ ] All endpoints have error handling
  - [ ] Logs are being captured
  - [ ] 404 and 500 handlers configured

- [ ] **Security**
  - [ ] HTTPS enforced
  - [ ] JWT secret is strong (32+ chars)
  - [ ] Password hashing enabled (bcrypt)
  - [ ] Rate limiting considered
  - [ ] Input validation on all routes

## Frontend Preparation

- [ ] **Build & Test**
  ```bash
  cd frontend
  npm run build
  npm run preview
  ```
  Test the production build locally

- [ ] **Environment Variables**
  - [ ] VITE_API_URL set to backend URL
  - [ ] `.env.production` configured

- [ ] **Code Quality**
  - [ ] No console.errors in build
  - [ ] TypeScript compiles without errors
  - [ ] All imports resolved
  - [ ] No hardcoded URLs

- [ ] **Testing**
  - [ ] Login functionality works
  - [ ] API calls connect to backend
  - [ ] Forms submit correctly
  - [ ] Navigation works
  - [ ] Responsive design verified

## Vercel Configuration

### Frontend Project
- [ ] Repository imported
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables added
- [ ] Auto-deploy on push enabled

### Backend Project (if on Vercel)
- [ ] Repository imported
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`
- [ ] `vercel.json` configured
- [ ] Environment variables added
- [ ] Production environment selected

## Database Setup (Planetscale)

- [ ] Account created
- [ ] Database created
- [ ] Connection string copied
- [ ] User credentials secured
- [ ] Backup enabled
- [ ] SSL connection verified

## Post-Deployment Verification

- [ ] Frontend URL accessible
- [ ] Backend API responding
- [ ] Login page loads
- [ ] Can login with test credentials
- [ ] Attendance features functional
- [ ] Student dashboard shows data
- [ ] Faculty can mark attendance
- [ ] Admin dashboard working
- [ ] No CORS errors in console
- [ ] All API calls succeed
- [ ] SSL certificate active (green lock)
- [ ] Page load time acceptable

## Monitoring & Logging

- [ ] Vercel analytics enabled
- [ ] Error tracking setup (optional)
- [ ] Database monitoring enabled
- [ ] Logs accessible
- [ ] Uptime monitoring configured

## Documentation

- [ ] Deployment guide updated
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Troubleshooting guide ready
- [ ] Rollback procedure documented

## Security Verification

- [ ] Secrets not exposed in code
- [ ] No API keys in GitHub
- [ ] .env files in .gitignore
- [ ] Database credentials secured
- [ ] JWT tokens properly validated
- [ ] Password reset tokens secure

## Performance Check

- [ ] Frontend bundle size reasonable
- [ ] API response times acceptable
- [ ] Database queries optimized
- [ ] Images compressed
- [ ] Caching headers configured

## Final Steps

- [ ] Team notified of deployment
- [ ] Users informed of new URL (if changed)
- [ ] Emergency contact updated
- [ ] Rollback plan prepared
- [ ] Success! 🎉

---

## Rollback Procedure

If issues occur after deployment:

### Frontend (Vercel)
1. Go to Vercel dashboard
2. Select project
3. Go to "Deployments"
4. Click "Redeploy" on previous working version

### Backend (Vercel/Render)
1. Check deployment logs for errors
2. Fix the issue in code
3. Commit and push (auto-redeploy)
4. Or manually redeploy from dashboard

### Database
1. Contact Planetscale support for recovery
2. Use backup from previous day
3. Restore using SQL dump

---

**Last Updated**: December 15, 2025
