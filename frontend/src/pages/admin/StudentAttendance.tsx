import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, AlertCircle, User, BookOpen } from 'lucide-react';

interface StudentInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roll_number?: string;
  department_name?: string;
  department_code?: string;
  section_name?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  period_number: number | null;
  status: 'present' | 'absent' | 'late' | 'excused';
  course_code: string;
  course_name: string;
  section_name: string;
  faculty_name: string;
  remarks?: string;
}

interface CourseSummary {
  course_code: string;
  course_name: string;
  total_classes: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

const StudentAttendance: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    if (studentId) {
      fetchStudentInfo();
      fetchAttendanceRecords();
      fetchAttendanceSummary();
    }
  }, [studentId]);

  const fetchStudentInfo = async () => {
    try {
      const response = await api.get(`/admin/users`, { params: { role: 'student' } });
      const studentData = response.data.data.find((s: any) => s.id === studentId);
      if (studentData) {
        setStudent(studentData);
      }
    } catch (error) {
      console.error('Failed to fetch student info:', error);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;
      
      const response = await api.get(`/reports/student/${studentId}/attendance`, { params });
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const response = await api.get(`/reports/student/${studentId}/summary`);
      setSummary(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      setSummary([]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'excused':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-yellow-100 text-yellow-700',
      excused: 'bg-blue-100 text-blue-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${styles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const filteredRecords = selectedCourse
    ? records.filter(r => r.course_code === selectedCourse)
    : records;

  const overallStats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    excused: records.filter(r => r.status === 'excused').length,
  };

  const overallPercentage = overallStats.total > 0
    ? Math.round(((overallStats.present + overallStats.late) / overallStats.total) * 100)
    : 0;

  if (loading && !student) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/students" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Attendance</h1>
          <p className="text-gray-500">View detailed attendance records</p>
        </div>
      </div>

      {/* Student Info Card */}
      {student && (
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800">
                {student.first_name} {student.last_name}
              </h2>
              <p className="text-gray-600">{student.email}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                {student.roll_number && <span>Roll: {student.roll_number}</span>}
                {student.department_code && <span>Dept: {student.department_code}</span>}
                {student.section_name && <span>Section: {student.section_name}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${overallPercentage >= 75 ? 'text-green-600' : overallPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {overallPercentage}%
              </div>
              <p className="text-sm text-gray-500">Overall Attendance</p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-700">{overallStats.total}</p>
          <p className="text-sm text-gray-500">Total Classes</p>
        </div>
        <div className="card text-center bg-green-50">
          <p className="text-3xl font-bold text-green-600">{overallStats.present}</p>
          <p className="text-sm text-green-600">Present</p>
        </div>
        <div className="card text-center bg-red-50">
          <p className="text-3xl font-bold text-red-600">{overallStats.absent}</p>
          <p className="text-sm text-red-600">Absent</p>
        </div>
        <div className="card text-center bg-yellow-50">
          <p className="text-3xl font-bold text-yellow-600">{overallStats.late}</p>
          <p className="text-sm text-yellow-600">Late</p>
        </div>
        <div className="card text-center bg-blue-50">
          <p className="text-3xl font-bold text-blue-600">{overallStats.excused}</p>
          <p className="text-sm text-blue-600">Excused</p>
        </div>
      </div>

      {/* Course-wise Summary */}
      {summary.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Course-wise Attendance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Course</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Present</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Absent</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Late</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((course) => (
                  <tr key={course.course_code} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{course.course_code}</p>
                      <p className="text-sm text-gray-500">{course.course_name}</p>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-700">{course.total_classes}</td>
                    <td className="text-center py-3 px-4 text-green-600 font-medium">{course.present}</td>
                    <td className="text-center py-3 px-4 text-red-600 font-medium">{course.absent}</td>
                    <td className="text-center py-3 px-4 text-yellow-600 font-medium">{course.late}</td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${course.percentage >= 75 ? 'bg-green-500' : course.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${course.percentage}%` }}
                          />
                        </div>
                        <span className={`font-medium ${course.percentage >= 75 ? 'text-green-600' : course.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {course.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="input-field w-full md:w-48"
            >
              <option value="">All Courses</option>
              {[...new Set(records.map(r => r.course_code))].map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchAttendanceRecords}
              className="btn-primary"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Attendance Records */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Attendance Records ({filteredRecords.length})
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No attendance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Period</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Course</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Faculty</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {new Date(record.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {record.period_number ? `Period ${record.period_number}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="font-medium text-gray-800">{record.course_code}</span>
                      <span className="text-gray-500 ml-1">- {record.course_name}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{record.faculty_name}</td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        {getStatusBadge(record.status)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{record.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
