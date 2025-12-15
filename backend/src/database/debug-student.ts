import pool from './connection';

async function debug() {
  try {
    // Get a student
    const [students] = await pool.execute('SELECT id, email FROM users WHERE role = "student" LIMIT 1') as any;
    console.log('Student:', students[0]);
    
    const studentId = students[0]?.id;
    if (!studentId) {
      console.log('No student found');
      process.exit(1);
    }
    
    // Check student_courses
    const [sc] = await pool.execute('SELECT * FROM student_courses WHERE student_id = ?', [studentId]) as any;
    console.log('\nStudent courses:', sc.length);
    if (sc.length > 0) console.log(sc);
    
    // Check student_sections
    const [ss] = await pool.execute('SELECT * FROM student_sections WHERE student_id = ?', [studentId]) as any;
    console.log('\nStudent sections:', ss.length);
    if (ss.length > 0) console.log(ss);
    
    // Check faculty_courses
    const [fc] = await pool.execute('SELECT * FROM faculty_courses LIMIT 5') as any;
    console.log('\nFaculty courses:', fc.length);
    
    // Check current semester
    const [sem] = await pool.execute('SELECT * FROM semesters WHERE is_current = 1') as any;
    console.log('\nCurrent semester:', sem);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debug();
