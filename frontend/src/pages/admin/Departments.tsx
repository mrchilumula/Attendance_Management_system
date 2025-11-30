import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
}

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/departments');
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
      await api.delete(`/admin/departments/${id}`);
      fetchDepartments();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete department');
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
          <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
          <p className="text-gray-500">Manage academic departments</p>
        </div>
        <button
          onClick={() => {
            setEditingDept(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary-100 text-primary-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                  <span className="text-sm text-primary-600 font-medium">{dept.code}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingDept(dept);
                    setShowModal(true);
                  }}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {dept.description && (
              <p className="mt-3 text-sm text-gray-600">{dept.description}</p>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="font-medium text-gray-700">
                  {new Date(dept.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        ))}

        {departments.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No departments found</p>
            <p className="text-sm">Click "Add Department" to create one</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <DepartmentModal
          department={editingDept}
          onClose={() => {
            setShowModal(false);
            setEditingDept(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingDept(null);
            fetchDepartments();
          }}
        />
      )}
    </div>
  );
};

// Department Modal Component
const DepartmentModal: React.FC<{
  department: Department | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ department, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    code: department?.code || '',
    description: department?.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (department) {
        await api.put(`/admin/departments/${department.id}`, formData);
      } else {
        await api.post('/admin/departments', formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {department ? 'Edit Department' : 'Add New Department'}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field w-full"
                placeholder="Computer Science and Engineering"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="input-field w-full"
                placeholder="CSE"
                disabled={!!department}
              />
              {department && (
                <p className="text-xs text-gray-500 mt-1">Department code cannot be changed</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field w-full"
                rows={3}
                placeholder="Enter department description..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : (department ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Departments;
