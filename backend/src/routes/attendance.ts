import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Get faculty's assigned courses with sections
router.get('/my-courses', authenticate, authorize('faculty'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [courses] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        fc.id as faculty_course_id,
        c.id as course_id, c.code as course_code, c.name as course_name, c.credits,
        s.id as section_id, s.name as section_name,
        sem.id as semester_id, sem.name as semester_name,
        d.name as department_name,
        (SELECT COUNT(*) FROM student_sections ss WHERE ss.section_id = s.id) as student_count
      FROM faculty_courses fc
      JOIN courses c ON fc.course_id = c.id
      JOIN sections s ON fc.section_id = s.id
      JOIN semesters sem ON fc.semester_id = sem.id
      JOIN departments d ON c.department_id = d.id
      WHERE fc.faculty_id = ? AND sem.is_current = 1
      ORDER BY c.code, s.name
    `, [req.user!.userId]);

    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get faculty courses error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get students in a section for attendance
router.get('/students/:facultyCourseId', authenticate, authorize('faculty'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { facultyCourseId } = req.params;

    // Verify faculty owns this course assignment
    const [fcRows] = await pool.execute<RowDataPacket[]>(`
      SELECT fc.*, s.id as section_id 
      FROM faculty_courses fc 
      JOIN sections s ON fc.section_id = s.id
      WHERE fc.id = ? AND fc.faculty_id = ?
    `, [facultyCourseId, req.user!.userId]);

    const fc = fcRows[0];

    if (!fc) {
      res.status(404).json({ success: false, error: 'Course assignment not found' });
      return;
    }

    const [students] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        u.id, u.first_name, u.last_name, u.email,
        ss.roll_number
      FROM users u
      JOIN student_sections ss ON u.id = ss.student_id
      WHERE ss.section_id = ? AND u.is_active = 1
      ORDER BY ss.roll_number
    `, [fc.section_id]);

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create attendance session and mark attendance
router.post(
  '/sessions',
  authenticate,
  authorize('faculty'),
  [
    body('facultyCourseId').notEmpty().withMessage('Faculty course ID is required'),
    body('date').isDate().withMessage('Valid date is required'),
    body('periodNumber').optional().isInt({ min: 1, max: 10 }),
    body('topic').optional().isString(),
    body('attendance').isArray().withMessage('Attendance array is required'),
    body('attendance.*.studentId').notEmpty().withMessage('Student ID is required'),
    body('attendance.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { facultyCourseId, date, periodNumber, topic, startTime, endTime, attendance } = req.body;

    const connection = await pool.getConnection();
    
    try {
      // Verify faculty owns this course
      const [fcRows] = await connection.execute<RowDataPacket[]>(`
        SELECT id FROM faculty_courses WHERE id = ? AND faculty_id = ?
      `, [facultyCourseId, req.user!.userId]);

      if (fcRows.length === 0) {
        res.status(404).json({ success: false, error: 'Course assignment not found' });
        return;
      }

      // Check if session already exists for this date and period
      const [existingRows] = await connection.execute<RowDataPacket[]>(`
        SELECT id FROM attendance_sessions 
        WHERE faculty_course_id = ? AND date = ? AND period_number = ?
      `, [facultyCourseId, date, periodNumber || null]);

      if (existingRows.length > 0) {
        res.status(400).json({ success: false, error: 'Attendance session already exists for this date and period' });
        return;
      }

      await connection.beginTransaction();

      // Create session
      const sessionId = uuidv4();
      await connection.execute(`
        INSERT INTO attendance_sessions (id, faculty_course_id, date, start_time, end_time, period_number, topic, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [sessionId, facultyCourseId, date, startTime || null, endTime || null, periodNumber || null, topic || null, req.user!.userId]);

      // Insert attendance records
      for (const record of attendance as { studentId: string; status: string; remarks?: string }[]) {
        await connection.execute(`
          INSERT INTO attendance_records (id, session_id, student_id, status, remarks, marked_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [uuidv4(), sessionId, record.studentId, record.status, record.remarks || null, req.user!.userId]);
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
        data: { sessionId, recordsCount: attendance.length },
      });
    } catch (error) {
      await connection.rollback();
      console.error('Create session error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    } finally {
      connection.release();
    }
  }
);

// Get attendance sessions for a course
router.get('/sessions/:facultyCourseId', authenticate, authorize('faculty', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { facultyCourseId } = req.params;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        s.id, s.date, s.start_time, s.end_time, s.period_number, s.topic, s.created_at,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'present') as present_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'absent') as absent_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'late') as late_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id) as total_count
      FROM attendance_sessions s
      WHERE s.faculty_course_id = ?
    `;

    const params: (string | undefined)[] = [facultyCourseId];

    if (startDate) {
      query += ' AND s.date >= ?';
      params.push(startDate as string);
    }
    if (endDate) {
      query += ' AND s.date <= ?';
      params.push(endDate as string);
    }

    query += ' ORDER BY s.date DESC, s.period_number DESC';

    const [sessions] = await pool.execute<RowDataPacket[]>(query, params);

    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get attendance records for a session
router.get('/records/:sessionId', authenticate, authorize('faculty', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const [records] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        ar.id, ar.status, ar.remarks, ar.marked_at,
        u.id as student_id, u.first_name, u.last_name, u.email,
        ss.roll_number
      FROM attendance_records ar
      JOIN users u ON ar.student_id = u.id
      JOIN student_sections ss ON u.id = ss.student_id
      WHERE ar.session_id = ?
      ORDER BY ss.roll_number
    `, [sessionId]);

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update attendance record
router.put(
  '/records/:recordId',
  authenticate,
  authorize('faculty'),
  [body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { recordId } = req.params;
    const { status, remarks } = req.body;

    try {
      // Verify faculty owns this record's session
      const [recordRows] = await pool.execute<RowDataPacket[]>(`
        SELECT ar.id FROM attendance_records ar
        JOIN attendance_sessions s ON ar.session_id = s.id
        JOIN faculty_courses fc ON s.faculty_course_id = fc.id
        WHERE ar.id = ? AND fc.faculty_id = ?
      `, [recordId, req.user!.userId]);

      if (recordRows.length === 0) {
        res.status(404).json({ success: false, error: 'Record not found or access denied' });
        return;
      }

      await pool.execute(`
        UPDATE attendance_records 
        SET status = ?, remarks = ?, marked_at = CURRENT_TIMESTAMP, marked_by = ?
        WHERE id = ?
      `, [status, remarks || null, req.user!.userId, recordId]);

      res.json({ success: true, message: 'Attendance updated successfully' });
    } catch (error) {
      console.error('Update record error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// Delete attendance session
router.delete('/sessions/:sessionId', authenticate, authorize('faculty'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    // Verify faculty owns this session
    const [sessionRows] = await pool.execute<RowDataPacket[]>(`
      SELECT s.id FROM attendance_sessions s
      JOIN faculty_courses fc ON s.faculty_course_id = fc.id
      WHERE s.id = ? AND fc.faculty_id = ?
    `, [sessionId, req.user!.userId]);

    if (sessionRows.length === 0) {
      res.status(404).json({ success: false, error: 'Session not found or access denied' });
      return;
    }

    // Delete records first, then session
    await pool.execute('DELETE FROM attendance_records WHERE session_id = ?', [sessionId]);
    await pool.execute('DELETE FROM attendance_sessions WHERE id = ?', [sessionId]);

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
