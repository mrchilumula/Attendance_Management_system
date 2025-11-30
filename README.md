# Attendance Management System
## CR Rao Institute of Technology

A complete web-based attendance management system for engineering colleges. Teachers can take attendance in the classroom, and students can view their attendance records.

## Features

### For Faculty
- 📋 View assigned courses and sections
- ✅ Take attendance with one-click marking (Present/Absent/Late/Excused)
- 📊 View attendance history and session records
- ⚠️ See students with low attendance (below 75%)
- 📥 Export attendance to CSV

### For Students
- 📈 View overall attendance percentage
- 📚 Course-wise attendance breakdown
- 🚨 Low attendance warnings
- 📊 Track classes needed to reach 75%

### For Admin
- 👥 Manage users (Faculty, Students)
- 🏢 Manage departments, courses, sections
- 📊 Dashboard with overall statistics
- 📋 View all attendance sessions

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, MySQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Docker, Docker Compose

## Project Structure

```
Attendance_Management/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── database/       # SQLite connection, migrations, seeds
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Server entry point
│   └── package.json
│
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Auth context
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   └── package.json
│
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### 1. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Initialize database (creates tables)
npm run db:init

# Seed sample data (departments, faculty, students, courses)
npm run db:seed

# Start development server
npm run dev
```

Backend runs on: http://localhost:5000

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: http://localhost:3000

## Default Login Credentials

| Role    | Email                        | Password    |
|---------|------------------------------|-------------|
| Admin   | admin@crrit.edu.in           | password123 |
| Faculty | rajesh.kumar@crrit.edu.in    | password123 |
| Faculty | priya.sharma@crrit.edu.in    | password123 |
| Faculty | venkat.rao@crrit.edu.in      | password123 |
| Student | 21cs1a01@crrit.edu.in        | password123 |

## How to Use

### Taking Attendance (Faculty)

1. Login with faculty credentials
2. Select a course from "My Courses"
3. Click "Take Attendance"
4. Select date and period
5. Mark students as Present (✓), Absent (✗), Late (🕐), or Excused (🛡)
6. Click "Save Attendance"

### Viewing Attendance (Student)

1. Login with student credentials
2. View overall attendance percentage
3. See course-wise breakdown
4. Check warnings for low attendance

### Managing System (Admin)

1. Login with admin credentials
2. View dashboard statistics
3. Manage users, courses, sections via API

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get profile
- `PUT /api/auth/change-password` - Change password

### Attendance (Faculty)
- `GET /api/attendance/my-courses` - Get assigned courses
- `GET /api/attendance/students/:facultyCourseId` - Get students
- `POST /api/attendance/sessions` - Create attendance session
- `GET /api/attendance/sessions/:facultyCourseId` - Get sessions
- `PUT /api/attendance/records/:recordId` - Update record
- `DELETE /api/attendance/sessions/:sessionId` - Delete session

### Reports
- `GET /api/reports/my-attendance` - Student attendance summary
- `GET /api/reports/report/:facultyCourseId` - Course report
- `GET /api/reports/low-attendance/:facultyCourseId` - Low attendance
- `GET /api/reports/export/:facultyCourseId` - Export data

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `GET /api/admin/departments` - List departments
- `GET /api/admin/courses` - List courses

## Sample Data

The seed script creates:
- 5 Departments (CSE, ECE, EEE, MECH, CIVIL)
- 3 Faculty members in CSE
- 60 Students (30 in CSE-A, 30 in CSE-B)
- 5 Courses for 3rd semester CSE
- Academic year 2025-2026

## Development

### Backend Scripts
```bash
npm run dev       # Start with hot-reload
npm run build     # Build for production
npm run start     # Run production build
npm run db:init   # Initialize database
npm run db:seed   # Seed sample data
```

### Frontend Scripts
```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

## 🚀 Cloud Deployment

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/mrchilumula/Attendance_Management_system.git
   cd Attendance_Management_system
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your secure passwords
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**
   - Frontend: http://your-server-ip
   - Backend API: http://your-server-ip:5000

### Option 2: Deploy to Railway

1. Create a new project on [Railway](https://railway.app)
2. Add a MySQL database service
3. Connect your GitHub repository
4. Set environment variables:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (from Railway MySQL)
   - `JWT_SECRET` (generate a secure random string)
   - `NODE_ENV=production`

### Option 3: Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Add a MySQL database (use PlanetScale or other MySQL provider)
4. Set environment variables and deploy

### Option 4: Deploy to DigitalOcean/AWS/GCP

1. Create a VM instance (Ubuntu 22.04 recommended)
2. Install Docker and Docker Compose
3. Clone the repository and run:
   ```bash
   docker-compose up -d --build
   ```

## License

MIT License - CR Rao Institute of Technology

---

Built with ❤️ for CR Rao Institute of Technology
