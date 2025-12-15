# 📚 CR Rao Institute of Technology - Attendance Management System

## Complete Documentation & User Guide

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Getting Started](#getting-started)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Authentication Features](#authentication-features)
6. [Admin Features](#admin-features)
7. [Faculty Features](#faculty-features)
8. [Student Features](#student-features)
9. [Navigation Guide](#navigation-guide)
10. [API Endpoints](#api-endpoints)
11. [Database Schema](#database-schema)
12. [Security Features](#security-features)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

The **Attendance Management System** is a comprehensive web application designed for **CR Rao Institute of Technology** to manage student attendance across multiple departments, courses, and sections. The system provides role-based access for administrators, faculty, and students.

### Key Features
- ✅ Role-based authentication (Admin, Faculty, Student)
- ✅ Real-time attendance tracking
- ✅ Department and course management
- ✅ Student enrollment management
- ✅ Faculty course assignment
- ✅ Attendance reports and analytics
- ✅ Bulk student upload via Excel/CSV
- ✅ Password reset & account recovery
- ✅ Account lockout protection
- ✅ Recycle bin for deleted records

---

## 🛠 Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| TypeScript | Type-safe JavaScript |
| MySQL | Database |
| JWT | Authentication |
| bcryptjs | Password hashing |
| express-validator | Input validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type-safe JavaScript |
| Vite | Build tool |
| Tailwind CSS | Styling |
| React Router | Navigation |
| Axios | HTTP client |
| Lucide Icons | Icon library |
| React Hot Toast | Notifications |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/mrchilumula/Attendance_Management_system.git
cd Attendance_Management
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure Database**
- Create MySQL database named `attendance_management`
- Update connection settings in `backend/src/config.ts`

5. **Start the Application**

**Option 1: Using start scripts**
```powershell
# Windows
.\start.ps1
# or
start.bat
```

**Option 2: Manual start**
```bash
# Terminal 1 - Backend
cd backend
npx ts-node-dev src/index.ts

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crrit.edu.in | password123 |
| Faculty | rajesh.kumar@crrit.edu.in | password123 |
| Student | 21cs1a01@crrit.edu.in | password123 |

---

## 👥 User Roles & Permissions

### 🔴 Administrator
- Full system access
- Manage departments, courses, sections
- Manage faculty and students
- View all attendance reports
- Bulk upload students
- Assign faculty to courses
- Access recycle bin
- Unlock locked accounts

### 🔵 Faculty
- View assigned courses
- Take attendance for classes
- View/Edit attendance sessions
- Generate attendance reports
- View student lists

### 🟢 Student
- View personal attendance
- View enrolled courses
- Check attendance percentage
- View attendance warnings

---

## 🔐 Authentication Features

### Login System
1. **Role-Based Login**: Select your role (Admin/Faculty/Student) on the login page
2. **Auto-Fill Demo**: Clicking a role auto-fills demo credentials
3. **Remember Me**: Option to remember email for future logins
4. **Password Visibility**: Toggle to show/hide password

### Password Requirements
Strong passwords must include:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*(),.?":{}|<>)

### Forgot Password Flow
1. Click **"Forgot password?"** on login page
2. Enter your registered email (@crrit.edu.in)
3. Receive a reset token (valid for 1 hour)
4. Enter token on reset page
5. Set new password meeting requirements
6. Login with new password

### Account Security
- **Login Attempts**: 5 attempts before lockout
- **Lockout Duration**: 15 minutes
- **Token Expiry**: Reset tokens expire in 1 hour
- **Session Expiry**: JWT tokens valid for 24 hours

### Force Password Change
- New users must change default password on first login
- System redirects to password change page automatically

---

## 👨‍💼 Admin Features

### Dashboard (`/admin`)
The admin dashboard provides:
- **Statistics Cards**: Total students, faculty, departments, courses, sections, today's sessions
- **Today's Overview**: Real-time attendance summary
- **Period-wise Breakdown**: Attendance by class period
- **Department Activity**: Attendance statistics per department
- **Recent Sessions**: Latest attendance records
- **Quick Actions**: Direct links to common tasks

### Student Management (`/admin/students`)

#### View Students
- List all registered students
- Search by name, roll number, email
- Filter by department, section
- View student details

#### Add Student
1. Click **"Add Student"** button
2. Fill in student details:
   - First Name, Last Name
   - Email (must end with @crrit.edu.in)
   - Roll Number
   - Phone Number
   - Department
3. Click **"Create"**

#### Bulk Upload (`/admin/upload-students`)
1. Navigate to **Upload Students**
2. Download sample template (Excel/CSV)
3. Fill in student data
4. Upload file
5. Review preview
6. Confirm upload

#### View Student Attendance (`/admin/students/:id/attendance`)
- Click on a student to view their attendance
- Course-wise attendance breakdown
- Attendance percentage per course
- Present/Absent/Late statistics

### Faculty Management (`/admin/faculty`)

#### View Faculty
- List all faculty members
- Search and filter options
- View faculty details

#### Add Faculty
1. Click **"Add Faculty"**
2. Enter faculty details:
   - Name, Email, Phone
   - Department
3. Click **"Create"**

### Faculty Assignment (`/admin/faculty-assignment`)
Assign faculty to courses and sections:
1. Select faculty member
2. Choose course
3. Select section
4. Choose semester
5. Click **"Assign"**

### Department Management (`/admin/departments`)
- Add/Edit/Delete departments
- View department codes
- See student/faculty count per department

### Course Management (`/admin/courses`)
- Add/Edit/Delete courses
- Set course codes and names
- Assign to departments
- Set credits and semester

### Section Management (`/admin/sections`)
- Create class sections (A, B, C, etc.)
- Assign to departments
- Set current semester
- Define batch year

### Class Enrollment (`/admin/class-enrollment`)
Enroll students in sections:
1. Select department
2. Choose section
3. Search/select students
4. Click **"Enroll"**

### Course Enrollment (`/admin/course-enrollment`)
Enroll students in courses:
1. Select course
2. Choose section
3. Select students
4. Click **"Enroll"**

### Recycle Bin (`/admin/recycle-bin`)
- View deleted records (students, faculty, etc.)
- Restore deleted items
- Permanently delete records

---

## 👨‍🏫 Faculty Features

### Dashboard (`/faculty`)
- View all assigned courses
- See student count per course
- Quick access to attendance

### Course Cards Display:
Each course card shows:
- Course code and name
- Section and semester
- Number of enrolled students
- Two action buttons:
  - **Take Attendance**: Mark attendance
  - **View Records**: See past sessions

### Take Attendance (`/faculty/attendance/:courseId`)

#### Step 1: Select Date & Period
- Choose attendance date
- Select period number (1-8)
- Click **"Load Students"**

#### Step 2: Mark Attendance
- Student list with photos/names
- Click to toggle: Present ✅ / Absent ❌
- Bulk actions: Mark All Present / Mark All Absent

#### Step 3: Submit
- Review marked attendance
- Click **"Submit Attendance"**
- Confirmation message appears

### View Sessions (`/faculty/sessions/:courseId`)
- List of all attendance sessions
- Filter by date range
- View attendance statistics
- Edit past sessions (if allowed)

#### Session Details:
- Date and period
- Present/Absent count
- Attendance percentage
- Option to edit attendance

---

## 👨‍🎓 Student Features

### Dashboard (`/student`)

#### Overall Summary Card
- Overall attendance percentage
- Number of enrolled courses
- Status indicator (On Track ✅ or At Risk ⚠️)

#### Attendance Warning
- Displayed when any course is below 75%
- Lists courses needing attention

#### Course-wise Attendance
For each course:
- Course code and name
- Attendance percentage
- Visual progress bar
- Statistics: Total / Present / Absent / Late / Excused
- Classes needed to reach 75% (if below threshold)

### Color Coding:
| Percentage | Color | Status |
|------------|-------|--------|
| ≥ 75% | 🟢 Green | On Track |
| 50-74% | 🟡 Yellow | Warning |
| < 50% | 🔴 Red | At Risk |

---

## 🧭 Navigation Guide

### Login Page (`/login`)
```
┌─────────────────────────────────────┐
│     CR Rao Institute of Technology  │
│     Attendance Management System    │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 🔴 Administrator            │   │
│  │    Manage students, faculty │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🔵 Faculty                  │   │
│  │    Take attendance & reports│   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🟢 Student                  │   │
│  │    View attendance & courses│   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Admin Navigation
```
Sidebar Menu:
├── 📊 Dashboard
├── 👥 Students
│   ├── View All Students
│   ├── Student Attendance
│   └── Upload Students
├── 👨‍🏫 Faculty
│   ├── View All Faculty
│   └── Faculty Assignment
├── 🏛️ Departments
├── 📚 Courses
│   └── Course Enrollment
├── 📑 Sections
│   └── Class Enrollment
└── 🗑️ Recycle Bin
```

### Faculty Navigation
```
Sidebar Menu:
├── 📊 Dashboard (My Courses)
├── 📝 Take Attendance
└── 📋 View Sessions
```

### Student Navigation
```
Sidebar Menu:
└── 📊 My Attendance
```

### Header Navigation
```
┌──────────────────────────────────────────────────┐
│ 🎓 CRRIT Attendance    [User Name] [Profile ▼]  │
│                         ├── My Profile          │
│                         ├── Change Password     │
│                         └── Logout              │
└──────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |
| POST | `/api/auth/force-change-password` | First-time password change |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/verify-reset-token` | Verify reset token |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/unlock-account` | Admin unlock account |
| GET | `/api/auth/login-history` | Get login history |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/students` | List students |
| POST | `/api/admin/students` | Create student |
| PUT | `/api/admin/students/:id` | Update student |
| DELETE | `/api/admin/students/:id` | Delete student |
| GET | `/api/admin/faculty` | List faculty |
| POST | `/api/admin/faculty` | Create faculty |
| GET | `/api/admin/departments` | List departments |
| GET | `/api/admin/courses` | List courses |
| GET | `/api/admin/sections` | List sections |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance/my-courses` | Faculty courses |
| GET | `/api/attendance/students/:fcId` | Get students for course |
| POST | `/api/attendance/mark` | Mark attendance |
| GET | `/api/attendance/sessions/:fcId` | Get sessions |
| PUT | `/api/attendance/sessions/:id` | Update session |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/my-attendance` | Student attendance |
| GET | `/api/reports/course/:courseId` | Course report |
| GET | `/api/reports/student/:studentId` | Student report |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/students` | Bulk upload students |
| GET | `/api/upload/template` | Download template |

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Users (Admin, Faculty, Students)
users (
  id, email, password, first_name, last_name,
  role, phone, department_id, is_active,
  must_change_password, login_attempts, locked_until,
  reset_token, reset_token_expiry,
  last_login_at, password_changed_at
)

-- Departments
departments (
  id, name, code, created_at
)

-- Courses
courses (
  id, code, name, department_id, credits, semester
)

-- Sections
sections (
  id, name, department_id, semester_id, batch_year
)

-- Semesters
semesters (
  id, name, start_date, end_date, is_current
)

-- Faculty Course Assignment
faculty_courses (
  id, faculty_id, course_id, section_id, semester_id
)

-- Student Enrollment
student_courses (
  id, student_id, faculty_course_id
)

-- Student Section Enrollment
student_sections (
  id, student_id, section_id
)

-- Attendance Sessions
attendance_sessions (
  id, faculty_course_id, date, period_number, created_at
)

-- Attendance Records
attendance_records (
  id, session_id, student_id, status, marked_at
)
```

---

## 🔒 Security Features

### Password Security
- Passwords hashed with bcrypt (12 rounds)
- Strong password requirements enforced
- Password change required on first login

### Account Protection
- Account lockout after 5 failed attempts
- 15-minute lockout period
- Admin can manually unlock accounts

### Token Security
- JWT tokens for session management
- 24-hour token expiry
- Reset tokens hashed with SHA-256
- 1-hour reset token expiry

### Input Validation
- Email format validation (@crrit.edu.in)
- Request body validation
- SQL injection prevention (parameterized queries)

### Rate Limiting
- Login attempt tracking
- Automatic lockout protection

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Internal Server Error" on Login
**Solution**: 
- Check if MySQL is running
- Verify database credentials in config
- Run database migration: `npx ts-node src/database/migrate-security.ts`

#### 2. "Account Locked"
**Solution**:
- Wait 15 minutes for automatic unlock
- Or ask admin to unlock via `/api/auth/unlock-account`

#### 3. "Invalid Token" on Password Reset
**Solution**:
- Request a new reset token (tokens expire in 1 hour)
- Check if token was copied correctly

#### 4. Frontend Not Loading
**Solution**:
- Ensure backend is running on port 5000
- Check for CORS errors in browser console
- Verify API URL in frontend config

#### 5. Attendance Not Saving
**Solution**:
- Check network connection
- Verify faculty is assigned to the course
- Check if session already exists for date/period

### Support Contacts
- **Technical Support**: admin@crrit.edu.in
- **System Administrator**: IT Department

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial release |
| 1.1.0 | Dec 2025 | Added forgot password, account lockout |
| 1.2.0 | Dec 2025 | Enhanced security, password requirements |

---

## 📄 License

MIT License - CR Rao Institute of Technology

---

*Documentation Last Updated: December 2, 2025*
