import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit2, Trash2, BookOpen, Users } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  semester_number: number;
  department_id: string;
  department_name: string | null;
  department_code: string | null;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, [selectedDepartment]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedDepartment) params.department = selectedDepartment;
      
      const response = await api.get('/admin/courses', { params });
      setCourses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await api.delete(`/admin/courses/${id}`);
      fetchCourses();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete course');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Courses</h1>
          <p className="text-gray-500">Manage courses offered by the institute</p>
        </div>
        <button
          onClick={() => {
            setEditingCourse(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Department:</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="input-field w-48"
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
        <div className="card bg-purple-50 border-purple-200">
          <p className="text-2xl font-bold text-purple-700">{courses.length}</p>
          <p className="text-sm text-purple-600">Total Courses</p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-2xl font-bold text-blue-700">
            {courses.reduce((sum, c) => sum + c.credits, 0)}
          </p>
          <p className="text-sm text-blue-600">Total Credits</p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <p className="text-2xl font-bold text-green-700">{departments.length}</p>
          <p className="text-sm text-green-600">Departments</p>
        </div>
      </div>

      {/* Courses Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Course Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Department</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Semester</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Credits</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No courses found</p>
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono font-medium text-primary-600">
                      {course.code}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">
                      {course.name}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {course.department_code ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {course.department_code}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                        Sem {course.semester_number}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                        {course.credits} Credits
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/course-enrollment?course=${course.id}`}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Manage Enrollment"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setEditingCourse(course);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <CourseModal
          course={editingCourse}
          departments={departments}
          onClose={() => {
            setShowModal(false);
            setEditingCourse(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingCourse(null);
            fetchCourses();
          }}
        />
      )}
    </div>
  );
};

// Course Modal Component
const CourseModal: React.FC<{
  course: Course | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ course, departments, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: course?.name || '',
    code: course?.code || '',
    credits: course?.credits || 3,
    semesterNumber: course?.semester_number || 1,
    departmentId: course?.department_id || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (course) {
        await api.put(`/admin/courses/${course.id}`, formData);
      } else {
        await api.post('/admin/courses', formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {course ? 'Edit Course' : 'Add New Course'}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="input-field w-full"
                placeholder="CS101"
                disabled={!!course}
              />
              {course && (
                <p className="text-xs text-gray-500 mt-1">Course code cannot be changed</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field w-full"
                placeholder="Introduction to Programming"
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  required
                  value={formData.semesterNumber}
                  onChange={(e) => setFormData({ ...formData, semesterNumber: parseInt(e.target.value) })}
                  className="input-field w-full"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={10}
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : (course ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Courses;
