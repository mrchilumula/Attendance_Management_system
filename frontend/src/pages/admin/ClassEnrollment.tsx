import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, UserPlus, UserMinus, Search, CheckSquare, Square, BookOpen, Building2 } from 'lucide-react';

interface Section {
  id: string;
  name: string;
  semester_number: number;
  department_code: string;
  department_name: string;
  student_count?: number;
}

interface Student {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  roll_number?: string;
  department_code: string;
  department_name: string;
  current_section?: string;
  enrollment_id?: string;
}

interface FacultyCourse {
  id: string;
  course_code: string;
  course_name: string;
  section_name: string;
  section_id: string;
  department_code: string;
  faculty_name: string;
}

const ClassEnrollment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedToEnroll, setSelectedToEnroll] = useState<Set<string>>(new Set());
  const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set());
  const [rollNumbers, setRollNumbers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [searchEnrolled, setSearchEnrolled] = useState('');
  const [searchAvailable, setSearchAvailable] = useState('');
  const [activeTab, setActiveTab] = useState<'enrolled' | 'add'>('enrolled');
  const [facultyCourses, setFacultyCourses] = useState<FacultyCourse[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Pre-select section from URL
  useEffect(() => {
    const sectionId = searchParams.get('section');
    if (sectionId && sections.length > 0) {
      const section = sections.find(s => s.id === sectionId);
      if (section) {
        setSelectedDepartment(section.department_code);
        setSelectedSection(sectionId);
      }
    }
  }, [searchParams, sections]);

  useEffect(() => {
    if (selectedSection) {
      fetchSectionStudents();
      fetchAvailableStudents();
    }
  }, [selectedSection]);

  const fetchInitialData = async () => {
    try {
      const [sectionsRes, deptRes, coursesRes] = await Promise.all([
        api.get('/admin/sections'),
        api.get('/admin/departments'),
        api.get('/admin/faculty-courses'),
      ]);
      setSections(sectionsRes.data.data);
      setDepartments(deptRes.data.data);
      setFacultyCourses(coursesRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionStudents = async () => {
    try {
      const response = await api.get(`/admin/sections/${selectedSection}/students`);
      setEnrolledStudents(response.data.data);
    } catch (error) {
      toast.error('Failed to load enrolled students');
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const response = await api.get(`/admin/sections/${selectedSection}/available-students`);
      setAvailableStudents(response.data.data);
    } catch (error) {
      toast.error('Failed to load available students');
    }
  };

  const filteredSections = sections.filter(
    (s) => !selectedDepartment || s.department_code === selectedDepartment
  );

  const filteredEnrolled = enrolledStudents.filter((s) => {
    const search = searchEnrolled.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(search) ||
      s.last_name.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(search))
    );
  });

  const filteredAvailable = availableStudents.filter((s) => {
    const search = searchAvailable.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(search) ||
      s.last_name.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search)
    );
  });

  const toggleEnrollSelection = (id: string) => {
    const newSet = new Set(selectedToEnroll);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedToEnroll(newSet);
  };

  const toggleRemoveSelection = (id: string) => {
    const newSet = new Set(selectedToRemove);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedToRemove(newSet);
  };

  const selectAllToEnroll = () => {
    if (selectedToEnroll.size === filteredAvailable.length) {
      setSelectedToEnroll(new Set());
    } else {
      setSelectedToEnroll(new Set(filteredAvailable.map((s) => s.id)));
    }
  };

  const selectAllToRemove = () => {
    if (selectedToRemove.size === filteredEnrolled.length) {
      setSelectedToRemove(new Set());
    } else {
      setSelectedToRemove(new Set(filteredEnrolled.map((s) => s.id)));
    }
  };

  const handleBulkEnroll = async () => {
    if (selectedToEnroll.size === 0) {
      toast.error('Select students to enroll');
      return;
    }

    setEnrolling(true);
    try {
      const studentIds = Array.from(selectedToEnroll);
      const rollNumbersList = studentIds.map((id) => rollNumbers[id] || '');

      const response = await api.post(`/admin/sections/${selectedSection}/bulk-enroll`, {
        studentIds,
        rollNumbers: rollNumbersList,
      });

      toast.success(response.data.message);
      setSelectedToEnroll(new Set());
      setRollNumbers({});
      fetchSectionStudents();
      fetchAvailableStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to enroll students');
    } finally {
      setEnrolling(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedToRemove.size === 0) {
      toast.error('Select students to remove');
      return;
    }

    if (!confirm(`Remove ${selectedToRemove.size} students from this section?`)) {
      return;
    }

    setRemoving(true);
    try {
      await api.post(`/admin/sections/${selectedSection}/bulk-remove`, {
        studentIds: Array.from(selectedToRemove),
      });

      toast.success(`Removed ${selectedToRemove.size} students`);
      setSelectedToRemove(new Set());
      fetchSectionStudents();
      fetchAvailableStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove students');
    } finally {
      setRemoving(false);
    }
  };

  const selectedSectionInfo = sections.find((s) => s.id === selectedSection);
  const sectionCourses = facultyCourses.filter((c) => c.section_id === selectedSection);

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
          <Link to="/admin/sections" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Class Enrollment</h1>
            <p className="text-gray-500">Bulk add or remove students from sections</p>
          </div>
        </div>
      </div>

      {/* Section Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-600" />
          Select Section
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedSection('');
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="input-field"
            >
              <option value="">Select a section</option>
              {filteredSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - Sem {s.semester_number} ({s.department_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSectionInfo && sectionCourses.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Courses in this section:
            </h3>
            <div className="flex flex-wrap gap-2">
              {sectionCourses.map((c) => (
                <span key={c.id} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {c.course_code} - {c.course_name} ({c.faculty_name})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedSection && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'enrolled'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Enrolled Students ({enrolledStudents.length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'add'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Add Students ({availableStudents.length} available)
            </button>
          </div>

          {/* Enrolled Students Tab */}
          {activeTab === 'enrolled' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search enrolled students..."
                    value={searchEnrolled}
                    onChange={(e) => setSearchEnrolled(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {selectedToRemove.size > 0 && (
                    <button
                      onClick={handleBulkRemove}
                      disabled={removing}
                      className="btn-danger flex items-center gap-2"
                    >
                      <UserMinus className="w-4 h-4" />
                      {removing ? 'Removing...' : `Remove ${selectedToRemove.size} Students`}
                    </button>
                  )}
                </div>
              </div>

              {filteredEnrolled.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No students enrolled in this section
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4">
                          <button onClick={selectAllToRemove} className="flex items-center gap-2">
                            {selectedToRemove.size === filteredEnrolled.length ? (
                              <CheckSquare className="w-5 h-5 text-red-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Roll No</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEnrolled.map((student) => (
                        <tr
                          key={student.id}
                          className={`border-b hover:bg-gray-50 ${
                            selectedToRemove.has(student.id) ? 'bg-red-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <button onClick={() => toggleRemoveSelection(student.id)}>
                              {selectedToRemove.has(student.id) ? (
                                <CheckSquare className="w-5 h-5 text-red-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 font-medium">{student.roll_number || '-'}</td>
                          <td className="py-3 px-4">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{student.email}</td>
                          <td className="py-3 px-4 text-gray-600">{student.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add Students Tab */}
          {activeTab === 'add' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search available students..."
                    value={searchAvailable}
                    onChange={(e) => setSearchAvailable(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {selectedToEnroll.size > 0 && (
                    <button
                      onClick={handleBulkEnroll}
                      disabled={enrolling}
                      className="btn-primary flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      {enrolling ? 'Enrolling...' : `Enroll ${selectedToEnroll.size} Students`}
                    </button>
                  )}
                </div>
              </div>

              {filteredAvailable.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No available students from this department to enroll
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4">
                          <button onClick={selectAllToEnroll} className="flex items-center gap-2">
                            {selectedToEnroll.size === filteredAvailable.length ? (
                              <CheckSquare className="w-5 h-5 text-green-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Current Section</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Roll Number (Optional)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAvailable.map((student) => (
                        <tr
                          key={student.id}
                          className={`border-b hover:bg-gray-50 ${
                            selectedToEnroll.has(student.id) ? 'bg-green-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <button onClick={() => toggleEnrollSelection(student.id)}>
                              {selectedToEnroll.has(student.id) ? (
                                <CheckSquare className="w-5 h-5 text-green-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{student.email}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {student.current_section || (
                              <span className="text-yellow-600">Not enrolled</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {selectedToEnroll.has(student.id) && (
                              <input
                                type="text"
                                placeholder="Enter roll number"
                                value={rollNumbers[student.id] || ''}
                                onChange={(e) =>
                                  setRollNumbers({ ...rollNumbers, [student.id]: e.target.value })
                                }
                                className="input-field py-1 px-2 text-sm w-40"
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClassEnrollment;
