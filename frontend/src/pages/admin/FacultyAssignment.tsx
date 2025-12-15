import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Plus, Trash2, Search, BookOpen, Users, GraduationCap, Building2 } from 'lucide-react';

interface FacultyAssignment {
  id: string;
  faculty_id: string;
  course_id: string;
  section_id: string;
  semester_id: string;
  course_code: string;
  course_name: string;
  section_name: string;
  semester_number: number;
  department_code: string;
  department_name: string;
  faculty_name: string;
  faculty_email: string;
}

interface Faculty {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_name: string | null;
}

interface Course {
  id: string;
  name: string;
  code: string;
  department_id: string;
}

interface Section {
  id: string;
  name: string;
  department_id: string;
  semester_number: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const FacultyAssignment: React.FC = () => {
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchAssignments();
    fetchDepartments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/faculty-courses');
      setAssignments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/admin/departments');
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      await api.delete(`/admin/faculty-courses/${assignmentId}`);
      fetchAssignments();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove assignment');
    }
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = searchTerm === '' || 
      a.faculty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.section_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDepartment === '' || a.department_code === selectedDepartment;
    
    return matchesSearch && matchesDept;
  });

  // Group by department
  const groupedByDepartment = filteredAssignments.reduce((acc, a) => {
    const key = a.department_code;
    if (!acc[key]) {
      acc[key] = {
        department_name: a.department_name,
        department_code: a.department_code,
        assignments: []
      };
    }
    acc[key].assignments.push(a);
    return acc;
  }, {} as Record<string, { department_name: string; department_code: string; assignments: FacultyAssignment[] }>);

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
        <div className="flex items-center gap-4">
          <Link to="/admin/faculty" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Faculty Course Assignments</h1>
            <p className="text-gray-500">Assign faculty members to courses and sections</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Assign Faculty
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by faculty, course, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
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
        <div className="card bg-indigo-50 border-indigo-200">
          <p className="text-2xl font-bold text-indigo-700">{assignments.length}</p>
          <p className="text-sm text-indigo-600">Total Assignments</p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <p className="text-2xl font-bold text-green-700">
            {new Set(assignments.map(a => a.faculty_id)).size}
          </p>
          <p className="text-sm text-green-600">Faculty Assigned</p>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <p className="text-2xl font-bold text-purple-700">
            {new Set(assignments.map(a => a.course_id)).size}
          </p>
          <p className="text-sm text-purple-600">Courses Covered</p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-2xl font-bold text-blue-700">
            {new Set(assignments.map(a => a.section_id)).size}
          </p>
          <p className="text-sm text-blue-600">Sections Covered</p>
        </div>
      </div>

      {/* Assignments by Department */}
      {Object.keys(groupedByDepartment).length === 0 ? (
        <div className="card text-center py-12">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Assignments Yet</h3>
          <p className="text-gray-500 mb-4">Start by assigning faculty to courses and sections</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Assign Faculty
          </button>
        </div>
      ) : (
        Object.values(groupedByDepartment).map(group => (
          <div key={group.department_code} className="card">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                {group.department_name}
              </h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                {group.department_code}
              </span>
              <span className="ml-auto text-sm text-gray-500">
                {group.assignments.length} assignment{group.assignments.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Faculty</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Course</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Section</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Semester</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.assignments.map(a => (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{a.faculty_name}</p>
                          <p className="text-xs text-gray-500">{a.faculty_email}</p>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{a.course_name}</p>
                          <p className="text-xs text-gray-500 font-mono">{a.course_code}</p>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {a.section_name}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                          Sem {a.semester_number}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/course-enrollment?fc=${a.id}`}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Manage Students"
                          >
                            <Users className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleRemoveAssignment(a.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Remove Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Add Assignment Modal */}
      {showAddModal && (
        <AddAssignmentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchAssignments();
          }}
        />
      )}
    </div>
  );
};

// Add Assignment Modal
const AddAssignmentModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchFaculty();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchCourses(selectedDepartment);
      fetchSections(selectedDepartment);
    } else {
      setCourses([]);
      setSections([]);
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/admin/departments');
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await api.get('/admin/users', { params: { role: 'faculty' } });
      setFaculty(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch faculty:', error);
    }
  };

  const fetchCourses = async (deptCode: string) => {
    try {
      const response = await api.get('/admin/courses', { params: { department: deptCode } });
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchSections = async (deptCode: string) => {
    try {
      const response = await api.get('/admin/sections', { params: { department: deptCode } });
      setSections(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/admin/faculty-courses', {
        facultyId: selectedFaculty,
        courseId: selectedCourse,
        sectionId: selectedSection
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign faculty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign Faculty to Course</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Faculty Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="w-4 h-4 inline mr-1" />
                Select Faculty
              </label>
              <select
                required
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Choose a faculty member...</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.first_name} {f.last_name} - {f.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 className="w-4 h-4 inline mr-1" />
                Select Department
              </label>
              <select
                required
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setSelectedCourse('');
                  setSelectedSection('');
                }}
                className="input-field w-full"
              >
                <option value="">Choose a department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {/* Course Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Select Course
              </label>
              <select
                required
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="input-field w-full"
                disabled={!selectedDepartment}
              >
                <option value="">
                  {selectedDepartment ? 'Choose a course...' : 'Select department first'}
                </option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
              {selectedDepartment && courses.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No courses found for this department</p>
              )}
            </div>

            {/* Section Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <GraduationCap className="w-4 h-4 inline mr-1" />
                Select Section
              </label>
              <select
                required
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="input-field w-full"
                disabled={!selectedDepartment}
              >
                <option value="">
                  {selectedDepartment ? 'Choose a section...' : 'Select department first'}
                </option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Semester {s.semester_number})
                  </option>
                ))}
              </select>
              {selectedDepartment && sections.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No sections found for this department</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !selectedFaculty || !selectedCourse || !selectedSection} 
              className="btn-primary"
            >
              {loading ? 'Assigning...' : 'Assign Faculty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacultyAssignment;
