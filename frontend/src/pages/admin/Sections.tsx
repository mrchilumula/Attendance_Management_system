import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Users, Building2 } from 'lucide-react';

interface Section {
  id: string;
  name: string;
  semester_number: number;
  department_id: string;
  department_name: string | null;
  department_code: string | null;
  academic_year_name: string;
  student_count: number;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const Sections: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    fetchSections();
    fetchDepartments();
  }, [selectedDepartment, selectedYear]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedYear) params.year = selectedYear;
      
      const response = await api.get('/admin/sections', { params });
      setSections(response.data.data);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
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
    if (!confirm('Are you sure you want to delete this section?')) return;
    
    try {
      await api.delete(`/admin/sections/${id}`);
      fetchSections();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete section');
    }
  };

  // Helper to get year from semester number (sem 1-2 = year 1, sem 3-4 = year 2, etc.)
  const getYearFromSemester = (semesterNumber: number) => Math.ceil(semesterNumber / 2);

  const getYearLabel = (year: number) => {
    const years = ['', '1st Year', '2nd Year', '3rd Year', '4th Year'];
    return years[year] || `Year ${year}`;
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
          <h1 className="text-2xl font-bold text-gray-800">Sections</h1>
          <p className="text-gray-500">Manage class sections for departments</p>
        </div>
        <button
          onClick={() => {
            setEditingSection(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Department:</label>
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
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input-field w-32"
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{sections.length}</p>
          <p className="text-sm text-blue-600">Total Sections</p>
        </div>
        {[1, 2, 3, 4].map(year => (
          <div key={year} className="card bg-gray-50 border-gray-200">
            <p className="text-2xl font-bold text-gray-700">
              {sections.filter(s => getYearFromSemester(s.semester_number) === year).length}
            </p>
            <p className="text-sm text-gray-600">{getYearLabel(year)}</p>
          </div>
        ))}
      </div>

      {/* Sections by Department */}
      <div className="space-y-6">
        {departments.map(dept => {
          const deptSections = sections.filter(s => s.department_code === dept.code);
          if (deptSections.length === 0 && selectedDepartment) return null;
          
          return (
            <div key={dept.id} className="card">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                  <p className="text-sm text-gray-500">{deptSections.length} section(s)</p>
                </div>
              </div>
              
              {deptSections.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No sections in this department</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deptSections.map((section) => (
                    <div key={section.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-white">
                            <Users className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{section.name}</p>
                            <p className="text-sm text-gray-500">
                              {getYearLabel(getYearFromSemester(section.semester_number))} • Sem {section.semester_number}
                              {section.student_count > 0 && <span className="ml-2">({section.student_count} students)</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingSection(section);
                              setShowModal(true);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(section.id)}
                            className="p-1 text-gray-500 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <SectionModal
          section={editingSection}
          departments={departments}
          onClose={() => {
            setShowModal(false);
            setEditingSection(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingSection(null);
            fetchSections();
          }}
        />
      )}
    </div>
  );
};

// Section Modal Component
const SectionModal: React.FC<{
  section: Section | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ section, departments, onClose, onSuccess }) => {
  // Calculate year from semester_number (sem 1-2 = year 1, sem 3-4 = year 2, etc.)
  const getYearFromSem = (sem: number) => Math.ceil(sem / 2);
  
  const [formData, setFormData] = useState({
    name: section?.name || '',
    year: section ? getYearFromSem(section.semester_number) : 1,
    semester: section?.semester_number || 1,
    departmentId: section?.department_id || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (section) {
        await api.put(`/admin/sections/${section.id}`, formData);
      } else {
        await api.post('/admin/sections', formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save section');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {section ? 'Edit Section' : 'Add New Section'}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                className="input-field w-full"
                placeholder="A, B, C..."
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="input-field w-full"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  required
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                  className="input-field w-full"
                >
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : (section ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sections;
