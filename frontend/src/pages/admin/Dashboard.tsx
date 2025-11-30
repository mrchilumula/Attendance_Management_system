import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { DashboardStats } from '../../types';
import { Users, GraduationCap, BookOpen, Calendar, Upload, Building2, Layers } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data.data.stats);
      setRecentSessions(response.data.data.recentSessions);
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

      {/* Recent Sessions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Attendance Sessions</h2>
        {recentSessions.length === 0 ? (
          <p className="text-gray-500">No attendance sessions recorded yet.</p>
        ) : (
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
