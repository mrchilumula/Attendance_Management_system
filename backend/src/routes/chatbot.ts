import { Router, Request, Response } from 'express';
import pool from '../database/connection';
import { authenticate } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Process chatbot query
router.post('/query', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (!message) {
      res.status(400).json({ success: false, error: 'Message is required' });
      return;
    }

    const lowerMessage = message.toLowerCase().trim();
    let response = '';

    // Route to appropriate handler based on user role
    if (userRole === 'faculty') {
      response = await handleFacultyQuery(userId, lowerMessage);
    } else if (userRole === 'student') {
      response = await handleStudentQuery(userId, lowerMessage);
    } else {
      response = "I'm sorry, chatbot is only available for faculty and students.";
    }

    res.json({ 
      success: true, 
      data: { 
        response,
        timestamp: new Date()
      } 
    });
  } catch (error) {
    console.error('Chatbot query error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Handle faculty queries
async function handleFacultyQuery(facultyId: string, query: string): Promise<string> {
  // Get faculty name
  const [[faculty]] = await pool.execute<RowDataPacket[]>(
    'SELECT first_name, last_name FROM users WHERE id = ?',
    [facultyId]
  );
  const facultyName = faculty ? `${faculty.first_name}` : 'Professor';

  // Check for greetings
  if (query.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    return `Hello ${facultyName}! 👋 I'm your attendance assistant. I can help you with:\n\n` +
      `• **"my courses"** - View your assigned courses\n` +
      `• **"total classes"** - See how many classes you've taken\n` +
      `• **"attendance summary"** - Get attendance statistics\n` +
      `• **"low attendance"** - Students below 75% attendance\n` +
      `• **"today's schedule"** - Classes scheduled for today\n\n` +
      `What would you like to know?`;
  }

  // My courses / assigned courses
  if (query.match(/(my courses|assigned courses|what courses|which courses|teaching)/)) {
    const [courses] = await pool.execute<RowDataPacket[]>(`
      SELECT c.code, c.name, s.name as section_name, d.name as department_name,
             (SELECT COUNT(*) FROM student_sections ss WHERE ss.section_id = s.id) as student_count
      FROM faculty_courses fc
      JOIN courses c ON fc.course_id = c.id
      JOIN sections s ON fc.section_id = s.id
      JOIN departments d ON c.department_id = d.id
      JOIN semesters sem ON fc.semester_id = sem.id
      WHERE fc.faculty_id = ? AND sem.is_current = 1
      ORDER BY c.code
    `, [facultyId]);

    if (courses.length === 0) {
      return `You don't have any courses assigned for the current semester yet.`;
    }

    let response = `📚 **Your Assigned Courses (${courses.length}):**\n\n`;
    courses.forEach((course: any, index: number) => {
      response += `${index + 1}. **${course.code}** - ${course.name}\n`;
      response += `   📍 Section: ${course.section_name} | 👥 Students: ${course.student_count}\n\n`;
    });
    return response;
  }

  // Total classes taken
  if (query.match(/(total classes|how many classes|classes taken|sessions|number of classes)/)) {
    const [stats] = await pool.execute<RowDataPacket[]>(`
      SELECT c.code, c.name, s.name as section_name,
             COUNT(ats.id) as total_sessions,
             MIN(ats.date) as first_class,
             MAX(ats.date) as last_class
      FROM faculty_courses fc
      JOIN courses c ON fc.course_id = c.id
      JOIN sections s ON fc.section_id = s.id
      JOIN semesters sem ON fc.semester_id = sem.id
      LEFT JOIN attendance_sessions ats ON ats.faculty_course_id = fc.id
      WHERE fc.faculty_id = ? AND sem.is_current = 1
      GROUP BY fc.id, c.code, c.name, s.name
      ORDER BY c.code
    `, [facultyId]);

    if (stats.length === 0) {
      return `You don't have any courses assigned yet.`;
    }

    let totalClasses = 0;
    let response = `📊 **Classes Taken This Semester:**\n\n`;
    
    stats.forEach((stat: any) => {
      totalClasses += stat.total_sessions;
      response += `**${stat.code}** (${stat.section_name}): **${stat.total_sessions}** classes\n`;
      if (stat.first_class) {
        response += `   📅 ${new Date(stat.first_class).toLocaleDateString('en-IN')} - ${new Date(stat.last_class).toLocaleDateString('en-IN')}\n`;
      }
    });
    
    response += `\n📈 **Total Classes:** ${totalClasses}`;
    return response;
  }

  // Attendance summary / statistics
  if (query.match(/(attendance summary|attendance statistics|attendance stats|overall attendance|average attendance)/)) {
    const [stats] = await pool.execute<RowDataPacket[]>(`
      SELECT c.code, c.name, s.name as section_name,
             COUNT(DISTINCT ats.id) as total_sessions,
             COUNT(ar.id) as total_records,
             SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
             SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
             SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late_count
      FROM faculty_courses fc
      JOIN courses c ON fc.course_id = c.id
      JOIN sections s ON fc.section_id = s.id
      JOIN semesters sem ON fc.semester_id = sem.id
      LEFT JOIN attendance_sessions ats ON ats.faculty_course_id = fc.id
      LEFT JOIN attendance_records ar ON ar.session_id = ats.id
      WHERE fc.faculty_id = ? AND sem.is_current = 1
      GROUP BY fc.id, c.code, c.name, s.name
      ORDER BY c.code
    `, [facultyId]);

    if (stats.length === 0) {
      return `No attendance data available yet.`;
    }

    let response = `📊 **Attendance Summary:**\n\n`;
    
    stats.forEach((stat: any) => {
      const percentage = stat.total_records > 0 
        ? Math.round((stat.present_count / stat.total_records) * 100) 
        : 0;
      
      response += `**${stat.code}** - ${stat.section_name}\n`;
      response += `   📅 Sessions: ${stat.total_sessions}\n`;
      response += `   ✅ Present: ${stat.present_count} | ❌ Absent: ${stat.absent_count} | ⏰ Late: ${stat.late_count}\n`;
      response += `   📈 Average Attendance: **${percentage}%**\n\n`;
    });
    
    return response;
  }

  // Low attendance students
  if (query.match(/(low attendance|below 75|defaulters|poor attendance|students at risk)/)) {
    const [lowStudents] = await pool.execute<RowDataPacket[]>(`
      SELECT u.first_name, u.last_name, ss.roll_number, c.code as course_code,
             sec.name as section_name,
             COUNT(DISTINCT ats.id) as total_classes,
             SUM(CASE WHEN ar.status = 'present' OR ar.status = 'late' THEN 1 ELSE 0 END) as attended
      FROM faculty_courses fc
      JOIN courses c ON fc.course_id = c.id
      JOIN sections sec ON fc.section_id = sec.id
      JOIN semesters sem ON fc.semester_id = sem.id
      JOIN student_sections ss ON ss.section_id = sec.id
      JOIN users u ON ss.student_id = u.id
      JOIN attendance_sessions ats ON ats.faculty_course_id = fc.id
      LEFT JOIN attendance_records ar ON ar.session_id = ats.id AND ar.student_id = u.id
      WHERE fc.faculty_id = ? AND sem.is_current = 1 AND u.is_active = 1
      GROUP BY u.id, u.first_name, u.last_name, ss.roll_number, c.code, sec.name
      HAVING (attended / total_classes * 100) < 75 AND total_classes > 0
      ORDER BY (attended / total_classes) ASC
      LIMIT 15
    `, [facultyId]);

    if (lowStudents.length === 0) {
      return `🎉 Great news! No students are below 75% attendance in your courses.`;
    }

    let response = `⚠️ **Students Below 75% Attendance:**\n\n`;
    
    lowStudents.forEach((student: any, index: number) => {
      const percentage = Math.round((student.attended / student.total_classes) * 100);
      response += `${index + 1}. **${student.roll_number}** - ${student.first_name} ${student.last_name}\n`;
      response += `   📚 ${student.course_code} | 📊 ${percentage}% (${student.attended}/${student.total_classes})\n\n`;
    });
    
    return response;
  }

  // Today's schedule
  if (query.match(/(today|schedule|upcoming|next class)/)) {
    const [todaySessions] = await pool.execute<RowDataPacket[]>(`
      SELECT c.code, c.name, s.name as section_name, ats.period_number, ats.topic,
             ats.start_time, ats.end_time,
             (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = ats.id AND ar.status = 'present') as present
      FROM faculty_courses fc
      JOIN courses c ON fc.course_id = c.id
      JOIN sections s ON fc.section_id = s.id
      JOIN semesters sem ON fc.semester_id = sem.id
      JOIN attendance_sessions ats ON ats.faculty_course_id = fc.id
      WHERE fc.faculty_id = ? AND sem.is_current = 1 AND DATE(ats.date) = CURDATE()
      ORDER BY ats.period_number, ats.start_time
    `, [facultyId]);

    if (todaySessions.length === 0) {
      return `📅 No classes recorded for today. You can take attendance from your dashboard.`;
    }

    let response = `📅 **Today's Classes:**\n\n`;
    
    todaySessions.forEach((session: any, index: number) => {
      response += `${index + 1}. **${session.code}** - ${session.section_name}\n`;
      if (session.period_number) response += `   ⏰ Period ${session.period_number}`;
      if (session.topic) response += ` | 📝 ${session.topic}`;
      response += `\n   ✅ Present: ${session.present} students\n\n`;
    });
    
    return response;
  }

  // Help
  if (query.match(/(help|what can you do|commands|options)/)) {
    return `🤖 **I can help you with:**\n\n` +
      `• **"my courses"** - View your assigned courses\n` +
      `• **"total classes"** - Number of classes taken\n` +
      `• **"attendance summary"** - Overall attendance statistics\n` +
      `• **"low attendance"** - Students below 75%\n` +
      `• **"today"** - Today's classes\n\n` +
      `Just type your question naturally!`;
  }

  // Default response
  return `I'm not sure I understand. Try asking about:\n` +
    `• Your courses\n` +
    `• Total classes taken\n` +
    `• Attendance summary\n` +
    `• Low attendance students\n\n` +
    `Or type **"help"** for more options.`;
}

// Handle student queries
async function handleStudentQuery(studentId: string, query: string): Promise<string> {
  // Get student info
  const [[student]] = await pool.execute<RowDataPacket[]>(`
    SELECT u.first_name, u.last_name, ss.roll_number, s.name as section_name, d.name as department_name
    FROM users u
    LEFT JOIN student_sections ss ON u.id = ss.student_id
    LEFT JOIN sections s ON ss.section_id = s.id
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE u.id = ?
  `, [studentId]);

  const studentName = student ? student.first_name : 'Student';

  // Check for greetings
  if (query.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    return `Hello ${studentName}! 👋 I'm your attendance assistant. I can help you with:\n\n` +
      `• **"my attendance"** - Your overall attendance\n` +
      `• **"my courses"** - Courses you're enrolled in\n` +
      `• **"attendance percentage"** - Detailed percentage by course\n` +
      `• **"classes today"** - Today's attendance\n` +
      `• **"total classes"** - Total classes held\n\n` +
      `What would you like to know?`;
  }

  // My attendance / attendance percentage
  if (query.match(/(my attendance|attendance percentage|attendance report|how is my attendance|attendance status)/)) {
    const [attendance] = await pool.execute<RowDataPacket[]>(`
      SELECT c.code, c.name,
             COUNT(DISTINCT ats.id) as total_classes,
             SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present,
             SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent,
             SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late,
             SUM(CASE WHEN ar.status = 'excused' THEN 1 ELSE 0 END) as excused
      FROM student_sections ss
      JOIN sections s ON ss.section_id = s.id
      JOIN faculty_courses fc ON fc.section_id = s.id
      JOIN courses c ON fc.course_id = c.id
      JOIN semesters sem ON fc.semester_id = sem.id
      JOIN attendance_sessions ats ON ats.faculty_course_id = fc.id
      LEFT JOIN attendance_records ar ON ar.session_id = ats.id AND ar.student_id = ss.student_id
      WHERE ss.student_id = ? AND sem.is_current = 1
      GROUP BY c.id, c.code, c.name
      ORDER BY c.code
    `, [studentId]);

    if (attendance.length === 0) {
      return `📊 No attendance records found yet. Your classes may not have started.`;
    }

    let totalClasses = 0;
    let totalPresent = 0;
    let response = `📊 **Your Attendance Report:**\n\n`;
    
    attendance.forEach((att: any) => {
      const percentage = att.total_classes > 0 
        ? Math.round(((att.present + att.late) / att.total_classes) * 100) 
        : 0;
      const status = percentage >= 75 ? '✅' : '⚠️';
      
      totalClasses += att.total_classes;
      totalPresent += att.present + att.late;
      
      response += `${status} **${att.code}** - ${att.name}\n`;
      response += `   📈 **${percentage}%** (${att.present + att.late}/${att.total_classes} classes)\n`;
      response += `   ✅ Present: ${att.present} | ❌ Absent: ${att.absent}`;
      if (att.late > 0) response += ` | ⏰ Late: ${att.late}`;
      if (att.excused > 0) response += ` | 📝 Excused: ${att.excused}`;
      response += `\n\n`;
    });

    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
    response += `📊 **Overall:** ${overallPercentage}% (${totalPresent}/${totalClasses} classes)`;
    
    if (overallPercentage < 75) {
      response += `\n\n⚠️ **Warning:** Your attendance is below 75%. Please attend more classes!`;
    }
    
    return response;
  }

  // My courses / enrolled courses
  if (query.match(/(my courses|enrolled courses|what courses|which courses|studying)/)) {
    const [courses] = await pool.execute<RowDataPacket[]>(`
      SELECT DISTINCT c.code, c.name, c.credits,
             CONCAT(u.first_name, ' ', u.last_name) as faculty_name
      FROM student_sections ss
      JOIN sections s ON ss.section_id = s.id
      JOIN faculty_courses fc ON fc.section_id = s.id
      JOIN courses c ON fc.course_id = c.id
      JOIN users u ON fc.faculty_id = u.id
      JOIN semesters sem ON fc.semester_id = sem.id
      WHERE ss.student_id = ? AND sem.is_current = 1
      ORDER BY c.code
    `, [studentId]);

    if (courses.length === 0) {
      return `You're not enrolled in any courses for the current semester yet.`;
    }

    let response = `📚 **Your Courses (${courses.length}):**\n\n`;
    courses.forEach((course: any, index: number) => {
      response += `${index + 1}. **${course.code}** - ${course.name}\n`;
      response += `   👨‍🏫 ${course.faculty_name} | 📖 ${course.credits} credits\n\n`;
    });
    
    if (student?.section_name) {
      response += `📍 **Section:** ${student.section_name}`;
    }
    
    return response;
  }

  // Total classes
  if (query.match(/(total classes|how many classes|number of classes|classes held)/)) {
    const [stats] = await pool.execute<RowDataPacket[]>(`
      SELECT c.code, c.name,
             COUNT(DISTINCT ats.id) as total_classes,
             MIN(ats.date) as first_class,
             MAX(ats.date) as last_class
      FROM student_sections ss
      JOIN sections s ON ss.section_id = s.id
      JOIN faculty_courses fc ON fc.section_id = s.id
      JOIN courses c ON fc.course_id = c.id
      JOIN semesters sem ON fc.semester_id = sem.id
      LEFT JOIN attendance_sessions ats ON ats.faculty_course_id = fc.id
      WHERE ss.student_id = ? AND sem.is_current = 1
      GROUP BY c.id, c.code, c.name
      ORDER BY c.code
    `, [studentId]);

    if (stats.length === 0) {
      return `No class records found yet.`;
    }

    let totalClasses = 0;
    let response = `📅 **Classes This Semester:**\n\n`;
    
    stats.forEach((stat: any) => {
      totalClasses += stat.total_classes;
      response += `**${stat.code}** - ${stat.name}: **${stat.total_classes}** classes\n`;
      if (stat.first_class) {
        response += `   📅 ${new Date(stat.first_class).toLocaleDateString('en-IN')} - ${new Date(stat.last_class).toLocaleDateString('en-IN')}\n`;
      }
    });
    
    response += `\n📈 **Total:** ${totalClasses} classes`;
    return response;
  }

  // Today's classes
  if (query.match(/(today|classes today|today's attendance|today's classes)/)) {
    const [todayRecords] = await pool.execute<RowDataPacket[]>(`
      SELECT c.code, c.name, ar.status, ats.period_number, ats.topic
      FROM student_sections ss
      JOIN sections s ON ss.section_id = s.id
      JOIN faculty_courses fc ON fc.section_id = s.id
      JOIN courses c ON fc.course_id = c.id
      JOIN semesters sem ON fc.semester_id = sem.id
      JOIN attendance_sessions ats ON ats.faculty_course_id = fc.id
      LEFT JOIN attendance_records ar ON ar.session_id = ats.id AND ar.student_id = ss.student_id
      WHERE ss.student_id = ? AND sem.is_current = 1 AND DATE(ats.date) = CURDATE()
      ORDER BY ats.period_number, ats.created_at
    `, [studentId]);

    if (todayRecords.length === 0) {
      return `📅 No classes recorded for today yet.`;
    }

    let response = `📅 **Today's Attendance:**\n\n`;
    
    todayRecords.forEach((record: any, index: number) => {
      const statusIcon = record.status === 'present' ? '✅' : 
                         record.status === 'absent' ? '❌' : 
                         record.status === 'late' ? '⏰' : '📝';
      
      response += `${index + 1}. **${record.code}** - ${record.name}\n`;
      if (record.period_number) response += `   Period ${record.period_number}`;
      if (record.topic) response += ` | ${record.topic}`;
      response += `\n   Status: ${statusIcon} **${record.status?.toUpperCase() || 'NOT MARKED'}**\n\n`;
    });
    
    return response;
  }

  // Roll number / profile
  if (query.match(/(my roll number|roll number|my profile|my details|who am i)/)) {
    if (!student) {
      return `Unable to fetch your profile information.`;
    }
    
    return `👤 **Your Profile:**\n\n` +
      `📛 **Name:** ${student.first_name} ${student.last_name}\n` +
      `🔢 **Roll Number:** ${student.roll_number || 'Not assigned'}\n` +
      `📍 **Section:** ${student.section_name || 'Not assigned'}\n` +
      `🏛️ **Department:** ${student.department_name || 'Not assigned'}`;
  }

  // Help
  if (query.match(/(help|what can you do|commands|options)/)) {
    return `🤖 **I can help you with:**\n\n` +
      `• **"my attendance"** - Your attendance percentage\n` +
      `• **"my courses"** - Courses you're enrolled in\n` +
      `• **"total classes"** - Number of classes held\n` +
      `• **"today"** - Today's attendance status\n` +
      `• **"my profile"** - Your details\n\n` +
      `Just type your question naturally!`;
  }

  // Default response
  return `I'm not sure I understand. Try asking about:\n` +
    `• Your attendance\n` +
    `• Your courses\n` +
    `• Total classes\n` +
    `• Today's classes\n\n` +
    `Or type **"help"** for more options.`;
}

export default router;
