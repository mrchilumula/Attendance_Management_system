import pool from './connection';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const seedDatabase = async () => {
  console.log('🌱 Seeding database...');

  const connection = await pool.getConnection();
  const hashedPassword = await bcrypt.hash('password123', 10);

  try {
    // Create Departments
    const departments = [
      { id: uuidv4(), name: 'Computer Science & Engineering', code: 'CSE' },
      { id: uuidv4(), name: 'Electronics & Communication Engineering', code: 'ECE' },
      { id: uuidv4(), name: 'Electrical & Electronics Engineering', code: 'EEE' },
      { id: uuidv4(), name: 'Mechanical Engineering', code: 'MECH' },
      { id: uuidv4(), name: 'Civil Engineering', code: 'CIVIL' },
    ];

    for (const dept of departments) {
      await connection.execute(
        `INSERT IGNORE INTO departments (id, name, code) VALUES (?, ?, ?)`,
        [dept.id, dept.name, dept.code]
      );
    }

    const cseDept = departments[0];

    // Create Admin User
    const adminId = uuidv4();
    await connection.execute(
      `INSERT IGNORE INTO users (id, email, password, first_name, last_name, role, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [adminId, 'admin@crrit.edu.in', hashedPassword, 'System', 'Administrator', 'admin', '9876543210']
    );

    // Create Faculty Users
    const facultyData = [
      { id: uuidv4(), email: 'rajesh.kumar@crrit.edu.in', firstName: 'Rajesh', lastName: 'Kumar', deptId: cseDept.id },
      { id: uuidv4(), email: 'priya.sharma@crrit.edu.in', firstName: 'Priya', lastName: 'Sharma', deptId: cseDept.id },
      { id: uuidv4(), email: 'venkat.rao@crrit.edu.in', firstName: 'Venkat', lastName: 'Rao', deptId: cseDept.id },
    ];

    for (const f of facultyData) {
      await connection.execute(
        `INSERT IGNORE INTO users (id, email, password, first_name, last_name, role, department_id)
         VALUES (?, ?, ?, ?, ?, 'faculty', ?)`,
        [f.id, f.email, hashedPassword, f.firstName, f.lastName, f.deptId]
      );
    }

    // Create Academic Year
    const academicYearId = uuidv4();
    await connection.execute(
      `INSERT IGNORE INTO academic_years (id, name, start_date, end_date, is_current)
       VALUES (?, ?, ?, ?, ?)`,
      [academicYearId, '2025-2026', '2025-06-01', '2026-05-31', 1]
    );

    // Create Semesters
    const sem1Id = uuidv4();
    const sem2Id = uuidv4();
    await connection.execute(
      `INSERT IGNORE INTO semesters (id, name, academic_year_id, start_date, end_date, is_current)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sem1Id, 'Odd Semester 2025-26', academicYearId, '2025-06-01', '2025-11-30', 1]
    );

    await connection.execute(
      `INSERT IGNORE INTO semesters (id, name, academic_year_id, start_date, end_date, is_current)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sem2Id, 'Even Semester 2025-26', academicYearId, '2025-12-01', '2026-05-31', 0]
    );

    // Create Courses for CSE
    const courses = [
      { id: uuidv4(), code: 'CS301', name: 'Data Structures & Algorithms', semester: 3 },
      { id: uuidv4(), code: 'CS302', name: 'Database Management Systems', semester: 3 },
      { id: uuidv4(), code: 'CS303', name: 'Operating Systems', semester: 3 },
      { id: uuidv4(), code: 'CS304', name: 'Computer Networks', semester: 3 },
      { id: uuidv4(), code: 'CS305', name: 'Object Oriented Programming', semester: 3 },
    ];

    for (const c of courses) {
      await connection.execute(
        `INSERT IGNORE INTO courses (id, code, name, department_id, semester_number)
         VALUES (?, ?, ?, ?, ?)`,
        [c.id, c.code, c.name, cseDept.id, c.semester]
      );
    }

    // Create Sections
    const sectionA = { id: uuidv4(), name: 'CSE-A', deptId: cseDept.id, semester: 3 };
    const sectionB = { id: uuidv4(), name: 'CSE-B', deptId: cseDept.id, semester: 3 };

    await connection.execute(
      `INSERT IGNORE INTO sections (id, name, department_id, semester_number, academic_year_id)
       VALUES (?, ?, ?, ?, ?)`,
      [sectionA.id, sectionA.name, sectionA.deptId, sectionA.semester, academicYearId]
    );

    await connection.execute(
      `INSERT IGNORE INTO sections (id, name, department_id, semester_number, academic_year_id)
       VALUES (?, ?, ?, ?, ?)`,
      [sectionB.id, sectionB.name, sectionB.deptId, sectionB.semester, academicYearId]
    );

    // Create Students
    const students: { id: string; email: string; firstName: string; lastName: string; rollNo: string; sectionId: string }[] = [];
    
    // Section A students
    for (let i = 1; i <= 30; i++) {
      const rollNo = `21CS1A${i.toString().padStart(2, '0')}`;
      students.push({
        id: uuidv4(),
        email: `${rollNo.toLowerCase()}@crrit.edu.in`,
        firstName: `Student${i}A`,
        lastName: 'CSE',
        rollNo,
        sectionId: sectionA.id
      });
    }

    // Section B students
    for (let i = 1; i <= 30; i++) {
      const rollNo = `21CS1B${i.toString().padStart(2, '0')}`;
      students.push({
        id: uuidv4(),
        email: `${rollNo.toLowerCase()}@crrit.edu.in`,
        firstName: `Student${i}B`,
        lastName: 'CSE',
        rollNo,
        sectionId: sectionB.id
      });
    }

    for (const s of students) {
      await connection.execute(
        `INSERT IGNORE INTO users (id, email, password, first_name, last_name, role, department_id)
         VALUES (?, ?, ?, ?, ?, 'student', ?)`,
        [s.id, s.email, hashedPassword, s.firstName, s.lastName, cseDept.id]
      );
      await connection.execute(
        `INSERT IGNORE INTO student_sections (id, student_id, section_id, roll_number)
         VALUES (?, ?, ?, ?)`,
        [uuidv4(), s.id, s.sectionId, s.rollNo]
      );
    }

    // Assign Faculty to Courses
    // Rajesh Kumar teaches DSA and DBMS to Section A
    await connection.execute(
      `INSERT IGNORE INTO faculty_courses (id, faculty_id, course_id, section_id, semester_id)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), facultyData[0].id, courses[0].id, sectionA.id, sem1Id]
    );
    await connection.execute(
      `INSERT IGNORE INTO faculty_courses (id, faculty_id, course_id, section_id, semester_id)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), facultyData[0].id, courses[1].id, sectionA.id, sem1Id]
    );

    // Priya Sharma teaches OS and Networks to Section A
    await connection.execute(
      `INSERT IGNORE INTO faculty_courses (id, faculty_id, course_id, section_id, semester_id)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), facultyData[1].id, courses[2].id, sectionA.id, sem1Id]
    );
    await connection.execute(
      `INSERT IGNORE INTO faculty_courses (id, faculty_id, course_id, section_id, semester_id)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), facultyData[1].id, courses[3].id, sectionA.id, sem1Id]
    );

    // Venkat Rao teaches OOP to Section A, and DSA, DBMS to Section B
    await connection.execute(
      `INSERT IGNORE INTO faculty_courses (id, faculty_id, course_id, section_id, semester_id)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), facultyData[2].id, courses[4].id, sectionA.id, sem1Id]
    );
    await connection.execute(
      `INSERT IGNORE INTO faculty_courses (id, faculty_id, course_id, section_id, semester_id)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), facultyData[2].id, courses[0].id, sectionB.id, sem1Id]
    );
    await connection.execute(
      `INSERT IGNORE INTO faculty_courses (id, faculty_id, course_id, section_id, semester_id)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), facultyData[2].id, courses[1].id, sectionB.id, sem1Id]
    );

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('---------------------------');
    console.log('Admin:   admin@crrit.edu.in / password123');
    console.log('Faculty: rajesh.kumar@crrit.edu.in / password123');
    console.log('Faculty: priya.sharma@crrit.edu.in / password123');
    console.log('Faculty: venkat.rao@crrit.edu.in / password123');
    console.log('Student: 21cs1a01@crrit.edu.in / password123');
    console.log('---------------------------');
  } finally {
    connection.release();
  }
};

export default seedDatabase;
