# AWS Deployment Guide for Attendance Management System

Complete guide to deploy the Attendance Management System for CR Rao Institute of Technology on AWS.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐         ┌─────────────────────────┐          │
│   │   AWS       │         │   Elastic Beanstalk     │          │
│   │  Amplify    │ ──────► │   (Node.js Backend)     │          │
│   │ (Frontend)  │   API   │   - Express Server      │          │
│   └─────────────┘         │   - Port 8080           │          │
│                           └───────────┬─────────────┘          │
│                                       │                         │
│                                       ▼                         │
│                           ┌─────────────────────────┐          │
│                           │      Amazon RDS         │          │
│                           │   (MySQL Database)      │          │
│                           └─────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## STEP-BY-STEP DEPLOYMENT GUIDE

---

## Part 1: Install Required Tools

### 1.1 Install AWS CLI

**Windows (PowerShell):**
```powershell
# Download and install from AWS website or use winget
winget install Amazon.AWSCLI

# Verify installation
aws --version
```

### 1.2 Configure AWS CLI

```powershell
aws configure
```
Enter:
- AWS Access Key ID: `your-access-key`
- AWS Secret Access Key: `your-secret-key`
- Default region: `ap-south-1` (or your preferred region)
- Default output format: `json`

### 1.3 Install EB CLI

```powershell
pip install awsebcli --upgrade

# Verify installation
eb --version
```

---

## Part 2: Database Setup (Amazon RDS)

### 2.1 Create RDS MySQL Instance

1. **Login to AWS Console** → Search for "RDS" → Click "Create database"

2. **Choose a database creation method:** Standard create

3. **Engine options:**
   - Engine type: **MySQL**
   - Version: **MySQL 8.0.x** (latest)

4. **Templates:** Free tier (for testing)

5. **Settings:**
   - DB instance identifier: `attendance-db`
   - Master username: `admin`
   - Master password: Create a strong password (save this!)

6. **Instance configuration:**
   - DB instance class: `db.t3.micro` (Free tier eligible)

7. **Storage:**
   - Storage type: General Purpose SSD (gp2)
   - Allocated storage: 20 GB

8. **Connectivity:**
   - VPC: Default VPC
   - Subnet group: default
   - Public access: **Yes** (needed for initial setup)
   - VPC security group: Create new → `attendance-db-sg`

9. **Additional configuration:**
   - Initial database name: `attendance_management`
   - Enable automated backups: Yes

10. Click **Create database** (takes 5-10 minutes)

### 2.2 Configure Security Group for Database

1. Go to **EC2** → **Security Groups**
2. Find `attendance-db-sg`
3. Click **Edit inbound rules**
4. Add rule:
   - Type: **MySQL/Aurora**
   - Port: **3306**
   - Source: **Anywhere-IPv4** (0.0.0.0/0) - for initial setup
5. Click **Save rules**

### 2.3 Get RDS Endpoint

1. Go to **RDS** → **Databases**
2. Click on `attendance-db`
3. Copy the **Endpoint** (e.g., `attendance-db.xxxx.ap-south-1.rds.amazonaws.com`)

### 2.4 Initialize Database

Connect using MySQL Workbench or command line:

```powershell
mysql -h attendance-db.xxxx.rds.amazonaws.com -u admin -p
```

Then run the schema SQL from your backend.

---

## Part 3: Backend Deployment (Elastic Beanstalk)

### 3.1 Prepare Backend

Navigate to backend folder:
```powershell
cd D:\Attendance_Management\backend
```

Build the project:
```powershell
npm run build
```

### 3.2 Initialize Elastic Beanstalk

```powershell
eb init
```

Follow the prompts:
1. **Select region:** Choose your region (e.g., `10) ap-south-1`)
2. **Application name:** `attendance-management-backend`
3. **Platform:** `Node.js`
4. **Platform branch:** `Node.js 18`
5. **CodeCommit:** `n` (no)
6. **SSH keypair:** `y` (yes, select or create one)

### 3.3 Create Environment

```powershell
eb create attendance-prod --instance-type t2.micro --single
```

Wait for environment to be created (5-10 minutes).

### 3.4 Set Environment Variables

