import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AttendanceSession } from '../../types';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, Clock, Trash2, Eye, Download, AlertTriangle, Edit2, Save, X } from 'lucide-react';

const ViewSessions: React.FC = () => {
  const { facultyCourseId } = useParams<{ facultyCourseId: string }>();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionRecords, setSessionRecords] = useState<any[]>([]);
  const [lowAttendance, setLowAttendance] = useState<any[]>([]);
  const [showLowAttendance, setShowLowAttendance] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editedRecords, setEditedRecords] = useState<Record<string, string>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, [facultyCourseId]);

  const fetchData = async () => {
    try {
      // Fetch course info
      const coursesRes = await api.get('/attendance/my-courses');
      const course = coursesRes.data.data.find((c: any) => c.faculty_course_id === facultyCourseId);
      setCourseInfo(course);

      // Fetch sessions
      const sessionsRes = await api.get(`/attendance/sessions/${facultyCourseId}`);
      setSessions(sessionsRes.data.data);

      // Fetch low attendance students
      const lowRes = await api.get(`/reports/low-attendance/${facultyCourseId}?threshold=75`);
      setLowAttendance(lowRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const viewSessionRecords = async (sessionId: string) => {
    try {
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setSessionRecords([]);
        return;
      }
      
      const response = await api.get(`/attendance/records/${sessionId}`);
      setSessionRecords(response.data.data);
      setSelectedSession(sessionId);
    } catch (error) {
      toast.error('Failed to load records');
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/attendance/sessions/${sessionId}`);
      toast.success('Session deleted');
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  const startEditingSession = async (sessionId: string) => {
    try {
      // First load the records if not already loaded
      let records = sessionRecords;
      if (selectedSession !== sessionId) {
        const response = await api.get(`/attendance/records/${sessionId}`);
        records = response.data.data;
        setSessionRecords(records);
        setSelectedSession(sessionId);
      }
      
      // Initialize edited records with current statuses
      const initialEdits: Record<string, string> = {};
      records.forEach((record: any) => {
        initialEdits[record.id] = record.status;
      });
      setEditedRecords(initialEdits);
      setEditingSession(sessionId);
    } catch (error) {
      toast.error('Failed to load records for editing');
    }
  };

  const cancelEditing = () => {
    setEditingSession(null);
    setEditedRecords({});
  };

  const handleStatusChange = (recordId: string, newStatus: string) => {
    setEditedRecords(prev => ({
      ...prev,
      [recordId]: newStatus
    }));
  };

  const saveEditedAttendance = async () => {
    setSavingEdit(true);
    try {
      // Find records that have changed
      const changedRecords = sessionRecords.filter(record => 
        editedRecords[record.id] && editedRecords[record.id] !== record.status
      );

      if (changedRecords.length === 0) {
        toast.success('No changes to save');
        cancelEditing();
        return;
      }

      // Update each changed record
      await Promise.all(
        changedRecords.map(record =>
          api.put(`/attendance/records/${record.id}`, {
            status: editedRecords[record.id]
          })
        )
      );

      toast.success(`Updated ${changedRecords.length} record(s)`);
      
      // Refresh the records and session data
      const response = await api.get(`/attendance/records/${editingSession}`);
      setSessionRecords(response.data.data);
      
      // Refresh sessions to update counts
      const sessionsRes = await api.get(`/attendance/sessions/${facultyCourseId}`);
      setSessions(sessionsRes.data.data);
      
      cancelEditing();
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setSavingEdit(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await api.get(`/reports/export/${facultyCourseId}`);
      const data = response.data.data;
      
      // Build CSV
      const headers = ['Roll Number', 'Name', ...data.sessions.map((s: any) => `${s.date}_P${s.period}`), 'Total', 'Present', 'Percentage'];
      const rows = data.students.map((student: any) => {
        const sessionCols = data.sessions.map((s: any) => student[`${s.date}_P${s.period}`] || '-');
        return [student.roll_number, student.name, ...sessionCols, student.total_classes, student.present, student.percentage + '%'];
      });

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${courseInfo?.course_code}_${courseInfo?.section_name}_attendance.csv`;
      a.click();
      
      toast.success('Attendance exported to CSV');
    } catch (error) {
      toast.error('Failed to export attendance');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/faculty')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Attendance Records</h1>
            {courseInfo && (
              <p className="text-gray-500">
                {courseInfo.course_code} - {courseInfo.course_name} • {courseInfo.section_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLowAttendance(!showLowAttendance)}
            className={`btn-secondary flex items-center gap-2 ${showLowAttendance ? 'bg-red-100' : ''}`}
          >
            <AlertTriangle className="w-4 h-4" />
            Low Attendance ({lowAttendance.length})
          </button>
          <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Low Attendance Alert */}
      {showLowAttendance && lowAttendance.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Students Below 75% Attendance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowAttendance.map((student) => (
              <div key={student.student_id} className="bg-white p-3 rounded-lg border border-red-100">
                <p className="font-medium text-gray-800">{student.roll_number}</p>
                <p className="text-sm text-gray-600">{student.first_name} {student.last_name}</p>
                <p className="text-sm text-red-600 font-medium">{student.percentage}% ({student.attended}/{student.total_classes})</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">All Sessions ({sessions.length})</h2>
        
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No attendance sessions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-800">
                        {new Date(session.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {session.period_number && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Period {session.period_number}</span>
                      </div>
                    )}
                    {session.topic && (
                      <span className="text-gray-500 text-sm">• {session.topic}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-600">P: {session.present_count}</span>
                      <span className="text-red-600">A: {session.absent_count}</span>
                      {session.late_count > 0 && <span className="text-yellow-600">L: {session.late_count}</span>}
                      <span className="text-gray-500">
                        ({session.total_count > 0 ? Math.round((session.present_count / session.total_count) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => viewSessionRecords(session.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => startEditingSession(session.id)}
                        className="p-2 hover:bg-blue-100 rounded-lg"
                        title="Edit Attendance"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-2 hover:bg-red-100 rounded-lg"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Session Records (Expanded) */}
                {selectedSession === session.id && sessionRecords.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    {/* Edit Mode Controls */}
                    {editingSession === session.id && (
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Edit2 className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-600">Editing Attendance</span>
                          <span className="text-xs text-gray-500">Click on a status to change it</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={cancelEditing}
                            className="btn-secondary py-1 px-3 text-sm flex items-center gap-1"
                            disabled={savingEdit}
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                          <button
                            onClick={saveEditedAttendance}
                            className="btn-primary py-1 px-3 text-sm flex items-center gap-1"
                            disabled={savingEdit}
                          >
                            <Save className="w-4 h-4" />
                            {savingEdit ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {sessionRecords.map((record) => {
                        const currentStatus = editingSession === session.id 
                          ? (editedRecords[record.id] || record.status)
                          : record.status;
                        
                        const isEditing = editingSession === session.id;
                        const hasChanged = isEditing && editedRecords[record.id] && editedRecords[record.id] !== record.status;
                        
                        return (
                          <div
                            key={record.id}
                            className={`p-2 rounded-lg text-center text-sm transition-all ${
                              currentStatus === 'present'
                                ? 'bg-green-100 text-green-800'
                                : currentStatus === 'absent'
                                ? 'bg-red-100 text-red-800'
                                : currentStatus === 'late'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            } ${isEditing ? 'cursor-pointer hover:ring-2 hover:ring-primary-400' : ''} ${hasChanged ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => {
                              if (isEditing) {
                                // Cycle through statuses: present -> absent -> late -> excused -> present
                                const statuses = ['present', 'absent', 'late', 'excused'];
                                const currentIndex = statuses.indexOf(currentStatus);
                                const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                                handleStatusChange(record.id, nextStatus);
                              }
                            }}
                          >
                            <p className="font-mono text-xs">{record.roll_number}</p>
                            <p className="capitalize font-medium">{currentStatus}</p>
                            {hasChanged && (
                              <p className="text-xs opacity-70">(was: {record.status})</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Legend for edit mode */}
                    {editingSession === session.id && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Click to cycle through statuses:</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Present</span>
                          <span className="text-gray-400">→</span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Absent</span>
                          <span className="text-gray-400">→</span>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Late</span>
                          <span className="text-gray-400">→</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Excused</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-xs text-gray-500">(cycles back)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSessions;
