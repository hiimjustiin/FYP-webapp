import { useState } from "react";
import type { Course } from "../../services/courseService";
import InputField from "../ui/InputField/InputField";
import Button from "../ui/Button/Button";
import EnrollmentModal from "../ui/EnrollmentModal/EnrollmentModal";

interface CourseEnrollmentProps {
  availableCourses: Course[];
  enrolledCourses: Course[];
  onEnroll: (courseId: string, passcode: string) => Promise<void>;
  onUnenroll: (courseId: string) => Promise<void>;
  isLoading: boolean;
}

const CourseEnrollment = ({
  availableCourses,
  enrolledCourses,
  onEnroll,
  onUnenroll,
  isLoading,
}: CourseEnrollmentProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingCourseIds, setLoadingCourseIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<Course | null>(null);
  const [enrollmentError, setEnrollmentError] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  const filteredCourses = availableCourses.filter((course) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      course.code.toLowerCase().includes(query) ||
      course.title.toLowerCase().includes(query) ||
      course.instructor_name?.toLowerCase().includes(query)
    );
  });

  const handleOpenEnrollmentModal = (course: Course) => {
    setSelectedCourseForEnrollment(course);
    setEnrollmentError("");
  };

  const handleCloseEnrollmentModal = () => {
    setSelectedCourseForEnrollment(null);
    setEnrollmentError("");
  };

  const handleEnrollWithPasscode = async (passcode: string) => {
    if (!selectedCourseForEnrollment) return;

    setIsEnrolling(true);
    setEnrollmentError("");
    setLoadingCourseIds((prev) => new Set(prev).add(selectedCourseForEnrollment.id));

    try {
      await onEnroll(selectedCourseForEnrollment.id, passcode);
      handleCloseEnrollmentModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to enroll in course";
      setEnrollmentError(errorMessage);
    } finally {
      setIsEnrolling(false);
      setLoadingCourseIds((prev) => {
        const next = new Set(prev);
        if (selectedCourseForEnrollment) {
          next.delete(selectedCourseForEnrollment.id);
        }
        return next;
      });
    }
  };

  const handleUnenroll = async (courseId: string) => {
    setLoadingCourseIds((prev) => new Set(prev).add(courseId));
    try {
      await onUnenroll(courseId);
    } finally {
      setLoadingCourseIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="max-w-md">
        <InputField
          type="text"
          placeholder="Search courses by code, title, or instructor..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-full"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading courses...</div>
      ) : (
        <>
          {/* Enrolled Courses */}
          <div>
            <h6 className="heading-6 mb-4">
              My Enrolled Courses ({enrolledCourses.length})
            </h6>
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  You are not enrolled in any courses yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledCourses.map((course) => (
                  <div
                    key={course.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-lg">
                            {course.code}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Enrolled
                          </span>
                        </div>
                        <h6 className="font-semibold text-gray-800 mb-1">
                          {course.title}
                        </h6>
                        {course.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {course.description}
                          </p>
                        )}
                        <div className="text-sm text-gray-500">
                          <p>Instructor: {course.instructor_name || "TBA"}</p>
                          {course.term && <p>Term: {course.term}</p>}
                        </div>
                      </div>
                      <Button
                        variant="grey"
                        onClick={() => handleUnenroll(course.id)}
                        disabled={loadingCourseIds.has(course.id)}
                      >
                        {loadingCourseIds.has(course.id)
                          ? "Unenrolling..."
                          : "Unenroll"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Courses */}
          <div>
            <h6 className="heading-6 mb-4">Available Courses</h6>
            {filteredCourses.filter((c) => !c.enrolled).length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  {searchQuery
                    ? "No courses found matching your search."
                    : "All available courses are enrolled."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCourses
                  .filter((course) => !course.enrolled)
                  .map((course) => (
                    <div
                      key={course.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs text-gray-500">
                              {course.enrollment_count || 0} enrolled
                            </span>
                          </div>
                          <h6 className="font-semibold text-gray-800 mb-1">
                            {course.title}
                          </h6>
                          {course.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {course.description}
                            </p>
                          )}
                          <div className="text-sm text-gray-500">
                            <p>Instructor: {course.instructor_name || "TBA"}</p>
                            {course.term && <p>Term: {course.term}</p>}
                          </div>
                        </div>
                        <Button
                          variant="blue"
                          onClick={() => handleOpenEnrollmentModal(course)}
                          disabled={loadingCourseIds.has(course.id)}
                        >
                          {loadingCourseIds.has(course.id)
                            ? "Enrolling..."
                            : "Enter Passcode"}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Enrollment Modal */}
          <EnrollmentModal
            course={selectedCourseForEnrollment}
            isOpen={selectedCourseForEnrollment !== null}
            isLoading={isEnrolling}
            onEnroll={handleEnrollWithPasscode}
            onClose={handleCloseEnrollmentModal}
            errorMessage={enrollmentError}
          />
        </>
      )}
    </div>
  );
};

export default CourseEnrollment;
