# Attendance Management System - Backend

## CR Rao Institute of Technology

### Quick Start

```bash
# Install dependencies
npm install

# Initialize database (creates tables)
npm run db:init

# Seed sample data (departments, faculty, students)
npm run db:seed

# Start development server
npm run dev
```

### Default Login Credentials

| Role    | Email                       | Password    |
|---------|------------------------------|-------------|
| Admin   | admin@crrit.edu.in          | password123 |
| Faculty | rajesh.kumar@crrit.edu.in   | password123 |
| Faculty | priya.sharma@crrit.edu.in   | password123 |
| Student | 21cs1a01@crrit.edu.in       | password123 |

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password

#### Attendance (Faculty)
- `GET /api/attendance/my-courses` - Get assigned courses
- `GET /api/attendance/students/:facultyCourseId` - Get students for attendance
- `POST /api/attendance/sessions` - Create attendance session and mark attendance
- `GET /api/attendance/sessions/:facultyCourseId` - Get attendance sessions
- `GET /api/attendance/records/:sessionId` - Get attendance records for a session
- `PUT /api/attendance/records/:recordId` - Update attendance record
- `DELETE /api/attendance/sessions/:sessionId` - Delete session

#### Reports
- `GET /api/reports/my-attendance` - Student's attendance summary
- `GET /api/reports/my-attendance/:courseCode` - Student's detailed attendance
- `GET /api/reports/report/:facultyCourseId` - Course attendance report
- `GET /api/reports/low-attendance/:facultyCourseId` - Low attendance students
- `GET /api/reports/export/:facultyCourseId` - Export attendance data

#### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/departments` - List departments
- `GET /api/admin/courses` - List courses
- `GET /api/admin/sections` - List sections
- `GET /api/admin/dashboard` - Dashboard statistics
