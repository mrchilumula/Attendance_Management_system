import pool from './connection';

async function removeDepartments() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🗑️  Removing departments...\n');
    
    const deptCodes = ['MECH', 'CIVIL', 'EEE'];
    
    for (const code of deptCodes) {
      // Get department ID
      const [rows] = await connection.execute(
        'SELECT id, name FROM departments WHERE code = ?', 
        [code]
      ) as any;
      
      if (rows.length > 0) {
        const deptId = rows[0].id;
        const deptName = rows[0].name;
        
        // Delete related data in correct order
        await connection.execute(
          'DELETE FROM student_sections WHERE section_id IN (SELECT id FROM sections WHERE department_id = ?)', 
          [deptId]
        );
        await connection.execute(
          'DELETE FROM attendance_records WHERE session_id IN (SELECT s.id FROM attendance_sessions s JOIN faculty_courses fc ON s.faculty_course_id = fc.id WHERE fc.section_id IN (SELECT id FROM sections WHERE department_id = ?))',
          [deptId]
        );
        await connection.execute(
          'DELETE FROM attendance_sessions WHERE faculty_course_id IN (SELECT id FROM faculty_courses WHERE section_id IN (SELECT id FROM sections WHERE department_id = ?))',
          [deptId]
        );
        await connection.execute(
          'DELETE FROM faculty_courses WHERE section_id IN (SELECT id FROM sections WHERE department_id = ?)', 
          [deptId]
        );
        await connection.execute(
          'DELETE FROM sections WHERE department_id = ?', 
          [deptId]
        );
        await connection.execute(
          'DELETE FROM courses WHERE department_id = ?', 
          [deptId]
        );
        await connection.execute(
          'DELETE FROM users WHERE department_id = ?', 
          [deptId]
        );
        await connection.execute(
          'DELETE FROM departments WHERE id = ?', 
          [deptId]
        );
        
        console.log(`✅ Deleted: ${deptName} (${code})`);
      } else {
        console.log(`ℹ️  Not found: ${code}`);
      }
    }
    
    // Show remaining departments
    const [remaining] = await connection.execute(
      'SELECT code, name FROM departments ORDER BY code'
    ) as any;
    
    console.log('\n📋 Remaining departments:');
    console.log('─'.repeat(50));
    remaining.forEach((d: any) => console.log(`  • ${d.code}: ${d.name}`));
    console.log('─'.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

removeDepartments();
