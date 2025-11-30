import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// ========== USERS MANAGEMENT ==========

// Get all users (with optional filters)
router.get('/users', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, department, search } = req.query;

    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.is_active, u.created_at,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (role) {
      query += ' AND u.role = ?';
      params.push(role as string);
    }
    if (department) {
      query += ' AND d.code = ?';
      params.push(department as string);
    }
    if (search) {
      query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY u.role, u.first_name, u.last_name';

    const [users] = await pool.execute<RowDataPacket[]>(query, params);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create user
router.post(
  '/users',
  authenticate,
  authorize('admin'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('role').isIn(['admin', 'faculty', 'student']).withMessage('Invalid role'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password, firstName, lastName, role, phone, departmentId, rollNumber, sectionId } = req.body;

    // For students, roll number and section are required
    if (role === 'student') {
      if (!rollNumber || !rollNumber.trim()) {
        res.status(400).json({ success: false, error: 'Roll number is required for students' });
        return;
      }
      if (!sectionId) {
        res.status(400).json({ success: false, error: 'Section is required for students' });
        return;
      }

      // Check if roll number already exists in this section
      const [existingRoll] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM student_sections WHERE roll_number = ? AND section_id = ?',
        [rollNumber.trim(), sectionId]
      );
      if (existingRoll.length > 0) {
        res.status(400).json({ success: false, error: 'Roll number already exists in this section' });
        return;
      }
    }

    try {
      // Check if email exists
      const [existing] = await pool.execute<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        res.status(400).json({ success: false, error: 'Email already exists' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      await pool.execute(`
        INSERT INTO users (id, email, password, first_name, last_name, role, phone, department_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, email, hashedPassword, firstName, lastName, role, phone || null, departmentId || null]);

      // If student, also enroll in section
      if (role === 'student' && sectionId && rollNumber) {
        const enrollmentId = uuidv4();
        await pool.execute(`
          INSERT INTO student_sections (id, student_id, section_id, roll_number)
          VALUES (?, ?, ?, ?)
        `, [enrollmentId, userId, sectionId, rollNumber.trim()]);
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { id: userId },
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// Update user
router.put('/users/:id', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { firstName, lastName, phone, departmentId, isActive } = req.body;

  try {
    const [userRows] = await pool.execute<RowDataPacket[]>('SELECT id FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    await pool.execute(`
      UPDATE users 
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          department_id = COALESCE(?, department_id),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [firstName, lastName, phone, departmentId, isActive, id]);

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Reset user password
router.post('/users/:id/reset-password', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword || 'password123', 10);
    await pool.execute('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, id]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete user (student/faculty) - moves to recycle bin
router.delete('/users/:id', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const adminId = (req as any).user?.id;

  try {
    // Check if user exists with department info
    const [userRows] = await pool.execute<RowDataPacket[]>(`
      SELECT u.*, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [id]);
    
    if (userRows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const user = userRows[0];

    // Prevent deleting admin users
    if (user.role === 'admin') {
      res.status(400).json({ success: false, error: 'Cannot delete admin users' });
      return;
    }

    // For faculty, check if they have course assignments
    if (user.role === 'faculty') {
      const [assignments] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM faculty_courses WHERE faculty_id = ?',
        [id]
      );
      if (assignments[0].count > 0) {
        res.status(400).json({ success: false, error: 'Cannot delete faculty with course assignments. Remove assignments first.' });
        return;
      }
    }

    // Get enrollment data and attendance count for students
    let enrollmentsData = null;
    let attendanceCount = 0;

    if (user.role === 'student') {
      // Get enrollments
      const [enrollments] = await pool.execute<RowDataPacket[]>(
        'SELECT section_id, roll_number FROM student_sections WHERE student_id = ?',
        [id]
      );
      enrollmentsData = JSON.stringify(enrollments);

      // Get attendance count
      const [records] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM attendance_records WHERE student_id = ?',
        [id]
      );
      attendanceCount = records[0].count;

      // Delete attendance records
      await pool.execute('DELETE FROM attendance_records WHERE student_id = ?', [id]);

      // Delete student section enrollments
      await pool.execute('DELETE FROM student_sections WHERE student_id = ?', [id]);
    }

    // Move to recycle bin
    const deletedId = uuidv4();
    await pool.execute(`
      INSERT INTO deleted_users (id, original_id, email, password, first_name, last_name, role, phone, 
        department_id, department_name, department_code, created_at, deleted_by, enrollments_data, attendance_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      deletedId, user.id, user.email, user.password, user.first_name, user.last_name, user.role, 
      user.phone || null, user.department_id || null, user.department_name || null, 
      user.department_code || null, user.created_at || null, adminId || null, enrollmentsData, attendanceCount
    ]);

    // Delete the user from main table
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ success: true, message: 'User moved to recycle bin' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ========== RECYCLE BIN ==========

// Get all deleted users (recycle bin)
router.get('/recycle-bin', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    
    let query = `
      SELECT du.*, 
        CONCAT(deleter.first_name, ' ', deleter.last_name) as deleted_by_name
      FROM deleted_users du
      LEFT JOIN users deleter ON du.deleted_by = deleter.id
    `;
    const params: string[] = [];

    if (role) {
      query += ' WHERE du.role = ?';
      params.push(role as string);
    }

    query += ' ORDER BY du.deleted_at DESC';

    const [deletedUsers] = await pool.execute<RowDataPacket[]>(query, params);
    res.json({ success: true, data: deletedUsers });
  } catch (error) {
    console.error('Get recycle bin error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Restore user from recycle bin
router.post('/recycle-bin/:id/restore', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Get deleted user
    const [deletedRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM deleted_users WHERE id = ?',
      [id]
    );

    if (deletedRows.length === 0) {
      res.status(404).json({ success: false, error: 'Deleted user not found' });
      return;
    }

    const deletedUser = deletedRows[0];

    // Check if email is already in use
    const [existingEmail] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [deletedUser.email]
    );

    if (existingEmail.length > 0) {
      res.status(400).json({ success: false, error: 'Email is already in use by another user' });
      return;
    }

    // Restore user to main table
    await pool.execute(`
      INSERT INTO users (id, email, password, first_name, last_name, role, phone, department_id, created_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      deletedUser.original_id, deletedUser.email, deletedUser.password, deletedUser.first_name,
      deletedUser.last_name, deletedUser.role, deletedUser.phone, deletedUser.department_id, deletedUser.created_at
    ]);

    // Restore enrollments if student
    if (deletedUser.role === 'student' && deletedUser.enrollments_data) {
      const enrollments = JSON.parse(deletedUser.enrollments_data);
      for (const enrollment of enrollments) {
        // Check if section still exists
        const [sectionExists] = await pool.execute<RowDataPacket[]>(
          'SELECT id FROM sections WHERE id = ?',
          [enrollment.section_id]
        );
        
        if (sectionExists.length > 0) {
          const enrollmentId = uuidv4();
          await pool.execute(
            'INSERT INTO student_sections (id, student_id, section_id, roll_number) VALUES (?, ?, ?, ?)',
            [enrollmentId, deletedUser.original_id, enrollment.section_id, enrollment.roll_number]
          ).catch(() => {}); // Ignore if already exists
        }
      }
    }

    // Remove from recycle bin
    await pool.execute('DELETE FROM deleted_users WHERE id = ?', [id]);

    res.json({ success: true, message: 'User restored successfully' });
  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Permanently delete from recycle bin
router.delete('/recycle-bin/:id', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [deletedRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM deleted_users WHERE id = ?',
      [id]
    );

    if (deletedRows.length === 0) {
      res.status(404).json({ success: false, error: 'Deleted user not found' });
      return;
    }

    await pool.execute('DELETE FROM deleted_users WHERE id = ?', [id]);

    res.json({ success: true, message: 'User permanently deleted' });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Empty recycle bin
router.delete('/recycle-bin', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.execute('DELETE FROM deleted_users');
    res.json({ success: true, message: 'Recycle bin emptied' });
  } catch (error) {
    console.error('Empty recycle bin error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ========== DEPARTMENTS ==========

router.get('/departments', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const [departments] = await pool.execute<RowDataPacket[]>(`
      SELECT d.*, CONCAT(u.first_name, ' ', u.last_name) as hod_name
      FROM departments d
      LEFT JOIN users u ON d.hod_id = u.id
      ORDER BY d.name
    `);

    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post(
  '/departments',
  authenticate,
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Department name is required'),
    body('code').notEmpty().withMessage('Department code is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, code, hodId } = req.body;

    try {
      const id = uuidv4();
      await pool.execute('INSERT INTO departments (id, name, code, hod_id) VALUES (?, ?, ?, ?)', [id, name, code.toUpperCase(), hodId || null]);

      res.status(201).json({ success: true, message: 'Department created', data: { id } });
    } catch (error) {
      console.error('Create department error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// ========== COURSES ==========

router.get('/courses', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { department } = req.query;

    let query = `
      SELECT c.*, d.name as department_name, d.code as department_code
      FROM courses c
      JOIN departments d ON c.department_id = d.id
    `;
    const params: string[] = [];

    if (department) {
      query += ' WHERE d.code = ?';
      params.push(department as string);
    }

    query += ' ORDER BY c.code';

    const [courses] = await pool.execute<RowDataPacket[]>(query, params);
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post(
  '/courses',
  authenticate,
  authorize('admin'),
  [
    body('code').notEmpty().withMessage('Course code is required'),
    body('name').notEmpty().withMessage('Course name is required'),
    body('departmentId').notEmpty().withMessage('Department is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { code, name, departmentId, semesterNumber, credits } = req.body;

    try {
      // Check if course code already exists
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM courses WHERE code = ?',
        [code.toUpperCase()]
      );

      if (existing.length > 0) {
        res.status(400).json({ success: false, error: 'Course code already exists' });
        return;
      }

      const id = uuidv4();
      await pool.execute(`
        INSERT INTO courses (id, code, name, department_id, semester_number, credits)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, code.toUpperCase(), name, departmentId, semesterNumber || 1, credits || 3]);

      res.status(201).json({ success: true, message: 'Course created', data: { id } });
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// Update course
router.put('/courses/:id', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, departmentId, semesterNumber, credits } = req.body;

    // Check if course exists
    const [courses] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );

    if (courses.length === 0) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (departmentId) {
      updates.push('department_id = ?');
      params.push(departmentId);
    }
    if (semesterNumber) {
      updates.push('semester_number = ?');
      params.push(semesterNumber);
    }
    if (credits) {
      updates.push('credits = ?');
      params.push(credits);
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No fields to update' });
      return;
    }

    params.push(id);
    await pool.execute(
      `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete course
router.delete('/courses/:id', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if course exists
    const [courses] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM courses WHERE id = ?',
      [id]
    );

    if (courses.length === 0) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    // Check if course has faculty assignments
    const [assignments] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM faculty_courses WHERE course_id = ?',
      [id]
    );

    if (assignments[0].count > 0) {
      res.status(400).json({ success: false, error: 'Cannot delete course with faculty assignments. Remove assignments first.' });
      return;
    }

    await pool.execute('DELETE FROM courses WHERE id = ?', [id]);

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ========== SECTIONS ==========

router.get('/sections', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const [sections] = await pool.execute<RowDataPacket[]>(`
      SELECT s.*, d.name as department_name, d.code as department_code,
             ay.name as academic_year_name,
             (SELECT COUNT(*) FROM student_sections ss WHERE ss.section_id = s.id) as student_count
      FROM sections s
      JOIN departments d ON s.department_id = d.id
      JOIN academic_years ay ON s.academic_year_id = ay.id
      ORDER BY s.name
    `);

    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create new section
router.post('/sections', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, departmentId, year, semester } = req.body;

    if (!name || !departmentId) {
      res.status(400).json({ success: false, error: 'Name and department are required' });
      return;
    }

    // Get current academic year
    const [academicYears] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1'
    );

    if (academicYears.length === 0) {
      res.status(400).json({ success: false, error: 'No current academic year found' });
      return;
    }

    const academicYearId = academicYears[0].id;

    // Check if section already exists for this department, year, semester
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM sections WHERE name = ? AND department_id = ? AND semester_number = ? AND academic_year_id = ?',
      [name, departmentId, semester || (year * 2 - 1), academicYearId]
    );

    if (existing.length > 0) {
      res.status(400).json({ success: false, error: 'Section already exists for this department and semester' });
      return;
    }

    const sectionId = crypto.randomUUID();
    const semesterNumber = semester || (year ? year * 2 - 1 : 1); // Default: year 1 = sem 1, year 2 = sem 3, etc.

    await pool.execute(
      'INSERT INTO sections (id, name, department_id, semester_number, academic_year_id) VALUES (?, ?, ?, ?, ?)',
      [sectionId, name, departmentId, semesterNumber, academicYearId]
    );

    res.status(201).json({ success: true, message: 'Section created successfully', data: { id: sectionId } });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update section
router.put('/sections/:id', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, departmentId, year, semester } = req.body;

    // Check if section exists
    const [sections] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sections WHERE id = ?',
      [id]
    );

    if (sections.length === 0) {
      res.status(404).json({ success: false, error: 'Section not found' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (departmentId) {
      updates.push('department_id = ?');
      params.push(departmentId);
    }
    if (semester) {
      updates.push('semester_number = ?');
      params.push(semester);
    } else if (year) {
      updates.push('semester_number = ?');
      params.push(year * 2 - 1);
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No fields to update' });
      return;
    }

    params.push(id);
    await pool.execute(
      `UPDATE sections SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Section updated successfully' });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete section
router.delete('/sections/:id', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if section exists
    const [sections] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM sections WHERE id = ?',
      [id]
    );

    if (sections.length === 0) {
      res.status(404).json({ success: false, error: 'Section not found' });
      return;
    }

    // Check if section has students enrolled
    const [students] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM student_sections WHERE section_id = ?',
      [id]
    );

    if (students[0].count > 0) {
      res.status(400).json({ success: false, error: 'Cannot delete section with enrolled students. Remove students first.' });
      return;
    }

    // Check if section has faculty assigned
    const [faculty] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM faculty_courses WHERE section_id = ?',
      [id]
    );

    if (faculty[0].count > 0) {
      res.status(400).json({ success: false, error: 'Cannot delete section with assigned faculty courses. Remove assignments first.' });
      return;
    }

    await pool.execute('DELETE FROM sections WHERE id = ?', [id]);

    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ========== FACULTY COURSE ASSIGNMENTS ==========

router.get('/faculty-courses', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [assignments] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        fc.id,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name, u.email as faculty_email,
        c.code as course_code, c.name as course_name,
        s.name as section_name,
        sem.name as semester_name
      FROM faculty_courses fc
      JOIN users u ON fc.faculty_id = u.id
      JOIN courses c ON fc.course_id = c.id
      JOIN sections s ON fc.section_id = s.id
      JOIN semesters sem ON fc.semester_id = sem.id
      ORDER BY u.first_name, c.code
    `);

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Get faculty courses error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post(
  '/faculty-courses',
  authenticate,
  authorize('admin'),
  [
    body('facultyId').notEmpty().withMessage('Faculty is required'),
    body('courseId').notEmpty().withMessage('Course is required'),
    body('sectionId').notEmpty().withMessage('Section is required'),
    body('semesterId').notEmpty().withMessage('Semester is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { facultyId, courseId, sectionId, semesterId } = req.body;

    try {
      const id = uuidv4();
      await pool.execute(`
        INSERT INTO faculty_courses (id, faculty_id, course_id, section_id, semester_id)
        VALUES (?, ?, ?, ?, ?)
      `, [id, facultyId, courseId, sectionId, semesterId]);

      res.status(201).json({ success: true, message: 'Assignment created', data: { id } });
    } catch (error) {
      console.error('Create faculty course error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// ========== STUDENT SECTION ENROLLMENT ==========

router.post(
  '/student-sections',
  authenticate,
  authorize('admin'),
  [
    body('studentId').notEmpty().withMessage('Student is required'),
    body('sectionId').notEmpty().withMessage('Section is required'),
    body('rollNumber').notEmpty().withMessage('Roll number is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { studentId, sectionId, rollNumber } = req.body;

    try {
      const id = uuidv4();
      await pool.execute(`
        INSERT INTO student_sections (id, student_id, section_id, roll_number)
        VALUES (?, ?, ?, ?)
      `, [id, studentId, sectionId, rollNumber]);

      res.status(201).json({ success: true, message: 'Student enrolled', data: { id } });
    } catch (error) {
      console.error('Enroll student error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// ========== DASHBOARD STATS ==========

router.get('/dashboard', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [[studentsRow]] = await pool.execute<RowDataPacket[]>("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = 1");
    const [[facultyRow]] = await pool.execute<RowDataPacket[]>("SELECT COUNT(*) as count FROM users WHERE role = 'faculty' AND is_active = 1");
    const [[deptsRow]] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM departments');
    const [[coursesRow]] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM courses');
    const [[sectionsRow]] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM sections');
    const [[sessionsRow]] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM attendance_sessions');
    const [[todaysRow]] = await pool.execute<RowDataPacket[]>("SELECT COUNT(*) as count FROM attendance_sessions WHERE date = CURDATE()");

    const stats = {
      totalStudents: studentsRow.count,
      totalFaculty: facultyRow.count,
      totalDepartments: deptsRow.count,
      totalCourses: coursesRow.count,
      totalSections: sectionsRow.count,
      totalSessions: sessionsRow.count,
      todaysSessions: todaysRow.count,
    };

    // Recent sessions
    const [recentSessions] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        s.date, s.period_number,
        c.code as course_code, c.name as course_name,
        sec.name as section_name,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'present') as present,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id) as total
      FROM attendance_sessions s
      JOIN faculty_courses fc ON s.faculty_course_id = fc.id
      JOIN courses c ON fc.course_id = c.id
      JOIN sections sec ON fc.section_id = sec.id
      JOIN users u ON fc.faculty_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `);

    res.json({ success: true, data: { stats, recentSessions } });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get courses enrolled for a specific student
router.get('/students/:studentId/courses', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    // Get student's section first
    const [studentSection] = await pool.execute<RowDataPacket[]>(`
      SELECT ss.section_id, ss.roll_number, sec.name as section_name, sec.semester_number,
             CEIL(sec.semester_number / 2) as year,
             d.name as department_name, d.code as department_code
      FROM student_sections ss
      JOIN sections sec ON ss.section_id = sec.id
      JOIN departments d ON sec.department_id = d.id
      WHERE ss.student_id = ?
    `, [studentId]);

    if (studentSection.length === 0) {
      res.json({ success: true, data: { section: null, courses: [] } });
      return;
    }

    const sectionInfo = studentSection[0];

    // Get all courses assigned to this section via faculty_courses
    const [courses] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        c.id as course_id,
        c.code as course_code,
        c.name as course_name,
        c.credits,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name,
        u.email as faculty_email,
        fc.id as faculty_course_id,
        (SELECT COUNT(*) FROM attendance_sessions WHERE faculty_course_id = fc.id) as total_sessions,
        (SELECT COUNT(*) FROM attendance_records ar 
         JOIN attendance_sessions asess ON ar.session_id = asess.id 
         WHERE asess.faculty_course_id = fc.id AND ar.student_id = ? AND ar.status = 'present') as present_count,
        (SELECT COUNT(*) FROM attendance_records ar 
         JOIN attendance_sessions asess ON ar.session_id = asess.id 
         WHERE asess.faculty_course_id = fc.id AND ar.student_id = ?) as total_attended
      FROM faculty_courses fc
      JOIN courses c ON fc.course_id = c.id
      JOIN users u ON fc.faculty_id = u.id
      WHERE fc.section_id = ?
      ORDER BY c.code
    `, [studentId, studentId, sectionInfo.section_id]);

    // Calculate attendance percentage for each course
    const coursesWithPercentage = courses.map((course: any) => ({
      ...course,
      attendance_percentage: course.total_attended > 0 
        ? Math.round((course.present_count / course.total_attended) * 100) 
        : 0
    }));

    res.json({ 
      success: true, 
      data: { 
        section: sectionInfo,
        courses: coursesWithPercentage 
      } 
    });
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get available sections for enrollment (sections student is NOT enrolled in)
router.get('/students/:studentId/available-sections', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    
    // Get sections the student is not enrolled in
    const [sections] = await pool.execute<RowDataPacket[]>(`
      SELECT s.id, s.name, s.semester_number, d.name as department_name, d.code as department_code,
        ay.name as academic_year
      FROM sections s
      JOIN departments d ON s.department_id = d.id
      JOIN academic_years ay ON s.academic_year_id = ay.id
      WHERE s.id NOT IN (
        SELECT section_id FROM student_sections WHERE student_id = ?
      )
      ORDER BY d.name, s.semester_number, s.name
    `, [studentId]);

    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Get available sections error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Enroll student in a section
router.post('/students/:studentId/enroll', async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { sectionId, rollNumber } = req.body;

    if (!sectionId || !rollNumber) {
      res.status(400).json({ success: false, error: 'Section ID and roll number are required' });
      return;
    }

    // Check if student exists
    const [students] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [studentId, 'student']
    );

    if (students.length === 0) {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }

    // Check if section exists
    const [sections] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM sections WHERE id = ?',
      [sectionId]
    );

    if (sections.length === 0) {
      res.status(404).json({ success: false, error: 'Section not found' });
      return;
    }

    // Check if already enrolled
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM student_sections WHERE student_id = ? AND section_id = ?',
      [studentId, sectionId]
    );

    if (existing.length > 0) {
      res.status(400).json({ success: false, error: 'Student already enrolled in this section' });
      return;
    }

    // Check if roll number is already used in this section
    const [existingRoll] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM student_sections WHERE section_id = ? AND roll_number = ?',
      [sectionId, rollNumber]
    );

    if (existingRoll.length > 0) {
      res.status(400).json({ success: false, error: 'Roll number already used in this section' });
      return;
    }

    // Enroll student
    const enrollmentId = crypto.randomUUID();
    await pool.execute(
      'INSERT INTO student_sections (id, student_id, section_id, roll_number) VALUES (?, ?, ?, ?)',
      [enrollmentId, studentId, sectionId, rollNumber]
    );

    res.json({ success: true, message: 'Student enrolled successfully' });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Unenroll student from a section
router.delete('/students/:studentId/enroll/:sectionId', async (req: Request, res: Response) => {
  try {
    const { studentId, sectionId } = req.params;

    // Check if enrollment exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM student_sections WHERE student_id = ? AND section_id = ?',
      [studentId, sectionId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Enrollment not found' });
    }

    // Delete enrollment
    await pool.execute(
      'DELETE FROM student_sections WHERE student_id = ? AND section_id = ?',
      [studentId, sectionId]
    );

    res.json({ success: true, message: 'Student unenrolled successfully' });
  } catch (error) {
    console.error('Unenroll student error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get student's current enrollments
router.get('/students/:studentId/enrollments', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    
    const [enrollments] = await pool.execute<RowDataPacket[]>(`
      SELECT ss.id, ss.roll_number, s.id as section_id, s.name as section_name, 
        s.semester_number, d.name as department_name, d.code as department_code,
        ay.name as academic_year,
        (SELECT COUNT(DISTINCT fc.course_id) FROM faculty_courses fc WHERE fc.section_id = s.id) as course_count
      FROM student_sections ss
      JOIN sections s ON ss.section_id = s.id
      JOIN departments d ON s.department_id = d.id
      JOIN academic_years ay ON s.academic_year_id = ay.id
      WHERE ss.student_id = ?
      ORDER BY d.name, s.semester_number, s.name
    `, [studentId]);

    res.json({ success: true, data: enrollments });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
