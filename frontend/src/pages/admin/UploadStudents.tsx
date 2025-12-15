import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Info, Eye, FileSpreadsheet, Download } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Section {
  id: string;
  name: string;
  department_code: string;
}

interface PreviewStudent {
  rollNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

const UploadStudents: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('password123');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewStudent[] | null>(null);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [result, setResult] = useState<{
    total: number;
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptRes, sectRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/sections'),
      ]);
      setDepartments(deptRes.data.data);
      setSections(sectRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const filteredSections = sections.filter(
    (s) => !selectedDepartment || departments.find(d => d.id === selectedDepartment)?.code === s.department_code
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.xlsx', '.xls', '.csv', '.docx', '.doc'];
      const ext = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      if (!validExtensions.includes(ext)) {
        toast.error('Please select an Excel (.xlsx, .xls), CSV, or Word (.docx) file');
        return;
      }
      setFile(selectedFile);
      setResult(null);
      setPreviewData(null);
      
      // Auto-preview the file
      await handlePreview(selectedFile);
    }
  };

  const handlePreview = async (fileToPreview: File) => {
    setPreviewing(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToPreview);

      const response = await api.post('/upload/students/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPreviewData(response.data.data.students);
      setPreviewTotal(response.data.data.total);
      toast.success(`Found ${response.data.data.total} students`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to preview file');
      setPreviewData(null);
    } finally {
      setPreviewing(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (!selectedDepartment || !selectedSection) {
      toast.error('Please select department and section');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('departmentId', selectedDepartment);
      formData.append('sectionId', selectedSection);
      formData.append('defaultPassword', defaultPassword);

      const response = await api.post('/upload/students', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.data);
      toast.success(response.data.message);
      setFile(null);
      setPreviewData(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed');
      if (error.response?.data?.hint) {
        console.log('Hint:', error.response.data.hint);
      }
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const csvContent = `Roll Number,Name,Email,Phone
21CS1A0101,Rahul Kumar,rahul@email.com,9876543210
21CS1A0102,Priya Sharma,priya@email.com,9876543211
21CS1A0103,Amit Singh,amit@email.com,9876543212`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bulk Upload Students</h1>
            <p className="text-gray-500">Import students from Excel, CSV, or Word files</p>
          </div>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800">Supported File Formats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="bg-white rounded-lg p-3">
                <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Excel/CSV (Recommended)
                </p>
                <p className="text-sm text-gray-600 mb-2">Columns: Roll Number, Name, Email, Phone</p>
                <div className="text-xs font-mono bg-gray-50 p-2 rounded">
                  <p>Roll Number | Name | Email | Phone</p>
                  <p>21CS1A0101 | Rahul Kumar | rahul@email.com | 9876543210</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Word Document
                </p>
                <p className="text-sm text-gray-600 mb-2">Comma or tab separated data</p>
                <div className="text-xs font-mono bg-gray-50 p-2 rounded">
                  <p>21CS1A0101, Rahul Kumar</p>
                  <p>21CS1A0102, Priya Sharma</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Upload Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedSection('');
              }}
              className="input-field"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="input-field"
              disabled={!selectedDepartment}
            >
              <option value="">Select Section</option>
              {filteredSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Password</label>
            <input
              type="text"
              value={defaultPassword}
              onChange={(e) => setDefaultPassword(e.target.value)}
              className="input-field"
              placeholder="password123"
            />
            <p className="text-xs text-gray-500 mt-1">Students will use this password to login initially</p>
          </div>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls,.csv,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            {file ? (
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                {previewing && <p className="text-sm text-primary-600 mt-2">Parsing file...</p>}
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-800">Click to select file</p>
                <p className="text-sm text-gray-500">Excel (.xlsx, .xls), CSV, or Word (.docx) files</p>
              </div>
            )}
          </label>
        </div>

        {/* Preview Table */}
        {previewData && previewData.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary-600" />
                Preview ({previewTotal} students found)
              </h3>
              {previewTotal > 100 && (
                <span className="text-sm text-gray-500">Showing first 100 records</span>
              )}
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Roll Number</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">First Name</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Last Name</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Email</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewData.map((student, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium">{student.rollNumber}</td>
                      <td className="py-2 px-3">{student.firstName}</td>
                      <td className="py-2 px-3">{student.lastName}</td>
                      <td className="py-2 px-3 text-gray-500">{student.email || '-'}</td>
                      <td className="py-2 px-3 text-gray-500">{student.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-6 flex justify-end gap-3">
          {previewData && (
            <button
              onClick={() => {
                setFile(null);
                setPreviewData(null);
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading || !file || !selectedDepartment || !selectedSection || !previewData}
            className="btn-primary flex items-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload & Import Students
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Import Results
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-800">{result.total}</p>
              <p className="text-sm text-gray-500">Total Found</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{result.imported}</p>
              <p className="text-sm text-gray-500">Imported</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
              <p className="text-sm text-gray-500">Skipped (duplicates)</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="font-medium text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Errors:
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadStudents;
