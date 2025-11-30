import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardList, 
  LogOut,
  GraduationCap,
  Menu,
  X,
  Building2,
  Layers,
  Upload,
  UserCheck,
  Trash2
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const getNavItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/admin/students', label: 'Students', icon: Users },
          { path: '/admin/faculty', label: 'Faculty', icon: UserCheck },
          { path: '/admin/departments', label: 'Departments', icon: Building2 },
          { path: '/admin/courses', label: 'Courses', icon: BookOpen },
          { path: '/admin/sections', label: 'Sections', icon: Layers },
          { path: '/admin/upload-students', label: 'Bulk Upload', icon: Upload },
          { path: '/admin/recycle-bin', label: 'Recycle Bin', icon: Trash2 },
        ];
      case 'faculty':
        return [
          { path: '/faculty', label: 'My Courses', icon: BookOpen },
        ];
      case 'student':
        return [
          { path: '/student', label: 'My Attendance', icon: ClipboardList },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-primary-800 text-white transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-10 h-10" />
            <div>
              <h1 className="font-bold text-lg leading-tight">CR Rao Institute</h1>
              <p className="text-primary-200 text-xs">Attendance System</p>
            </div>
          </div>
        </div>

        <nav className="mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-6 py-3 transition-colors
                  ${isActive 
                    ? 'bg-primary-900 border-r-4 border-white' 
                    : 'hover:bg-primary-700'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="border-t border-primary-700 pt-4 mb-4">
            <p className="text-sm text-primary-200">Logged in as</p>
            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-primary-300 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
