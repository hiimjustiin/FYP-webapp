import { useState, useEffect } from "react";
import {
  instructorService,
  type CourseStudent,
} from "../services/instructorService";
import SearchBar from "../components/ui/SearchBar/SearchBar";

interface StudentWithCourse extends CourseStudent {
  course_id: string;
  course_title: string;
}

const InstructorStudents = () => {
  const [students, setStudents] = useState<StudentWithCourse[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithCourse[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const courses = await instructorService.getCourses();
      let allStudents: StudentWithCourse[] = [];

      for (const course of courses) {
        const courseStudents = await instructorService.getCourseStudents(
          course.id
        );
        const enrichedStudents = courseStudents.map((student) => ({
          ...student,
          course_id: course.id,
          course_title: course.title,
        }));
        allStudents = [...allStudents, ...enrichedStudents];
      }

      // Remove duplicates (students enrolled in multiple courses)
      const uniqueStudents = Array.from(
        new Map(allStudents.map((s) => [s.id, s])).values()
      );

      setStudents(uniqueStudents);
      setFilteredStudents(uniqueStudents);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.display_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-grey-05)] p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="heading-3 mb-2">All Students</h1>
          <p className="body text-[var(--color-grey-55)]">
            View all enrolled students across your courses
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Search Filter */}
        <div className="dashboard-card p-6 mb-6">
          <SearchBar
            placeholder="Search by name, email, student ID, or department..."
            onSearch={setSearchTerm}
          />
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="body-2 text-[var(--color-grey-55)]">
            Showing {filteredStudents.length} of {students.length} students
          </p>
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="dashboard-card p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-[var(--color-grey-35)] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M9 9H5m14 0h-4m0 5.5A8.5 8.5 0 003.5 19"
              />
            </svg>
            <p className="subtitle-2 text-[var(--color-grey-55)]">
              No students found
            </p>
          </div>
        ) : (
          <div className="dashboard-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-grey-15)] bg-[var(--color-grey-05)]">
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Student ID
                    </th>
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Submissions
                    </th>
                    <th className="px-6 py-4 text-left body-2 font-semibold text-[var(--color-grey-55)]">
                      Last Submission
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-[var(--color-grey-15)] hover:bg-[var(--color-grey-05)]"
                    >
                      <td className="px-6 py-4">
                        <p className="body-2 font-medium">
                          {student.display_name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="body-2">{student.student_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="body-2 text-[var(--color-grey-55)]">
                          {student.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="body-2">{student.department}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-blue-ntu)] bg-opacity-10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-[var(--color-blue-ntu)]">
                              {student.submission_count}
                            </span>
                          </div>
                          <span className="body-2 text-[var(--color-grey-55)]">
                            submission
                            {student.submission_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="body-2">
                          {student.last_submission_at
                            ? new Date(
                                student.last_submission_at
                              ).toLocaleDateString()
                            : "No submissions"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorStudents;
