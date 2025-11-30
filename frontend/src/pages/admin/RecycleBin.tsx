import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Trash2, RotateCcw, AlertTriangle, User, GraduationCap, Users } from 'lucide-react';

interface DeletedUser {
  id: string;
  original_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'faculty';
  phone: string | null;
  department_name: string | null;
  department_code: string | null;
  created_at: string;
  deleted_at: string;
  deleted_by_name: string | null;
  attendance_count: number;
}

const RecycleBin: React.FC = () => {
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchDeletedUsers();
  }, [selectedRole]);

  const fetchDeletedUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedRole) params.role = selectedRole;
      
      const response = await api.get('/admin/recycle-bin', { params });
      setDeletedUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch deleted users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (user: DeletedUser) => {
    if (!window.confirm(`Restore ${user.first_name} ${user.last_name}?`)) return;
    
    setProcessing(user.id);
    try {
      await api.post(`/admin/recycle-bin/${user.id}/restore`);
      fetchDeletedUsers();
      alert('User restored successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to restore user');
    } finally {
      setProcessing(null);
    }
  };

  const handlePermanentDelete = async (user: DeletedUser) => {
    if (!window.confirm(`Permanently delete ${user.first_name} ${user.last_name}? This cannot be undone!`)) return;
    
    setProcessing(user.id);
    try {
      await api.delete(`/admin/recycle-bin/${user.id}`);
      fetchDeletedUsers();
      alert('User permanently deleted');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete user');
    } finally {
      setProcessing(null);
    }
  };

  const handleEmptyRecycleBin = async () => {
    if (!window.confirm('Are you sure you want to permanently delete ALL items in the recycle bin? This cannot be undone!')) return;
    
    try {
      await api.delete('/admin/recycle-bin');
      fetchDeletedUsers();
      alert('Recycle bin emptied');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to empty recycle bin');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getTimeSinceDeleted = (deletedAt: string) => {
    const diff = Date.now() - new Date(deletedAt).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
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
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 text-red-600">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Recycle Bin</h1>
            <p className="text-gray-500">Deleted users can be restored from here</p>
          </div>
        </div>
        {deletedUsers.length > 0 && (
          <button
            onClick={handleEmptyRecycleBin}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Empty Recycle Bin
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Role:</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="input-field w-48"
          >
            <option value="">All Users</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gray-50 border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-gray-500" />
            <div>
              <p className="text-2xl font-bold text-gray-700">{deletedUsers.length}</p>
              <p className="text-sm text-gray-600">Total Deleted</p>
            </div>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {deletedUsers.filter(u => u.role === 'student').length}
              </p>
              <p className="text-sm text-blue-600">Students</p>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {deletedUsers.filter(u => u.role === 'faculty').length}
              </p>
              <p className="text-sm text-purple-600">Faculty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deleted Users List */}
      {deletedUsers.length === 0 ? (
        <div className="card text-center py-12">
          <Trash2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600">Recycle Bin is Empty</h3>
          <p className="text-gray-500">Deleted users will appear here</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Deleted</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Info</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        user.role === 'student' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {user.department_code ? (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {user.department_code}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm text-gray-600">{getTimeSinceDeleted(user.deleted_at)}</p>
                        <p className="text-xs text-gray-400">{formatDate(user.deleted_at)}</p>
                        {user.deleted_by_name && (
                          <p className="text-xs text-gray-400">by {user.deleted_by_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {user.role === 'student' && user.attendance_count > 0 && (
                        <span className="text-orange-600 text-xs">
                          {user.attendance_count} attendance records deleted
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestore(user)}
                          disabled={processing === user.id}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded flex items-center gap-1"
                          title="Restore"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span className="text-xs">Restore</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(user)}
                          disabled={processing === user.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded flex items-center gap-1"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Important Notes</h4>
            <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
              <li>Restored students will be re-enrolled in their original sections (if still exist)</li>
              <li>Attendance records are permanently deleted and cannot be restored</li>
              <li>Permanently deleted items cannot be recovered</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecycleBin;
