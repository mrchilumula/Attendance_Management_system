# AWS Deployment Guide for Attendance Management System

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
