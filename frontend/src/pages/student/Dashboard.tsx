import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AttendanceSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, GraduationCap, Users, Clock, Calendar, Building2, User } from 'lucide-react';

interface EnrolledCourse {
  course_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  section_name: string;
  semester_name: string;
  department_name: string;
  department_code: string;
  faculty_name: string;
  faculty_email: string;
  total_sessions: number;
}

interface SectionInfo {
  section_name: string;
  department_name: string;
  department_code: string;
  semester_name: string;
  batch_year: number;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AttendanceSummary[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [sectionInfo, setSectionInfo] = useState<SectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'attendance' | 'courses'>('courses');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attendanceRes, coursesRes] = await Promise.all([
        api.get('/reports/my-attendance'),
        api.get('/reports/my-courses')
      ]);
      setSummary(attendanceRes.data.data);
      setEnrolledCourses(coursesRes.data.data.courses);
      setSectionInfo(coursesRes.data.data.sectionInfo);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const getOverallPercentage = () => {
    if (summary.length === 0) return 0;
    const total = summary.reduce((acc, s) => acc + s.percentage, 0);
    return Math.round(total / summary.length);
  };

  const overallPercentage = getOverallPercentage();
  const lowAttendanceCourses = summary.filter(s => s.percentage < 75);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
          <p className="text-gray-500">Welcome, {user?.firstName} {user?.lastName}</p>
        </div>
      </div>

      {/* Student Info Card */}
      {sectionInfo && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-800">{user?.firstName} {user?.lastName}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {sectionInfo.department_name} ({sectionInfo.department_code})
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Section {sectionInfo.section_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {sectionInfo.semester_name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Batch {sectionInfo.batch_year}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
            activeTab === 'courses'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            My Courses ({enrolledCourses.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
            activeTab === 'attendance'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Attendance ({overallPercentage}%)
          </span>
        </button>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {enrolledCourses.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No courses enrolled for this semester.</p>
              <p className="text-sm text-gray-400 mt-1">Contact your department if this is incorrect.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledCourses.map((course) => (
                <div key={course.course_id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded mb-2">
                        {course.course_code}
                      </span>
                      <h3 className="font-semibold text-gray-800">{course.course_name}</h3>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {course.credits} Credits
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4 text-blue-500" />
                      <span>{course.faculty_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-green-500" />
                      <span>Section {course.section_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span>{course.semester_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span>{course.total_sessions} Classes Conducted</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Department: {course.department_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">

      {/* Overall Summary Card */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100">Overall Attendance</p>
            <p className="text-4xl font-bold mt-1">{overallPercentage}%</p>
            <p className="text-primary-200 text-sm mt-2">
              Across {summary.length} course{summary.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className={`p-4 rounded-full ${overallPercentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}>
            {overallPercentage >= 75 ? (
              <CheckCircle className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>
        </div>
      </div>

      {/* Low Attendance Warning */}
      {lowAttendanceCourses.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Attendance Warning</h3>
              <p className="text-red-700 text-sm mt-1">
                You have below 75% attendance in {lowAttendanceCourses.length} course(s). 
                Please attend more classes to avoid detention.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Course-wise Attendance */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Course-wise Attendance</h2>
        
        {summary.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No attendance records found for this semester.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {summary.map((course) => (
              <div key={course.course_code} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded mb-1">
                      {course.course_code}
                    </span>
                    <h3 className="font-medium text-gray-800">{course.course_name}</h3>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${course.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                      {course.percentage}%
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {course.percentage >= 75 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                      <span>{course.percentage >= 75 ? 'On Track' : 'At Risk'}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      course.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(course.percentage, 100)}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    Total: <strong>{course.total_classes}</strong>
                  </span>
                  <span className="text-green-600">
                    Present: <strong>{course.present}</strong>
                  </span>
                  <span className="text-red-600">
                    Absent: <strong>{course.absent}</strong>
                  </span>
                  {course.late > 0 && (
                    <span className="text-yellow-600">
                      Late: <strong>{course.late}</strong>
                    </span>
                  )}
                  {course.excused > 0 && (
                    <span className="text-blue-600">
                      Excused: <strong>{course.excused}</strong>
                    </span>
                  )}
                </div>

                {/* 75% threshold indicator */}
                {course.percentage < 75 && (
                  <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ You need to attend at least{' '}
                    <strong>
                      {Math.ceil((0.75 * course.total_classes - (course.present + course.late)) / 0.25)} more
                    </strong>{' '}
                    classes to reach 75%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
