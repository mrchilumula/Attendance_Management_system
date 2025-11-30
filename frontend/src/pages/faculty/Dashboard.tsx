import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Course } from '../../types';
import { BookOpen, Users, ClipboardCheck, FileText } from 'lucide-react';

const FacultyDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/attendance/my-courses');
      setCourses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
        <p className="text-gray-500">Select a course to take attendance or view records</p>
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No courses assigned for the current semester.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.faculty_course_id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded mb-2">
                    {course.course_code}
                  </span>
                  <h3 className="font-semibold text-gray-800">{course.course_name}</h3>
                  <p className="text-sm text-gray-500">{course.section_name} • {course.semester_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Users className="w-4 h-4" />
                <span>{course.student_count} Students</span>
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/faculty/attendance/${course.faculty_course_id}`}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Take Attendance
                </Link>
                <Link
                  to={`/faculty/sessions/${course.faculty_course_id}`}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  View Records
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
