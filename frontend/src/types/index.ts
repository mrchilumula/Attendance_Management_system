export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'faculty' | 'student';
  department?: string;
  departmentCode?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface Course {
  faculty_course_id: string;
  course_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  section_id: string;
  section_name: string;
  semester_id: string;
  semester_name: string;
  department_name: string;
  student_count: number;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roll_number: string;
}

export interface AttendanceSession {
  id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  period_number?: number;
  topic?: string;
  created_at: string;
  present_count: number;
  absent_count: number;
  late_count: number;
  total_count: number;
}

export interface AttendanceRecord {
  id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  marked_at: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  roll_number: string;
}

export interface AttendanceSummary {
  course_code: string;
  course_name: string;
  total_classes: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

export interface DashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
  totalCourses: number;
  totalSessions: number;
  totalSections: number;
  todaysSessions: number;
}
