import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ForceChangePassword from './pages/ForceChangePassword';
import Layout from './components/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import UploadStudents from './pages/admin/UploadStudents';
import ClassEnrollment from './pages/admin/ClassEnrollment';
import CourseEnrollment from './pages/admin/CourseEnrollment';
import Students from './pages/admin/Students';
import StudentAttendance from './pages/admin/StudentAttendance';
import Faculty from './pages/admin/Faculty';
import FacultyAssignment from './pages/admin/FacultyAssignment';
import Departments from './pages/admin/Departments';
import Courses from './pages/admin/Courses';
import Sections from './pages/admin/Sections';
import RecycleBin from './pages/admin/RecycleBin';
import FacultyDashboard from './pages/faculty/Dashboard';
import TakeAttendance from './pages/faculty/TakeAttendance';
import ViewSessions from './pages/faculty/ViewSessions';
import StudentDashboard from './pages/student/Dashboard';

function App() {
  const { user, isLoading, mustChangePassword } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Force password change on first login
  if (mustChangePassword) {
    return (
      <Routes>
        <Route path="/change-password" element={<ForceChangePassword />} />
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Admin Routes */}
        {user.role === 'admin' && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<Students />} />
            <Route path="/admin/students/:studentId/attendance" element={<StudentAttendance />} />
            <Route path="/admin/faculty" element={<Faculty />} />
            <Route path="/admin/faculty-assignment" element={<FacultyAssignment />} />
            <Route path="/admin/departments" element={<Departments />} />
            <Route path="/admin/courses" element={<Courses />} />
            <Route path="/admin/course-enrollment" element={<CourseEnrollment />} />
            <Route path="/admin/sections" element={<Sections />} />
            <Route path="/admin/class-enrollment" element={<ClassEnrollment />} />
            <Route path="/admin/recycle-bin" element={<RecycleBin />} />
            <Route path="/admin/upload-students" element={<UploadStudents />} />
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </>
        )}

        {/* Faculty Routes */}
        {user.role === 'faculty' && (
          <>
            <Route path="/faculty" element={<FacultyDashboard />} />
            <Route path="/faculty/attendance/:facultyCourseId" element={<TakeAttendance />} />
            <Route path="/faculty/sessions/:facultyCourseId" element={<ViewSessions />} />
            <Route path="/" element={<Navigate to="/faculty" replace />} />
          </>
        )}

        {/* Student Routes */}
        {user.role === 'student' && (
          <>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/" element={<Navigate to="/student" replace />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
