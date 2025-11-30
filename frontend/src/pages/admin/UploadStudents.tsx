import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';

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

const UploadStudents: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('password123');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.docx') && !selectedFile.name.endsWith('.doc')) {
        toast.error('Please select a Word document (.doc or .docx)');
        return;
      }
      setFile(selectedFile);
      setResult(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Upload Students</h1>
          <p className="text-gray-500">Import students from Word document</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800">Document Format</h3>
            <p className="text-blue-700 text-sm mt-1">
              Upload a Word document (.docx) with student data in any of these formats:
            </p>
            <div className="mt-2 bg-white rounded-lg p-3 text-sm font-mono text-gray-700">
              <p className="font-semibold text-gray-800 mb-1">Format 1 (Comma separated):</p>
              <p>21CS1A0101, Rahul Kumar</p>
              <p>21CS1A0102, Priya Sharma</p>
              <p className="font-semibold text-gray-800 mt-3 mb-1">Format 2 (Tab/Space separated):</p>
              <p>21CS1A0101    Rahul Kumar    rahul@email.com</p>
              <p>21CS1A0102    Priya Sharma   priya@email.com</p>
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
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="file-upload"
            accept=".doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            {file ? (
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-800">Click to select Word document</p>
                <p className="text-sm text-gray-500">.doc or .docx files only</p>
              </div>
            )}
          </label>
        </div>

        {/* Upload Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploading || !file || !selectedDepartment || !selectedSection}
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
