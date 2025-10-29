import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { instructorService, type CourseStudent } from '../services/instructorService';
import Button from '../components/ui/Button/Button';
import Table from '../components/ui/Table/Table';
import SearchBar from '../components/ui/SearchBar/SearchBar';

const CourseStudents = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<CourseStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      if (!courseId) return;
      
      try {
        const data = await instructorService.getCourseStudents(courseId);
        setStudents(data);
        setFilteredStudents(data);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [courseId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(
      student =>
        student.display_name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.student_id?.toLowerCase().includes(query)
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="subtitle-2 text-[var(--color-grey-55)]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="subtitle-2 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-grey-05)]">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="grey" 
            onClick={() => navigate('/instructor')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="heading-3 mb-2">Course Students</h1>
          <p className="body text-[var(--color-grey-55)]">
            {students.length} {students.length === 1 ? 'student' : 'students'} enrolled
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">Total Students</div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">{students.length}</div>
          </div>
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">Active Submissions</div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">
              {students.reduce((sum, s) => sum + s.submission_count, 0)}
            </div>
          </div>
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">Avg Submissions</div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">
              {students.length > 0 
                ? (students.reduce((sum, s) => sum + s.submission_count, 0) / students.length).toFixed(1)
                : '0.0'
              }
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="dashboard-card p-6">
          <div className="mb-4">
            <SearchBar
              onSearch={setSearchQuery}
              placeholder="Search by name, email, or student ID..."
            />
          </div>

          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="subtitle-2 text-[var(--color-grey-55)] mb-2">
                {searchQuery ? 'No students found' : 'No students enrolled'}
              </p>
              <p className="caption text-[var(--color-grey-55)]">
                {searchQuery ? 'Try adjusting your search query' : 'Students will appear here once enrolled'}
              </p>
            </div>
          ) : (
            <Table
              noBorder
              data={[
                ['Student ID', 'Name', 'Email', 'Submissions', 'Enrolled'],
                ...filteredStudents.map((row: CourseStudent) => [
                  <span className="subtitle-2 text-[var(--color-blue-ntu)]">{row.student_id || 'N/A'}</span>,
                  <span className="body-2">{row.display_name}</span>,
                  <span className="caption text-[var(--color-grey-55)]">{row.email}</span>,
                  <span className="body-2 font-medium">{row.submission_count}</span>,
                  <span className="caption text-[var(--color-grey-55)]">
                    {new Date(row.enrolled_at).toLocaleDateString()}
                  </span>
                ])
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseStudents;
