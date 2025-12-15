import pool from './connection';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function addCSEBranches() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🚀 Adding CSE Branches...\n');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Get current academic year and semester
    const [academicYears] = await connection.execute('SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1') as any;
    const academicYearId = academicYears[0]?.id;
    
    const [semesters] = await connection.execute('SELECT id FROM semesters WHERE is_current = 1 LIMIT 1') as any;
    const semesterId = semesters[0]?.id;
    
    if (!academicYearId || !semesterId) {
      console.log('❌ No current academic year or semester found!');
      process.exit(1);
    }
    
    // Define CSE branches
    const cseBranches = [
      { id: uuidv4(), name: 'CSE - Core', code: 'CSE-CORE' },
      { id: uuidv4(), name: 'CSE - Data Science', code: 'CSE-DS' },
      { id: uuidv4(), name: 'CSE - AI/ML', code: 'CSE-AIML' },
      { id: uuidv4(), name: 'CSE - Applied Mathematics', code: 'CSE-AM' },
    ];
    
    // Insert branches as departments
    for (const branch of cseBranches) {
      try {
        await connection.execute(
          `INSERT INTO departments (id, name, code) VALUES (?, ?, ?)`,
          [branch.id, branch.name, branch.code]
        );
        console.log(`✅ Added branch: ${branch.name} (${branch.code})`);
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️  Branch already exists: ${branch.name} (${branch.code})`);
          // Get existing ID
          const [existing] = await connection.execute(
            'SELECT id FROM departments WHERE code = ?', [branch.code]
          ) as any;
          branch.id = existing[0]?.id;
        } else {
          throw err;
        }
      }
    }
    
    // Define courses for each branch
    const branchCourses: Record<string, { code: string; name: string; credits: number; semester: number }[]> = {
      'CSE-CORE': [
        { code: 'CSC301', name: 'Advanced Data Structures', credits: 4, semester: 3 },
        { code: 'CSC302', name: 'Computer Architecture', credits: 3, semester: 3 },
        { code: 'CSC303', name: 'Theory of Computation', credits: 3, semester: 3 },
        { code: 'CSC304', name: 'Compiler Design', credits: 4, semester: 3 },
        { code: 'CSC305', name: 'Software Engineering', credits: 3, semester: 3 },
      ],
      'CSE-DS': [
        { code: 'CSD301', name: 'Data Mining & Warehousing', credits: 4, semester: 3 },
        { code: 'CSD302', name: 'Big Data Analytics', credits: 4, semester: 3 },
        { code: 'CSD303', name: 'Statistical Methods', credits: 3, semester: 3 },
        { code: 'CSD304', name: 'Data Visualization', credits: 3, semester: 3 },
        { code: 'CSD305', name: 'Machine Learning Basics', credits: 4, semester: 3 },
      ],
      'CSE-AIML': [
        { code: 'CSA301', name: 'Artificial Intelligence', credits: 4, semester: 3 },
        { code: 'CSA302', name: 'Machine Learning', credits: 4, semester: 3 },
        { code: 'CSA303', name: 'Deep Learning', credits: 4, semester: 3 },
        { code: 'CSA304', name: 'Natural Language Processing', credits: 3, semester: 3 },
        { code: 'CSA305', name: 'Computer Vision', credits: 3, semester: 3 },
      ],
      'CSE-AM': [
        { code: 'CSM301', name: 'Linear Algebra for Computing', credits: 4, semester: 3 },
        { code: 'CSM302', name: 'Probability & Statistics', credits: 4, semester: 3 },
        { code: 'CSM303', name: 'Numerical Methods', credits: 3, semester: 3 },
        { code: 'CSM304', name: 'Optimization Techniques', credits: 3, semester: 3 },
        { code: 'CSM305', name: 'Discrete Mathematics', credits: 3, semester: 3 },
      ],
    };
    
    // Insert courses and create sections for each branch
    console.log('\n📚 Adding courses and sections...\n');
    
    for (const branch of cseBranches) {
      const courses = branchCourses[branch.code];
      if (!courses) continue;
      
      // Create sections A and B for each branch
      const sectionA = { id: uuidv4(), name: `${branch.code}-A` };
      const sectionB = { id: uuidv4(), name: `${branch.code}-B` };
      
      for (const section of [sectionA, sectionB]) {
        try {
          await connection.execute(
            `INSERT INTO sections (id, name, department_id, semester_number, academic_year_id)
             VALUES (?, ?, ?, ?, ?)`,
            [section.id, section.name, branch.id, 3, academicYearId]
          );
          console.log(`  ✅ Created section: ${section.name}`);
        } catch (err: any) {
          if (err.code === 'ER_DUP_ENTRY') {
            console.log(`  ℹ️  Section already exists: ${section.name}`);
          }
        }
      }
      
      // Create courses
      const courseIds: string[] = [];
      for (const course of courses) {
        const courseId = uuidv4();
        try {
          await connection.execute(
            `INSERT INTO courses (id, code, name, credits, department_id, semester_number)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [courseId, course.code, course.name, course.credits, branch.id, course.semester]
          );
          courseIds.push(courseId);
          console.log(`  ✅ Added course: ${course.code} - ${course.name}`);
        } catch (err: any) {
          if (err.code === 'ER_DUP_ENTRY') {
            console.log(`  ℹ️  Course already exists: ${course.code}`);
            const [existing] = await connection.execute(
              'SELECT id FROM courses WHERE code = ?', [course.code]
            ) as any;
            if (existing[0]) courseIds.push(existing[0].id);
          }
        }
      }
      
      // Create faculty for each branch
      const facultyList = [
        { firstName: 'Dr. Anil', lastName: 'Verma' },
        { firstName: 'Dr. Sunita', lastName: 'Reddy' },
      ];
      
      console.log(`\n👨‍🏫 Adding faculty for ${branch.name}...\n`);
      
      for (let i = 0; i < facultyList.length; i++) {
        const faculty = facultyList[i];
        const facultyId = uuidv4();
        const email = `${faculty.firstName.toLowerCase().replace('dr. ', '')}.${faculty.lastName.toLowerCase()}.${branch.code.toLowerCase().replace('-', '')}@crrit.edu.in`;
        
        try {
          await connection.execute(
            `INSERT INTO users (id, email, password, first_name, last_name, role, department_id, must_change_password)
             VALUES (?, ?, ?, ?, ?, 'faculty', ?, 0)`,
            [facultyId, email, hashedPassword, faculty.firstName, faculty.lastName, branch.id]
          );
          console.log(`  ✅ Added faculty: ${faculty.firstName} ${faculty.lastName} (${email})`);
          
          // Assign courses to faculty - get section IDs first
          const [sections] = await connection.execute(
            'SELECT id, name FROM sections WHERE department_id = ?', [branch.id]
          ) as any;
          
          // Assign first 2-3 courses to this faculty for section A
          const sectionAId = sections.find((s: any) => s.name.endsWith('-A'))?.id;
          if (sectionAId && courseIds.length > 0) {
            const coursesToAssign = courseIds.slice(i * 2, i * 2 + 3);
            for (const courseId of coursesToAssign) {
              try {
                await connection.execute(
                  `INSERT INTO faculty_courses (id, faculty_id, course_id, section_id, semester_id)
                   VALUES (?, ?, ?, ?, ?)`,
                  [uuidv4(), facultyId, courseId, sectionAId, semesterId]
                );
              } catch (err: any) {
                // Ignore duplicate entries
              }
            }
          }
        } catch (err: any) {
          if (err.code === 'ER_DUP_ENTRY') {
            console.log(`  ℹ️  Faculty already exists: ${email}`);
          }
        }
      }
      
      // Create sample students for each branch
      console.log(`\n👨‍🎓 Adding students for ${branch.name}...\n`);
      
      const [branchSections] = await connection.execute(
        'SELECT id, name FROM sections WHERE department_id = ?', [branch.id]
      ) as any;
      
      const sectionAId = branchSections.find((s: any) => s.name.endsWith('-A'))?.id;
      const sectionBId = branchSections.find((s: any) => s.name.endsWith('-B'))?.id;
      
      const branchCode = branch.code.replace('-', '').replace('CSE', '').toLowerCase() || 'core';
      
      // Add 10 students per section
      for (let i = 1; i <= 10; i++) {
        const rollNoA = `21${branchCode}A${i.toString().padStart(2, '0')}`;
        const rollNoB = `21${branchCode}B${i.toString().padStart(2, '0')}`;
        
        // Section A student
        if (sectionAId) {
          const studentIdA = uuidv4();
          const emailA = `${rollNoA.toLowerCase()}@crrit.edu.in`;
          try {
            await connection.execute(
              `INSERT INTO users (id, email, password, first_name, last_name, role, department_id, must_change_password)
               VALUES (?, ?, ?, ?, ?, 'student', ?, 0)`,
              [studentIdA, emailA, hashedPassword, `Student${i}`, branch.code.replace('CSE-', ''), branch.id]
            );
            await connection.execute(
              `INSERT INTO student_sections (id, student_id, section_id, roll_number)
               VALUES (?, ?, ?, ?)`,
              [uuidv4(), studentIdA, sectionAId, rollNoA]
            );
          } catch (err: any) {
            // Ignore duplicates
          }
        }
        
        // Section B student
        if (sectionBId) {
          const studentIdB = uuidv4();
          const emailB = `${rollNoB.toLowerCase()}@crrit.edu.in`;
          try {
            await connection.execute(
              `INSERT INTO users (id, email, password, first_name, last_name, role, department_id, must_change_password)
               VALUES (?, ?, ?, ?, ?, 'student', ?, 0)`,
              [studentIdB, emailB, hashedPassword, `Student${i}`, branch.code.replace('CSE-', ''), branch.id]
            );
            await connection.execute(
              `INSERT INTO student_sections (id, student_id, section_id, roll_number)
               VALUES (?, ?, ?, ?)`,
              [uuidv4(), studentIdB, sectionBId, rollNoB]
            );
          } catch (err: any) {
            // Ignore duplicates
          }
        }
      }
      console.log(`  ✅ Added 20 students for ${branch.name}`);
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ CSE Branches setup complete!\n');
    console.log('📋 New Branches Added:');
    console.log('─'.repeat(60));
    for (const branch of cseBranches) {
      console.log(`  • ${branch.name} (${branch.code})`);
    }
    console.log('\n📋 Sample Login Credentials (password: password123):');
    console.log('─'.repeat(60));
    console.log('  CSE-CORE Student:  21corea01@crrit.edu.in');
    console.log('  CSE-DS Student:    21dsa01@crrit.edu.in');
    console.log('  CSE-AIML Student:  21aimla01@crrit.edu.in');
    console.log('  CSE-AM Student:    21ama01@crrit.edu.in');
    console.log('═'.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

addCSEBranches();
