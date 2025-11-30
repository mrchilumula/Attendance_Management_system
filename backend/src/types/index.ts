export interface User {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'faculty' | 'student';
  phone?: string;
  department_id?: string;
  created_at: string;
  updated_at: string;
  is_active: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  hod_id?: string;
  created_at: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  department_id: string;
  semester_number: number;
  created_at: string;
}

export interface Section {
  id: string;
  name: string;
  department_id: string;
  semester_number: number;
  academic_year_id: string;
}

export interface StudentSection {
  id: string;
  student_id: string;
  section_id: string;
  roll_number: string;
}

export interface FacultyCourse {
  id: string;
  faculty_id: string;
  course_id: string;
  section_id: string;
  semester_id: string;
}

export interface AttendanceSession {
  id: string;
  faculty_course_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  period_number?: number;
  topic?: string;
  created_at: string;
  created_by: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  marked_at: string;
  marked_by: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
