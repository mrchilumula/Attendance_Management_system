import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, UserPlus, Trash2, Search, BookOpen, GraduationCap, Plus, X } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  name: string;
  semester_number: number;
  credits: number;
  department_code: string;
  department_name: string;
  section_count: number;
}

interface FacultyCourse {
  id: string;
  faculty_id: string;
  course_id: string;
  section_id: string;
  course_code: string;
  course_name: string;
  section_name: string;
  semester_number: number;
  department_code: string;
  department_name: string;
  faculty_name: string;
  faculty_email?: string;
}

interface Section {
  id: string;
  name: string;
  semester_number: number;
  department_code: string;
  department_name: string;
}

interface Faculty {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  department_code: string;
  department_name: string;
}

interface Student {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roll_number: string;
  department_code: string;
}

const CourseEnrollment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [facultyCourses, setFacultyCourses] = useState<FacultyCourse[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedFacultyCourse, setSelectedFacultyCourse] = useState<FacultyCourse | null>(null);
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignSectionId, setAssignSectionId] = useState('');
  const [assignFacultyId, setAssignFacultyId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const courseId = searchParams.get('course');
    if (courseId && courses.length > 0) {
      setSelectedCourse(courseId);
    }
  }, [searchParams, courses]);

  useEffect(() => {
    if (selectedFacultyCourse) {
      fetchCourseStudents(selectedFacultyCourse.id);
    }
  }, [selectedFacultyCourse]);

  const fetchInitialData = async () => {
    try {
      const [coursesRes, fcRes, sectionsRes, deptRes, facultyRes] = await Promise.all([
        api.get('/admin/courses-with-sections'),
        api.get('/admin/faculty-courses'),
        api.get('/admin/sections'),
        api.get('/admin/departments'),
        api.get('/admin/available-faculty'),
      ]);
      setCourses(coursesRes.data.data);
      setFacultyCourses(fcRes.data.data);
      setSections(sectionsRes.data.data);
      setDepartments(deptRes.data.data);
      setFaculty(facultyRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStudents = async (fcId: string) => {
    setLoadingStudents(true);
    try {
      const response = await api.get(`/admin/faculty-courses/${fcId}/students`);
      setCourseStudents(response.data.data.students);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredCourses = courses.filter(
    (c) => !selectedDepartment || c.department_code === selectedDepartment
  );

  const courseFacultyAssignments = facultyCourses.filter(
    (fc) => fc.course_id === selectedCourse
  );

  const filteredStudents = courseStudents.filter((s) => {
    const search = searchTerm.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(search) ||
      s.last_name.toLowerCase().includes(search) ||
      s.roll_number.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search)
    );
  });

  const handleAssignFaculty = async () => {
    if (!assignCourseId || !assignSectionId || !assignFacultyId) {
      toast.error('Please fill all fields');
      return;
    }

    setAssigning(true);
    try {
      await api.post('/admin/faculty-courses', {
        facultyId: assignFacultyId,
        courseId: assignCourseId,
        sectionId: assignSectionId,
      });
      toast.success('Faculty assigned to course');
      setShowAssignModal(false);
      setAssignCourseId('');
      setAssignSectionId('');
      setAssignFacultyId('');
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign faculty');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (fcId: string) => {
    if (!confirm('Remove this faculty assignment?')) return;

    try {
      await api.delete(`/admin/faculty-courses/${fcId}`);
      toast.success('Assignment removed');
      if (selectedFacultyCourse?.id === fcId) {
        setSelectedFacultyCourse(null);
        setCourseStudents([]);
      }
      fetchInitialData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove assignment');
    }
  };

  // Get sections for selected course's department
  const getAvailableSections = () => {
    const course = courses.find((c) => c.id === assignCourseId);
    if (!course) return [];
    return sections.filter(
      (s) => s.department_code === course.department_code && s.semester_number === course.semester_number
    );
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
        <div className="flex items-center gap-4">
          <Link to="/admin/courses" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Course Enrollment</h1>
            <p className="text-gray-500">Manage faculty assignments and view enrolled students</p>
          </div>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Assign Faculty
        </button>
      </div>

      {/* Filter Section */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-orange-600" />
          Select Course
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedCourse('');
                setSelectedFacultyCourse(null);
              }}
              className="input-field"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedFacultyCourse(null);
              }}
              className="input-field"
            >
              <option value="">Select a course</option>
              {filteredCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name} (Sem {c.semester_number})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Faculty Assignments for Selected Course */}
      {selectedCourse && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-green-600" />
            Faculty Assignments
          </h2>

          {courseFacultyAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No faculty assigned to this course yet.</p>
              <button
                onClick={() => {
                  setAssignCourseId(selectedCourse);
                  setShowAssignModal(true);
                }}
                className="mt-2 text-blue-600 hover:underline"
              >
                Assign a faculty member
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courseFacultyAssignments.map((fc) => (
                <div
                  key={fc.id}
                  onClick={() => setSelectedFacultyCourse(fc)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedFacultyCourse?.id === fc.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{fc.section_name}</p>
                      <p className="text-sm text-gray-600">{fc.faculty_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {fc.department_code} • Sem {fc.semester_number}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAssignment(fc.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Students in Selected Course-Section */}
      {selectedFacultyCourse && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Students in {selectedFacultyCourse.course_code} - {selectedFacultyCourse.section_name}
            </h2>
            <div className="flex items-center gap-2">
              <Link
                to={`/admin/class-enrollment?section=${selectedFacultyCourse.section_id}`}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Manage Section Students
              </Link>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {loadingStudents ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No students enrolled in this section.</p>
              <Link
                to={`/admin/class-enrollment?section=${selectedFacultyCourse.section_id}`}
                className="mt-2 text-blue-600 hover:underline inline-block"
              >
                Add students to section
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">#</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Roll No</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{student.roll_number}</td>
                      <td className="py-3 px-4">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{student.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-gray-500">
                Total: {filteredStudents.length} students
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Faculty Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Assign Faculty to Course</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  value={assignCourseId}
                  onChange={(e) => {
                    setAssignCourseId(e.target.value);
                    setAssignSectionId('');
                  }}
                  className="input-field"
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name} ({c.department_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  value={assignSectionId}
                  onChange={(e) => setAssignSectionId(e.target.value)}
                  className="input-field"
                  disabled={!assignCourseId}
                >
                  <option value="">Select section</option>
                  {getAvailableSections().map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - Sem {s.semester_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
                <select
                  value={assignFacultyId}
                  onChange={(e) => setAssignFacultyId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select faculty</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.first_name} {f.last_name} ({f.department_code || 'No dept'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignFaculty}
                disabled={assigning}
                className="btn-primary"
              >
                {assigning ? 'Assigning...' : 'Assign Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollment;
