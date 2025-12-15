import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { DashboardStats } from '../../types';
import { Users, GraduationCap, BookOpen, Calendar, Upload, Building2, Layers, Clock, CheckCircle, XCircle, TrendingUp, Activity, UserCheck } from 'lucide-react';

interface TodaySession {
  id: string;
  date: string;
  period_number: number;
  course_code: string;
  course_name: string;
  section_name: string;
  department_code: string;
  faculty_name: string;
  present: number;
  absent: number;
  total: number;
  created_at: string;
}

interface TodaySummary {
  totalSessions: number;
  totalPresent: number;
  totalAbsent: number;
  totalRecords: number;
  activeFaculty: number;
  activeSections: number;
  attendanceRate: number;
}

interface PeriodBreakdown {
  period_number: number;
  session_count: number;
  present: number;
  total: number;
}

interface DepartmentActivity {
  department_code: string;
  department_name: string;
  session_count: number;
  present: number;
  total: number;
}

interface TodayData {
  sessions: TodaySession[];
  summary: TodaySummary;
  periodBreakdown: PeriodBreakdown[];
  departmentActivity: DepartmentActivity[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'recent'>('today');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data.data.stats);
      setRecentSessions(response.data.data.recentSessions);
      setTodayData(response.data.data.today);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
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

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'bg-blue-500', link: '/admin/students' },
    { label: 'Total Faculty', value: stats?.totalFaculty || 0, icon: GraduationCap, color: 'bg-green-500', link: '/admin/faculty' },
    { label: 'Departments', value: stats?.totalDepartments || 0, icon: Building2, color: 'bg-purple-500', link: '/admin/departments' },
    { label: 'Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: 'bg-orange-500', link: '/admin/courses' },
    { label: 'Sections', value: stats?.totalSections || 0, icon: Layers, color: 'bg-pink-500', link: '/admin/sections' },
    { label: "Today's Sessions", value: stats?.todaysSessions || 0, icon: Calendar, color: 'bg-teal-500' },
  ];

  const quickActions = [
    { label: 'View Students', description: 'Manage student records', icon: Users, link: '/admin/students', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
    { label: 'View Faculty', description: 'Manage faculty members', icon: GraduationCap, link: '/admin/faculty', color: 'bg-green-50 text-green-600 hover:bg-green-100' },
    { label: 'Departments', description: 'Manage departments', icon: Building2, link: '/admin/departments', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
    { label: 'Courses', description: 'Manage courses', icon: BookOpen, link: '/admin/courses', color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
    { label: 'Sections', description: 'Manage sections', icon: Layers, link: '/admin/sections', color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
    { label: 'Bulk Upload', description: 'Upload students from file', icon: Upload, link: '/admin/upload-students', color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
  ];

  const currentDate = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome to CR Rao Institute of Technology Attendance System</p>
        </div>
        <Link
          to="/admin/upload-students"
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload Students
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const CardContent = (
            <div className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
          
          return stat.link ? (
            <Link key={stat.label} to={stat.link}>
              {CardContent}
            </Link>
          ) : (
            <div key={stat.label}>{CardContent}</div>
          );
        })}
      </div>

      {/* Today's Overview Section */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Today's Overview</h2>
              <p className="text-sm text-gray-500">{currentDate}</p>
            </div>
          </div>
          {todayData && todayData.summary.totalSessions > 0 && (
            <div className="text-right">
              <p className="text-3xl font-bold text-primary-600">{todayData.summary.attendanceRate}%</p>
              <p className="text-sm text-gray-500">Overall Attendance</p>
            </div>
          )}
        </div>

        {todayData && todayData.summary.totalSessions > 0 ? (
          <>
            {/* Today's Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-500">Sessions</span>
                </div>
                <p className="text-xl font-bold text-gray-800">{todayData.summary.totalSessions}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-500">Present</span>
                </div>
                <p className="text-xl font-bold text-green-600">{todayData.summary.totalPresent}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-gray-500">Absent</span>
                </div>
                <p className="text-xl font-bold text-red-600">{todayData.summary.totalAbsent}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-gray-500">Total Records</span>
                </div>
                <p className="text-xl font-bold text-gray-800">{todayData.summary.totalRecords}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-4 h-4 text-teal-500" />
                  <span className="text-xs text-gray-500">Active Faculty</span>
                </div>
                <p className="text-xl font-bold text-gray-800">{todayData.summary.activeFaculty}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-gray-500">Active Sections</span>
                </div>
                <p className="text-xl font-bold text-gray-800">{todayData.summary.activeSections}</p>
              </div>
            </div>

            {/* Period-wise Breakdown & Department Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Period-wise Breakdown */}
              {todayData.periodBreakdown.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary-600" />
                    Period-wise Attendance
                  </h3>
                  <div className="space-y-2">
                    {todayData.periodBreakdown.map((period) => {
                      const percentage = period.total > 0 ? Math.round((period.present / period.total) * 100) : 0;
                      return (
                        <div key={period.period_number} className="flex items-center gap-3">
                          <span className="w-16 text-sm font-medium text-gray-600">Period {period.period_number}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${percentage >= 75 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-12 text-sm text-right font-medium">{percentage}%</span>
                          <span className="w-16 text-xs text-gray-500 text-right">{period.present}/{period.total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Department Activity */}
              {todayData.departmentActivity.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-600" />
                    Department Activity
                  </h3>
                  <div className="space-y-2">
                    {todayData.departmentActivity.map((dept) => {
                      const percentage = dept.total > 0 ? Math.round((dept.present / dept.total) * 100) : 0;
                      return (
                        <div key={dept.department_code} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <span className="font-medium text-gray-800">{dept.department_code}</span>
                            <span className="text-gray-400 mx-2">•</span>
                            <span className="text-sm text-gray-500">{dept.session_count} sessions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {percentage}%
                            </span>
                            <span className="text-xs text-gray-400">({dept.present}/{dept.total})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No attendance sessions recorded today</p>
            <p className="text-sm text-gray-400 mt-1">Sessions will appear here as faculty mark attendance</p>
          </div>
        )}
      </div>

      {/* Today's Sessions Table */}
      {todayData && todayData.sessions.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Today's Sessions</h2>
            <span className="text-sm text-gray-500">{todayData.sessions.length} sessions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Period</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Course</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Section</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Faculty</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Present</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Absent</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rate</th>
                </tr>
              </thead>
              <tbody>
                {todayData.sessions.map((session) => {
                  const percentage = session.total > 0 ? Math.round((session.present / session.total) * 100) : 0;
                  return (
                    <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 rounded-full font-medium text-sm">
                          {session.period_number || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="font-medium text-gray-800">{session.course_code}</span>
                        <p className="text-xs text-gray-500">{session.course_name}</p>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="text-gray-800">{session.section_name}</span>
                        <span className="text-gray-400 ml-1 text-xs">({session.department_code})</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{session.faculty_name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          {session.present}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                          <XCircle className="w-4 h-4" />
                          {session.absent}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          percentage >= 75 ? 'bg-green-100 text-green-800' :
                          percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.link}
                className={`p-4 rounded-xl text-center transition-all ${action.color}`}
              >
                <Icon className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs opacity-75 mt-1">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions - Tabs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Attendance Sessions</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${activeTab === 'today' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Today
            </button>
            <button 
              onClick={() => setActiveTab('recent')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${activeTab === 'recent' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All Recent
            </button>
          </div>
        </div>
        
        {activeTab === 'today' && todayData?.sessions.length === 0 && (
          <p className="text-gray-500">No attendance sessions recorded today.</p>
        )}
        
        {activeTab === 'recent' && recentSessions.length === 0 ? (
          <p className="text-gray-500">No attendance sessions recorded yet.</p>
        ) : activeTab === 'recent' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Course</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Section</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Faculty</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {new Date(session.date).toLocaleDateString('en-IN')}
                      {session.period_number && <span className="text-gray-500 ml-1">(P{session.period_number})</span>}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="font-medium text-gray-800">{session.course_code}</span>
                      <span className="text-gray-500 ml-1">- {session.course_name}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{session.section_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{session.faculty_name}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="text-green-600 font-medium">{session.present}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-gray-600">{session.total}</span>
                      <span className="text-gray-400 ml-2">
                        ({session.total > 0 ? Math.round((session.present / session.total) * 100) : 0}%)
                      </span>
                    </td>
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

export default AdminDashboard;
