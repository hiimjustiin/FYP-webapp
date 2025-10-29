import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { instructorService, type InstructorCourse } from '../services/instructorService';
import Button from '../components/ui/Button/Button';
import Table from '../components/ui/Table/Table';
import { useNavigate } from 'react-router-dom';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await instructorService.getCourses();
        setCourses(data);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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
          <h1 className="heading-3 mb-2">Instructor Dashboard</h1>
          <p className="body text-[var(--color-grey-55)]">
            Welcome back, {user?.display_name || 'Instructor'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">Total Courses</div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">{Number(courses.length)}</div>
          </div>
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">Total Students</div>
            <div className="heading-3 text-[var(--color-blue-ntu)]">
              {Number(courses.reduce((sum, course) => sum + course.enrolled_count, 0))}
            </div>
          </div>
          <div className="dashboard-card p-6">
            <div className="caption text-[var(--color-grey-55)] mb-2">Pending Reviews</div>
            <div className="heading-3 text-[var(--color-red-ntu)]">
              {Number(courses.reduce((sum, course) => sum + course.pending_count, 0))}
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-4">My Courses</h2>
          </div>

          {courses.length === 0 ? (
            <div className="py-12 text-center">
              <p className="subtitle-2 text-[var(--color-grey-55)] mb-2">No courses found</p>
              <p className="caption text-[var(--color-grey-55)]">
                You haven't been assigned to any courses yet
              </p>
            </div>
          ) : (
            <Table
              data={[
                ['Course Code', 'Title', 'Term', 'Students', 'Submissions', 'Pending', 'Actions'],
                ...courses.map((row: InstructorCourse) => [
                  <span className="subtitle-2 text-[var(--color-blue-ntu)]">{row.code}</span>,
                  row.title,
                  <span className="caption">{row.term}</span>,
                  <span className="body-2">{Number(row.enrolled_count)}</span>,
                  <span className="body-2">{Number(row.submission_count)}</span>,
                  <span className={`body-2 font-medium ${row.pending_count > 0 ? 'text-[var(--color-red-ntu)]' : ''}`}>
                    {Number(row.pending_count)}
                  </span>,
                  <div className="flex gap-2">
                    <Button 
                      variant="blue" 
                      onClick={() => navigate(`/instructor/courses/${row.id}/students`)}
                    >
                      Students
                    </Button>
                    <Button 
                      variant="darkBlue" 
                      onClick={() => navigate(`/instructor/courses/${row.id}/submissions`)}
                    >
                      Submissions
                    </Button>
                  </div>
                ])
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
