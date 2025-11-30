import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Student } from '../../types';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, X, Clock, Shield, Save, Users } from 'lucide-react';

interface AttendanceEntry {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

const TakeAttendance: React.FC = () => {
  const { facultyCourseId } = useParams<{ facultyCourseId: string }>();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [attendance, setAttendance] = useState<Map<string, AttendanceEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodNumber, setPeriodNumber] = useState(1);
  const [topic, setTopic] = useState('');

  useEffect(() => {
    fetchData();
  }, [facultyCourseId]);

  const fetchData = async () => {
    try {
      // Fetch course info
      const coursesRes = await api.get('/attendance/my-courses');
      const course = coursesRes.data.data.find((c: any) => c.faculty_course_id === facultyCourseId);
      setCourseInfo(course);

      // Fetch students
      const studentsRes = await api.get(`/attendance/students/${facultyCourseId}`);
      setStudents(studentsRes.data.data);

      // Initialize all students as present by default
      const initialAttendance = new Map<string, AttendanceEntry>();
      studentsRes.data.data.forEach((student: Student) => {
        initialAttendance.set(student.id, { studentId: student.id, status: 'present' });
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    const newAttendance = new Map(attendance);
    newAttendance.set(studentId, { studentId, status });
    setAttendance(newAttendance);
  };

  const markAll = (status: 'present' | 'absent') => {
    const newAttendance = new Map<string, AttendanceEntry>();
    students.forEach((student) => {
      newAttendance.set(student.id, { studentId: student.id, status });
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    if (!date) {
      toast.error('Please select a date');
      return;
    }

    setSaving(true);
    try {
      const attendanceArray = Array.from(attendance.values());
      
      await api.post('/attendance/sessions', {
        facultyCourseId,
        date,
        periodNumber,
        topic,
        attendance: attendanceArray,
      });

      toast.success('Attendance saved successfully!');
      navigate(`/faculty/sessions/${facultyCourseId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    attendance.forEach((entry) => {
      counts[entry.status]++;
    });
    return counts;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/faculty')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Take Attendance</h1>
          {courseInfo && (
            <p className="text-gray-500">
              {courseInfo.course_code} - {courseInfo.course_name} • {courseInfo.section_name}
            </p>
          )}
        </div>
      </div>

      {/* Session Details */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Session Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={periodNumber}
              onChange={(e) => setPeriodNumber(parseInt(e.target.value))}
              className="input-field"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={p}>Period {p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic (Optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Arrays and Linked Lists"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Summary & Quick Actions */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">Total: {students.length}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-green-600">Present: {counts.present}</span>
              <span className="text-red-600">Absent: {counts.absent}</span>
              <span className="text-yellow-600">Late: {counts.late}</span>
              <span className="text-blue-600">Excused: {counts.excused}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => markAll('present')} className="btn-secondary text-sm">
              Mark All Present
            </button>
            <button onClick={() => markAll('absent')} className="btn-secondary text-sm">
              Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Roll No</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Student Name</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const entry = attendance.get(student.id);
                return (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono text-gray-800">{student.roll_number}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setStatus(student.id, 'present')}
                          className={`p-2 rounded-lg transition-colors ${
                            entry?.status === 'present'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                          }`}
                          title="Present"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStatus(student.id, 'absent')}
                          className={`p-2 rounded-lg transition-colors ${
                            entry?.status === 'absent'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'
                          }`}
                          title="Absent"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStatus(student.id, 'late')}
                          className={`p-2 rounded-lg transition-colors ${
                            entry?.status === 'late'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'
                          }`}
                          title="Late"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStatus(student.id, 'excused')}
                          className={`p-2 rounded-lg transition-colors ${
                            entry?.status === 'excused'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600'
                          }`}
                          title="Excused"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Attendance
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TakeAttendance;
