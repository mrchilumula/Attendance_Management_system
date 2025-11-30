import pool from './connection';

const initDatabase = async () => {
  console.log('🔧 Initializing database...');

  const connection = await pool.getConnection();

  try {
    // Users table (Admin, Faculty, Student)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'faculty', 'student') NOT NULL,
        phone VARCHAR(20),
        department_id VARCHAR(36),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_active TINYINT DEFAULT 1
      )
    `);

    // Departments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        hod_id VARCHAR(36),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Academic Years
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS academic_years (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_current TINYINT DEFAULT 0
      )
    `);

    // Semesters
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS semesters (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        academic_year_id VARCHAR(36) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_current TINYINT DEFAULT 0
      )
    `);

    // Courses/Subjects
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        credits INT DEFAULT 3,
        department_id VARCHAR(36) NOT NULL,
        semester_number INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sections (e.g., CSE-A, CSE-B)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sections (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        department_id VARCHAR(36) NOT NULL,
        semester_number INT NOT NULL,
        academic_year_id VARCHAR(36) NOT NULL
      )
    `);

    // Student enrollments in sections
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS student_sections (
        id VARCHAR(36) PRIMARY KEY,
        student_id VARCHAR(36) NOT NULL,
        section_id VARCHAR(36) NOT NULL,
        roll_number VARCHAR(50) NOT NULL,
        UNIQUE KEY unique_student_section (student_id, section_id)
      )
    `);

    // Faculty course assignments
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS faculty_courses (
        id VARCHAR(36) PRIMARY KEY,
        faculty_id VARCHAR(36) NOT NULL,
        course_id VARCHAR(36) NOT NULL,
        section_id VARCHAR(36) NOT NULL,
        semester_id VARCHAR(36) NOT NULL,
        UNIQUE KEY unique_faculty_course (faculty_id, course_id, section_id, semester_id)
      )
    `);

    // Attendance Sessions (when faculty takes attendance)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id VARCHAR(36) PRIMARY KEY,
        faculty_course_id VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        period_number INT,
        topic VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(36) NOT NULL
      )
    `);

    // Attendance Records (individual student attendance)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL,
        student_id VARCHAR(36) NOT NULL,
        status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
        remarks TEXT,
        marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        marked_by VARCHAR(36) NOT NULL,
        UNIQUE KEY unique_session_student (session_id, student_id)
      )
    `);

    // Create indexes for better performance
    await connection.execute(`CREATE INDEX idx_users_role ON users(role)`).catch(() => {});
    await connection.execute(`CREATE INDEX idx_users_department ON users(department_id)`).catch(() => {});
    await connection.execute(`CREATE INDEX idx_attendance_records_session ON attendance_records(session_id)`).catch(() => {});
    await connection.execute(`CREATE INDEX idx_attendance_records_student ON attendance_records(student_id)`).catch(() => {});
    await connection.execute(`CREATE INDEX idx_attendance_sessions_date ON attendance_sessions(date)`).catch(() => {});
    await connection.execute(`CREATE INDEX idx_student_sections_student ON student_sections(student_id)`).catch(() => {});

    // Deleted Users (Recycle Bin)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS deleted_users (
        id VARCHAR(36) PRIMARY KEY,
        original_id VARCHAR(36) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'faculty', 'student') NOT NULL,
        phone VARCHAR(20),
        department_id VARCHAR(36),
        department_name VARCHAR(255),
        department_code VARCHAR(20),
        created_at DATETIME,
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_by VARCHAR(36),
        enrollments_data JSON,
        attendance_count INT DEFAULT 0
      )
    `);

    console.log('✅ Database initialized successfully!');
  } finally {
    connection.release();
  }
};

export default initDatabase;
