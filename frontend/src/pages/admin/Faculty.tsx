import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Search, Plus, Eye, Trash2, BookOpen, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';

interface Faculty {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  department_name: string | null;
  department_code: string | null;
}

const Faculty: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [selectedFacultyForCourses, setSelectedFacultyForCourses] = useState<Faculty | null>(null);
  const [facultyCourses, setFacultyCourses] = useState<any[]>([]);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
  }, [selectedDepartment]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const params: any = { role: 'faculty' };
      if (selectedDepartment) params.department = selectedDepartment;
      
      const response = await api.get('/admin/users', { params });
      setFaculty(response.data.data);
    } catch (error) {
      console.error('Failed to fetch faculty:', error);
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

  const handleToggleActive = async (facultyMember: Faculty) => {
    try {
      await api.put(`/admin/users/${facultyMember.id}`, {
        isActive: facultyMember.is_active ? 0 : 1
      });
      fetchFaculty();
    } catch (error) {
      console.error('Failed to update faculty:', error);
    }
  };

  const handleResetPassword = async (facultyId: string) => {
    try {
      await api.post(`/admin/users/${facultyId}/reset-password`, {
        newPassword: 'password123'
      });
      alert('Password reset to: password123');
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  const handleViewCourses = async (facultyMember: Faculty) => {
    try {
      const response = await api.get(`/admin/faculty-courses/${facultyMember.id}`);
      setFacultyCourses(response.data.data);
      setSelectedFacultyForCourses(facultyMember);
      setShowCoursesModal(true);
    } catch (error) {
      console.error('Failed to fetch faculty courses:', error);
    }
  };

  // Filter faculty based on search
  const filteredFaculty = faculty.filter(f => {
    const searchLower = searchTerm.toLowerCase();
    return (
      f.first_name.toLowerCase().includes(searchLower) ||
      f.last_name.toLowerCase().includes(searchLower) ||
      f.email.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredFaculty.length / itemsPerPage);
  const paginatedFaculty = filteredFaculty.slice(
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
          <h1 className="text-2xl font-bold text-gray-800">Faculty</h1>
          <p className="text-gray-500">Manage faculty members and their course assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/faculty-assignment"
            className="btn-secondary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Assign to Courses
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Faculty
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
              placeholder="Search by name or email..."
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-indigo-50 border-indigo-200">
          <p className="text-2xl font-bold text-indigo-700">{faculty.length}</p>
          <p className="text-sm text-indigo-600">Total Faculty</p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <p className="text-2xl font-bold text-green-700">{faculty.filter(f => f.is_active).length}</p>
          <p className="text-sm text-green-600">Active</p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <p className="text-2xl font-bold text-red-700">{faculty.filter(f => !f.is_active).length}</p>
          <p className="text-sm text-red-600">Inactive</p>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Department</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFaculty.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No faculty members found
                  </td>
                </tr>
              ) : (
                paginatedFaculty.map((f) => (
                  <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">
                      {f.first_name} {f.last_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{f.email}</td>
                    <td className="py-3 px-4 text-sm">
                      {f.department_code ? (
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                          {f.department_code}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{f.phone || '-'}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        f.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {f.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedFaculty(f)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewCourses(f)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title="View Courses"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(f)}
                          className={`p-1 rounded ${
                            f.is_active 
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={f.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {f.is_active ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleResetPassword(f.id)}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded text-xs"
                          title="Reset Password"
                        >
                          Reset
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredFaculty.length)} of {filteredFaculty.length}
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

      {/* Faculty Details Modal */}
      {selectedFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Faculty Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium">{selectedFaculty.first_name} {selectedFaculty.last_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedFaculty.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Department</label>
                  <p className="font-medium">{selectedFaculty.department_name || 'Not Assigned'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium">{selectedFaculty.phone || 'Not Provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className={`font-medium ${selectedFaculty.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedFaculty.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Joined</label>
                  <p className="font-medium">{new Date(selectedFaculty.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedFaculty(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Courses Modal */}
      {showCoursesModal && selectedFacultyForCourses && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Courses Assigned to {selectedFacultyForCourses.first_name} {selectedFacultyForCourses.last_name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">Manage course assignments for this faculty member</p>
              
              {facultyCourses.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No courses assigned</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {facultyCourses.map((fc: any) => (
                    <div key={fc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{fc.course_name}</p>
                        <p className="text-sm text-gray-500">{fc.course_code} • Section: {fc.section_name || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowCoursesModal(false);
                    setSelectedFacultyForCourses(null);
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

      {/* Add Faculty Modal */}
      {showModal && (
        <AddFacultyModal
          departments={departments}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchFaculty();
          }}
        />
      )}
    </div>
  );
};

// Add Faculty Modal Component
const AddFacultyModal: React.FC<{
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/admin/users', {
        ...formData,
        role: 'faculty'
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create faculty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Faculty</h3>
          
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
                placeholder="faculty@crrit.edu.in"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="input-field w-full"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
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
              {loading ? 'Adding...' : 'Add Faculty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Faculty;