```powershell
eb setenv DB_HOST=attendance-db.xxxx.rds.amazonaws.com DB_USER=admin DB_PASSWORD=your-password DB_NAME=attendance_management JWT_SECRET=your-super-secret-jwt-key-change-this FRONTEND_URL=https://your-frontend.amplifyapp.com NODE_ENV=production PORT=8080
```

### 3.5 Deploy Backend

```powershell
eb deploy
```

### 3.6 Get Backend URL

```powershell
eb open
```

Or check AWS Console → Elastic Beanstalk → Environments → Click on your environment → Copy the URL (e.g., `http://attendance-prod.xxxx.elasticbeanstalk.com`)

### 3.7 Verify Backend

Test the API:
```powershell
curl http://attendance-prod.xxxx.elasticbeanstalk.com/api/health
```

---

## Part 4: Frontend Deployment (AWS Amplify)

### 4.1 Push Code to GitHub

Make sure your code is on GitHub:
```powershell
cd D:\Attendance_Management
git add .
git commit -m "Prepare for AWS deployment"
git push origin main
```

### 4.2 Set Up AWS Amplify

1. **Go to AWS Console** → Search for "Amplify"
2. Click **Create new app** (or "Get started")
3. Select **Host web app**

### 4.3 Connect to GitHub

1. Select **GitHub** as source provider
2. Click **Connect to GitHub**
3. Authorize AWS Amplify
4. Select your repository: `mrchilumula/Attendance_Management_system`
5. Select branch: `main`

### 4.4 Configure Build Settings

1. **App name:** `attendance-frontend`

2. **Build settings - Edit YAML:**
```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - cd frontend
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: frontend/dist
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
    appRoot: frontend
```

3. **Environment variables - Add:**
   - Key: `VITE_API_URL`
   - Value: `http://attendance-prod.xxxx.elasticbeanstalk.com` (your EB URL)

4. Click **Next** → **Save and deploy**

### 4.5 Get Frontend URL

After deployment (5-10 minutes):
- Go to Amplify → Your app
- Copy the URL (e.g., `https://main.xxxx.amplifyapp.com`)

---

## Part 5: Update CORS and Redeploy

### 5.1 Update Backend CORS

Edit `backend/src/index.ts` to add your Amplify domain:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'https://main.xxxx.amplifyapp.com'  // Your Amplify URL
];
```

### 5.2 Redeploy Backend

```powershell
cd D:\Attendance_Management\backend
npm run build
eb deploy
```

### 5.3 Update Environment Variable

```powershell
eb setenv FRONTEND_URL=https://main.xxxx.amplifyapp.com
```

---

## Part 6: Verify Everything Works

### 6.1 Test Login

1. Open your Amplify URL: `https://main.xxxx.amplifyapp.com`
2. Login with:
   - Email: `admin@crrit.edu.in`
   - Password: `password123`

### 6.2 Check All Features

- ✅ Admin login works
- ✅ Faculty login works
- ✅ Student login works
- ✅ Attendance marking works
- ✅ Reports work

---

## Quick Reference Commands

```powershell
# Backend commands
cd D:\Attendance_Management\backend
npm run build          # Build project
eb deploy              # Deploy to AWS
eb logs                # View logs
eb health              # Check health
eb open                # Open in browser
eb status              # Check status
eb ssh                 # SSH into instance
eb setenv KEY=VALUE    # Set environment variable
eb restart             # Restart environment

# Check environment variables
eb printenv
```

---

## Alternative Deployment Options

## Option 1: AWS Elastic Beanstalk (Recommended - Easiest)

### Prerequisites
1. AWS Account
2. AWS CLI installed and configured
3. EB CLI installed: `pip install awsebcli`

### Steps

#### 1. Initialize Elastic Beanstalk
```bash
cd Attendance_Management
eb init
```
- Select region (e.g., `us-east-1`)
- Create new application: `attendance-management`
- Select platform: `Node.js 18`
- Set up SSH if needed

#### 2. Create Environment
```bash
eb create attendance-prod --single
```

#### 3. Set Environment Variables
```bash
eb setenv DB_HOST=your-rds-endpoint.amazonaws.com \
         DB_USER=admin \
         DB_PASSWORD=your-password \
         DB_NAME=attendance_management \
         JWT_SECRET=your-jwt-secret \
         NODE_ENV=production
```

