import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Search, Plus, Trash2, Eye, Upload, ChevronLeft, ChevronRight, ClipboardList, BookOpen, UserPlus, XCircle } from 'lucide-react';

interface Student {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  department_name: string | null;
  department_code: string | null;
  roll_number?: string;
  section_name?: string;
}

interface StudentCourse {
  course_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  faculty_name: string;
  faculty_email: string;
  total_sessions: number;
  present_count: number;
  total_attended: number;
  attendance_percentage: number;
}

interface StudentSection {
  section_id: string;
  roll_number: string;
  section_name: string;
  semester_number: number;
  year: number;
  department_name: string;
  department_code: string;
}

interface AvailableSection {
  id: string;
  name: string;
  semester_number: number;
  department_name: string;
  department_code: string;
  academic_year: string;
}

interface StudentEnrollment {
  id: string;
  roll_number: string;
  section_id: string;
  section_name: string;
  semester_number: number;
  department_name: string;
  department_code: string;
  academic_year: string;
  course_count: number;
}

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [selectedStudentForCourses, setSelectedStudentForCourses] = useState<Student | null>(null);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [studentSection, setStudentSection] = useState<StudentSection | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  
  // Enrollment states
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<Student | null>(null);
  const [availableSections, setAvailableSections] = useState<AvailableSection[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, [selectedDepartment]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = { role: 'student' };
      if (selectedDepartment) params.department = selectedDepartment;
      
      const response = await api.get('/admin/users', { params });
      setStudents(response.data.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/admin/departments');
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleViewCourses = async (student: Student) => {
    try {
      setLoadingCourses(true);
      setSelectedStudentForCourses(student);
      setShowCoursesModal(true);
      
      const response = await api.get(`/admin/students/${student.id}/courses`);
      setStudentCourses(response.data.data.courses || []);
      setStudentSection(response.data.data.section);
    } catch (error) {
      console.error('Failed to fetch student courses:', error);
      setStudentCourses([]);
      setStudentSection(null);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleToggleActive = async (student: Student) => {
    try {
      await api.put(`/admin/users/${student.id}`, {
        isActive: student.is_active ? 0 : 1
      });
      fetchStudents();
    } catch (error) {
      console.error('Failed to update student:', error);
    }
  };

  const handleResetPassword = async (studentId: string) => {
    try {
      await api.post(`/admin/users/${studentId}/reset-password`, {
        newPassword: 'password123'
      });
      alert('Password reset to: password123');
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${student.first_name} ${student.last_name}? This will also delete all their attendance records.`)) {
      return;
    }
    
    try {
      await api.delete(`/admin/users/${student.id}`);
      fetchStudents();
      alert('Student deleted successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete student');
    }
  };

  // Handle opening enrollment modal
  const handleOpenEnrollModal = async (student: Student) => {
    try {
      setLoadingEnrollments(true);
      setSelectedStudentForEnroll(student);
      setShowEnrollModal(true);
      
      // Fetch available sections and current enrollments
      const [sectionsRes, enrollmentsRes] = await Promise.all([
        api.get(`/admin/students/${student.id}/available-sections`),
        api.get(`/admin/students/${student.id}/enrollments`)
      ]);
      
      setAvailableSections(sectionsRes.data.data || []);
      setStudentEnrollments(enrollmentsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch enrollment data:', error);
      setAvailableSections([]);
      setStudentEnrollments([]);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Handle enrolling student in a section
  const handleEnrollStudent = async (sectionId: string, rollNumber: string) => {
    if (!selectedStudentForEnroll) return;
    
    try {
      await api.post(`/admin/students/${selectedStudentForEnroll.id}/enroll`, {
        sectionId,
        rollNumber
      });
      
      // Refresh data
      const [sectionsRes, enrollmentsRes] = await Promise.all([
        api.get(`/admin/students/${selectedStudentForEnroll.id}/available-sections`),
        api.get(`/admin/students/${selectedStudentForEnroll.id}/enrollments`)
      ]);
      
      setAvailableSections(sectionsRes.data.data || []);
      setStudentEnrollments(enrollmentsRes.data.data || []);
      fetchStudents(); // Refresh student list
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to enroll student');
    }
  };

  // Handle unenrolling student from a section
  const handleUnenrollStudent = async (sectionId: string) => {
    if (!selectedStudentForEnroll) return;
    
    if (!window.confirm('Are you sure you want to remove this enrollment?')) return;
    
    try {
      await api.delete(`/admin/students/${selectedStudentForEnroll.id}/enroll/${sectionId}`);
      
      // Refresh data
      const [sectionsRes, enrollmentsRes] = await Promise.all([
        api.get(`/admin/students/${selectedStudentForEnroll.id}/available-sections`),
        api.get(`/admin/students/${selectedStudentForEnroll.id}/enrollments`)
      ]);
      
      setAvailableSections(sectionsRes.data.data || []);
      setStudentEnrollments(enrollmentsRes.data.data || []);
      fetchStudents(); // Refresh student list
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to unenroll student');
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.first_name.toLowerCase().includes(searchLower) ||
      student.last_name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      (student.roll_number && student.roll_number.toLowerCase().includes(searchLower))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-gray-500">Manage all students in the system</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/upload-students" className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or roll number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field pl-10 w-full"
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field w-full md:w-48"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.code}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{students.length}</p>
          <p className="text-sm text-blue-600">Total Students</p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <p className="text-2xl font-bold text-green-700">{students.filter(s => s.is_active).length}</p>
          <p className="text-sm text-green-600">Active</p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <p className="text-2xl font-bold text-red-700">{students.filter(s => !s.is_active).length}</p>
          <p className="text-sm text-red-600">Inactive</p>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <p className="text-2xl font-bold text-purple-700">{departments.length}</p>
          <p className="text-sm text-purple-600">Departments</p>
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Roll No</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Department</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">
                      {student.roll_number || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{student.email}</td>
                    <td className="py-3 px-4 text-sm">
                      {student.department_code ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {student.department_code}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{student.phone || '-'}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        student.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewCourses(student)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="View Enrolled Courses"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEnrollModal(student)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Manage Enrollments"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/admin/students/${student.id}/attendance`}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title="View Attendance"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleActive(student)}
                          className={`p-1 rounded ${
                            student.is_active 
                              ? 'text-yellow-600 hover:bg-yellow-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={student.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {student.is_active ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleResetPassword(student.id)}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded text-xs"
                          title="Reset Password"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Student"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedStudent.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Department</label>
                  <p className="font-medium">{selectedStudent.department_name || 'Not Assigned'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium">{selectedStudent.phone || 'Not Provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className={`font-medium ${selectedStudent.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedStudent.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Joined</label>
                  <p className="font-medium">{new Date(selectedStudent.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrolled Courses Modal */}
      {showCoursesModal && selectedStudentForCourses && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Enrolled Courses - {selectedStudentForCourses.first_name} {selectedStudentForCourses.last_name}
              </h3>
              
              {studentSection && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-blue-700">
                      <strong>Roll No:</strong> {studentSection.roll_number}
                    </span>
                    <span className="text-blue-700">
                      <strong>Section:</strong> {studentSection.section_name}
                    </span>
                    <span className="text-blue-700">
                      <strong>Year:</strong> {studentSection.year}
                    </span>
                    <span className="text-blue-700">
                      <strong>Semester:</strong> {studentSection.semester_number}
                    </span>
                    <span className="text-blue-700">
                      <strong>Dept:</strong> {studentSection.department_code}
                    </span>
                  </div>
                </div>
              )}

              {loadingCourses ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
                </div>
              ) : studentCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No courses enrolled</p>
                  <p className="text-sm">This student is not assigned to any section with courses</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Course</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Faculty</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Credits</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Sessions</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentCourses.map((course) => (
                        <tr key={course.course_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-800">{course.course_code}</p>
                            <p className="text-sm text-gray-500">{course.course_name}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-800">{course.faculty_name}</p>
                            <p className="text-xs text-gray-500">{course.faculty_email}</p>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                              {course.credits}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4 text-sm text-gray-600">
                            {course.total_sessions}
                          </td>
                          <td className="text-center py-3 px-4">
                            {course.total_attended > 0 ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      course.attendance_percentage >= 75 ? 'bg-green-500' : 
                                      course.attendance_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${course.attendance_percentage}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-medium ${
                                  course.attendance_percentage >= 75 ? 'text-green-600' : 
                                  course.attendance_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {course.attendance_percentage}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        <strong>Total Courses:</strong> {studentCourses.length}
                      </span>
                      <span className="text-gray-600">
                        <strong>Total Credits:</strong> {studentCourses.reduce((sum, c) => sum + c.credits, 0)}
                      </span>
                      <span className="text-gray-600">
                        <strong>Avg Attendance:</strong>{' '}
                        {studentCourses.filter(c => c.total_attended > 0).length > 0
                          ? Math.round(
                              studentCourses
                                .filter(c => c.total_attended > 0)
                                .reduce((sum, c) => sum + c.attendance_percentage, 0) /
                              studentCourses.filter(c => c.total_attended > 0).length
                            )
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowCoursesModal(false);
                    setSelectedStudentForCourses(null);
                    setStudentCourses([]);
                    setStudentSection(null);
                  }}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showModal && (
        <AddStudentModal
          departments={departments}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchStudents();
          }}
        />
      )}

      {/* Enrollment Modal */}
      {showEnrollModal && selectedStudentForEnroll && (
        <EnrollmentModal
          student={selectedStudentForEnroll}
          availableSections={availableSections}
          enrollments={studentEnrollments}
          loading={loadingEnrollments}
          onEnroll={handleEnrollStudent}
          onUnenroll={handleUnenrollStudent}
          onClose={() => {
            setShowEnrollModal(false);
            setSelectedStudentForEnroll(null);
            setAvailableSections([]);
            setStudentEnrollments([]);
          }}
        />
      )}
    </div>
  );
};

// Add Student Modal Component
const AddStudentModal: React.FC<{
  departments: any[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ departments, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: 'password123',
    firstName: '',
    lastName: '',
    phone: '',
    departmentId: '',
    rollNumber: '',
    sectionId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  // Fetch sections when department changes
  useEffect(() => {
    if (formData.departmentId) {
      fetchSections(formData.departmentId);
    } else {
      setSections([]);
      setFormData(prev => ({ ...prev, sectionId: '' }));
    }
  }, [formData.departmentId]);

  const fetchSections = async (deptId: string) => {
    try {
      setLoadingSections(true);
      const response = await api.get('/admin/sections', { params: { departmentId: deptId } });
      setSections(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
      setSections([]);
    } finally {
      setLoadingSections(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/admin/users', {
        ...formData,
        role: 'student'
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Student</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input-field w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field w-full"
                placeholder="student@crrit.edu.in"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value.toUpperCase() })}
                className="input-field w-full"
                placeholder="e.g., 21CS1A0101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, sectionId: '' })}
                className="input-field w-full"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.sectionId}
                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                className="input-field w-full"
                disabled={!formData.departmentId || loadingSections}
              >
                <option value="">{loadingSections ? 'Loading...' : 'Select Section'}</option>
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>{sec.name} (Sem {sec.semester_number})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field w-full"
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Default: password123</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Students;

// Enrollment Modal Component
const EnrollmentModal: React.FC<{
  student: Student;
  availableSections: AvailableSection[];
  enrollments: StudentEnrollment[];
  loading: boolean;
  onEnroll: (sectionId: string, rollNumber: string) => void;
  onUnenroll: (sectionId: string) => void;
  onClose: () => void;
}> = ({ student, availableSections, enrollments, loading, onEnroll, onUnenroll, onClose }) => {
  const [selectedSection, setSelectedSection] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!selectedSection || !rollNumber.trim()) {
      alert('Please select a section and enter a roll number');
      return;
    }
    
    setEnrolling(true);
    await onEnroll(selectedSection, rollNumber.trim());
    setEnrolling(false);
    setSelectedSection('');
    setRollNumber('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Manage Enrollments - {student.first_name} {student.last_name}
          </h3>
          <p className="text-sm text-gray-500 mb-4">{student.email}</p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Enrollments */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Current Enrollments</h4>
                {enrollments.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <UserPlus className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Not enrolled in any section</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-blue-800">
                              {enrollment.department_code} - {enrollment.section_name}
                            </p>
                            <p className="text-sm text-blue-600">
                              Sem {enrollment.semester_number} | Roll: {enrollment.roll_number}
                            </p>
                            <p className="text-xs text-blue-500">
                              {enrollment.academic_year} | {enrollment.course_count} courses
                            </p>
                          </div>
                          <button
                            onClick={() => onUnenroll(enrollment.section_id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Remove Enrollment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enroll in New Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Enroll in New Section</h4>
                {availableSections.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">No available sections</p>
                    <p className="text-xs text-gray-400 mt-1">All sections are already enrolled or none exist</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Section
                      </label>
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="input-field w-full"
                      >
                        <option value="">-- Select a Section --</option>
                        {availableSections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.department_code} - {section.name} (Sem {section.semester_number}) - {section.academic_year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Roll Number in Section
                      </label>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder="e.g., 21CS101"
                        className="input-field w-full"
                      />
                    </div>
                    <button
                      onClick={handleEnroll}
                      disabled={!selectedSection || !rollNumber.trim() || enrolling}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {enrolling ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Enroll Student
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
