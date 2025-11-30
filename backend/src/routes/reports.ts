import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticate, authorize } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Student: Get my attendance summary
router.get('/my-attendance', authenticate, authorize('student'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [summary] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        c.code as course_code, c.name as course_name,
        COUNT(ar.id) as total_classes,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN ar.status = 'excused' THEN 1 ELSE 0 END) as excused,
        ROUND(CAST(SUM(CASE WHEN ar.status IN ('present', 'late') THEN 1 ELSE 0 END) AS DECIMAL(10,2)) / COUNT(ar.id) * 100, 2) as percentage
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      JOIN faculty_courses fc ON s.faculty_course_id = fc.id
      JOIN courses c ON fc.course_id = c.id
      JOIN semesters sem ON fc.semester_id = sem.id
      WHERE ar.student_id = ? AND sem.is_current = 1
      GROUP BY c.id
      ORDER BY c.code
    `, [req.user!.userId]);

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Student: Get detailed attendance for a course
router.get('/my-attendance/:courseCode', authenticate, authorize('student'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseCode } = req.params;

    const [records] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        s.date, s.period_number, s.topic,
        ar.status, ar.remarks,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      JOIN faculty_courses fc ON s.faculty_course_id = fc.id
      JOIN courses c ON fc.course_id = c.id
      JOIN users u ON fc.faculty_id = u.id
      WHERE ar.student_id = ? AND c.code = ?
      ORDER BY s.date DESC, s.period_number DESC
    `, [req.user!.userId, courseCode]);

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Get course attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Faculty/Admin: Get attendance report for a course section
router.get('/report/:facultyCourseId', authenticate, authorize('faculty', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { facultyCourseId } = req.params;
    const { startDate, endDate } = req.query;

    // Get course info
    const [courseInfoRows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        c.code, c.name as course_name, s.name as section_name,
        d.name as department_name
      FROM faculty_courses fc
      JOIN courses c ON fc.course_id = c.id
      JOIN sections s ON fc.section_id = s.id
      JOIN departments d ON c.department_id = d.id
      WHERE fc.id = ?
    `, [facultyCourseId]);

    const courseInfo = courseInfoRows[0];

    if (!courseInfo) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    // Build dynamic query for date range
    let sessionFilter = 'WHERE s.faculty_course_id = ?';
    const params: string[] = [facultyCourseId];

    if (startDate) {
      sessionFilter += ' AND s.date >= ?';
      params.push(startDate as string);
    }
    if (endDate) {
      sessionFilter += ' AND s.date <= ?';
      params.push(endDate as string);
    }

    // Get student-wise attendance summary
    const [report] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        u.id as student_id,
        ss.roll_number,
        u.first_name, u.last_name,
        COUNT(ar.id) as total_classes,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN ar.status = 'excused' THEN 1 ELSE 0 END) as excused,
        ROUND(CAST(SUM(CASE WHEN ar.status IN ('present', 'late') THEN 1 ELSE 0 END) AS DECIMAL(10,2)) / COUNT(ar.id) * 100, 2) as percentage
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      JOIN users u ON ar.student_id = u.id
      JOIN student_sections ss ON u.id = ss.student_id
      ${sessionFilter}
      GROUP BY u.id, ss.roll_number, u.first_name, u.last_name
      ORDER BY ss.roll_number
    `, params);

    // Get total sessions count
    const [[totalSessionsRow]] = await pool.execute<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM attendance_sessions s ${sessionFilter}
    `, params);

    res.json({
      success: true,
      data: {
        courseInfo,
        totalSessions: totalSessionsRow.count,
        report,
      },
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Faculty/Admin: Get low attendance students (below 75%)
router.get('/low-attendance/:facultyCourseId', authenticate, authorize('faculty', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { facultyCourseId } = req.params;
    const threshold = parseFloat(req.query.threshold as string) || 75;

    const [lowAttendance] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        u.id as student_id,
        ss.roll_number,
        u.first_name, u.last_name, u.email,
        COUNT(ar.id) as total_classes,
        SUM(CASE WHEN ar.status IN ('present', 'late') THEN 1 ELSE 0 END) as attended,
        ROUND(CAST(SUM(CASE WHEN ar.status IN ('present', 'late') THEN 1 ELSE 0 END) AS DECIMAL(10,2)) / COUNT(ar.id) * 100, 2) as percentage
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      JOIN users u ON ar.student_id = u.id
      JOIN student_sections ss ON u.id = ss.student_id
      WHERE s.faculty_course_id = ?
      GROUP BY u.id, ss.roll_number, u.first_name, u.last_name, u.email
      HAVING percentage < ?
      ORDER BY percentage ASC
    `, [facultyCourseId, threshold]);

    res.json({ success: true, data: lowAttendance });
  } catch (error) {
    console.error('Get low attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin: Get overall attendance statistics
router.get('/stats/overall', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const [stats] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        d.name as department,
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT fc.id) as total_courses,
        COUNT(DISTINCT s.id) as total_sessions,
        ROUND(AVG(
          CASE WHEN ar.status IN ('present', 'late') THEN 100.0 ELSE 0 END
        ), 2) as avg_attendance
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id AND u.role = 'student'
      LEFT JOIN student_sections ss ON u.id = ss.student_id
      LEFT JOIN faculty_courses fc ON ss.section_id = fc.section_id
      LEFT JOIN attendance_sessions s ON fc.id = s.faculty_course_id
      LEFT JOIN attendance_records ar ON s.id = ar.session_id
      GROUP BY d.id
      ORDER BY d.name
    `);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get overall stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Export attendance to CSV format (returns data, frontend generates CSV)
router.get('/export/:facultyCourseId', authenticate, authorize('faculty', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { facultyCourseId } = req.params;

    // Get all sessions
    const [sessions] = await pool.execute<RowDataPacket[]>(`
      SELECT id, date, period_number 
      FROM attendance_sessions 
      WHERE faculty_course_id = ? 
      ORDER BY date, period_number
    `, [facultyCourseId]);

    // Get all students with their attendance
    const [students] = await pool.execute<RowDataPacket[]>(`
      SELECT DISTINCT
        u.id, ss.roll_number, u.first_name, u.last_name
      FROM users u
      JOIN student_sections ss ON u.id = ss.student_id
      JOIN faculty_courses fc ON ss.section_id = fc.section_id
      WHERE fc.id = ?
      ORDER BY ss.roll_number
    `, [facultyCourseId]);

    // Get attendance records
    const [records] = await pool.execute<RowDataPacket[]>(`
      SELECT ar.student_id, ar.session_id, ar.status
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      WHERE s.faculty_course_id = ?
    `, [facultyCourseId]);

    // Build attendance matrix
    const recordMap = new Map<string, string>();
    for (const r of records as { student_id: string; session_id: string; status: string }[]) {
      recordMap.set(`${r.student_id}-${r.session_id}`, r.status);
    }

    const exportData = (students as { id: string; roll_number: string; first_name: string; last_name: string }[]).map((student) => {
      const row: Record<string, string | number> = {
        roll_number: student.roll_number,
        name: `${student.first_name} ${student.last_name}`,
      };

      let present = 0;
      let total = 0;

      for (const session of sessions as { id: string; date: string; period_number: number }[]) {
        const status = recordMap.get(`${student.id}-${session.id}`) || '-';
        row[`${session.date}_P${session.period_number || 1}`] = status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'late' ? 'L' : 'E';
        if (status !== '-') {
          total++;
          if (status === 'present' || status === 'late') present++;
        }
      }

      row['total_classes'] = total;
      row['present'] = present;
      row['percentage'] = total > 0 ? Math.round((present / total) * 100) : 0;

      return row;
    });

    res.json({
      success: true,
      data: {
        sessions: (sessions as { date: string; period_number: number }[]).map((s) => ({ date: s.date, period: s.period_number })),
        students: exportData,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin: Get detailed attendance records for any student
router.get('/student/:studentId/attendance', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { from, to } = req.query;

    let dateFilter = '';
    const params: string[] = [studentId];

    if (from) {
      dateFilter += ' AND s.date >= ?';
      params.push(from as string);
    }
    if (to) {
      dateFilter += ' AND s.date <= ?';
      params.push(to as string);
    }

    const [records] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        ar.id,
        s.date,
        s.period_number,
        ar.status,
        ar.remarks,
        c.code as course_code,
        c.name as course_name,
        sec.name as section_name,
        CONCAT(u.first_name, ' ', u.last_name) as faculty_name
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      JOIN faculty_courses fc ON s.faculty_course_id = fc.id
      JOIN courses c ON fc.course_id = c.id
      JOIN sections sec ON fc.section_id = sec.id
      JOIN users u ON fc.faculty_id = u.id
      WHERE ar.student_id = ?${dateFilter}
      ORDER BY s.date DESC, s.period_number DESC
    `, params);

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin: Get attendance summary for any student (course-wise)
router.get('/student/:studentId/summary', authenticate, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const [summary] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        c.code as course_code,
        c.name as course_name,
        COUNT(ar.id) as total_classes,
        SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN ar.status = 'excused' THEN 1 ELSE 0 END) as excused,
        ROUND(
          CAST(SUM(CASE WHEN ar.status IN ('present', 'late') THEN 1 ELSE 0 END) AS DECIMAL(10,2)) 
          / COUNT(ar.id) * 100, 2
        ) as percentage
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      JOIN faculty_courses fc ON s.faculty_course_id = fc.id
      JOIN courses c ON fc.course_id = c.id
      WHERE ar.student_id = ?
      GROUP BY c.id, c.code, c.name
      ORDER BY c.code
    `, [studentId]);

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get student summary error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