#### 4. Deploy
```bash
eb deploy
```

#### 5. Open Application
```bash
eb open
```

---

## Option 2: AWS EC2 with CodeDeploy

### 1. Create RDS MySQL Database
1. Go to AWS RDS Console
2. Create Database → MySQL
3. Choose Free Tier eligible
4. Set credentials and note the endpoint

### 2. Create EC2 Instance
1. Go to EC2 Console
2. Launch Instance:
   - AMI: Amazon Linux 2023
   - Instance Type: t2.micro (Free Tier)
   - Security Group: Allow ports 22, 80, 443, 5000
3. Create or select key pair

### 3. Install CodeDeploy Agent on EC2
```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install CodeDeploy agent
sudo yum update -y
sudo yum install -y ruby wget
cd /home/ec2-user
wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
sudo service codedeploy-agent start
```

### 4. Setup CodePipeline
1. Go to CodePipeline Console
2. Create Pipeline
3. Source: GitHub (connect to your repo)
4. Build: AWS CodeBuild (uses buildspec.yml)
5. Deploy: AWS CodeDeploy (uses appspec.yml)

---

## Option 3: AWS ECS with Docker (Scalable)

### 1. Push Docker Image to ECR
```bash
# Create ECR repository
aws ecr create-repository --repository-name attendance-backend
aws ecr create-repository --repository-name attendance-frontend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push images
docker build -t attendance-backend ./backend
docker tag attendance-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/attendance-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/attendance-backend:latest

docker build -t attendance-frontend ./frontend
docker tag attendance-frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/attendance-frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/attendance-frontend:latest
```

### 2. Create ECS Cluster
1. Go to ECS Console
2. Create Cluster → Networking Only (Fargate)
3. Create Task Definition
4. Create Service

---

## Option 4: AWS Amplify (Frontend) + API Gateway + Lambda (Serverless)

For a serverless approach, you can:
1. Deploy frontend to AWS Amplify
2. Convert backend to Lambda functions
3. Use API Gateway for routing
4. Use RDS or DynamoDB for database

---

## Database Setup (RDS MySQL)

### Create RDS Instance
1. Go to RDS Console → Create Database
2. Engine: MySQL 8.0
3. Template: Free Tier
4. Settings:
   - DB Instance Identifier: `attendance-db`
   - Master Username: `admin`
   - Master Password: `your-secure-password`
5. Connectivity:
   - VPC: Default
   - Public Access: Yes (for development)
   - Security Group: Allow MySQL (3306) from your EC2

### Initialize Database
Connect to RDS and run the initialization SQL from your backend.

---

## Environment Variables Required

Set these in your deployment:

```
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=attendance_management
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=production
```

---

## Estimated Monthly Costs (Free Tier Eligible)

- EC2 t2.micro: Free (750 hrs/month for 12 months)
- RDS db.t2.micro: Free (750 hrs/month for 12 months)
- Elastic Beanstalk: Free (pay for underlying resources)
- S3: 5GB free
- Data Transfer: 15GB free

After Free Tier:
- EC2 t2.micro: ~$8.50/month
- RDS db.t2.micro: ~$12.50/month
- **Total: ~$25-30/month**

---

## Security Best Practices

1. Never commit AWS credentials to Git
2. Use IAM roles instead of access keys
3. Enable HTTPS with ACM certificates
4. Use Security Groups to restrict access
5. Enable RDS encryption at rest
6. Use AWS Secrets Manager for sensitive data

---

## Quick Start Commands

```bash
# Install EB CLI
pip install awsebcli

# Initialize and deploy
cd Attendance_Management
eb init -p "Node.js 18" attendance-management
eb create attendance-env --single
eb setenv DB_HOST=xxx DB_USER=xxx DB_PASSWORD=xxx DB_NAME=xxx JWT_SECRET=xxx
eb deploy
eb open
```

---

## Troubleshooting

### Check Logs
```bash
eb logs
```

### SSH into instance
```bash
eb ssh
```

### Health Status
```bash
eb health
```

### Terminate Environment
```bash
eb terminate attendance-env
```
