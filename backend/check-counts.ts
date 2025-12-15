import pool from './src/database/connection';

async function cleanupAndCheck() {
  try {
    console.log('=== BEFORE CLEANUP ===');
    
    // Check counts before
    const [before] = await pool.execute('SELECT COUNT(*) as count FROM student_sections');
    console.log('Student sections before:', before);
    
    // Delete orphaned student_sections (where student_id doesn't exist in users)
    const [result] = await pool.execute(`
      DELETE ss FROM student_sections ss
      LEFT JOIN users u ON ss.student_id = u.id
      WHERE u.id IS NULL
    `);
    console.log('Deleted orphaned records:', result);
    
    // Check counts after
    console.log('\\n=== AFTER CLEANUP ===');
    const [after] = await pool.execute('SELECT COUNT(*) as count FROM student_sections');
    console.log('Student sections after:', after);
    
    const [students] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = 1");
    console.log('Student count in users table:', students);
    
    const [distinctStudents] = await pool.execute('SELECT COUNT(DISTINCT student_id) as count FROM student_sections');
    console.log('Distinct students in sections:', distinctStudents);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupAndCheck();
