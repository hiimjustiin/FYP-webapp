import { useState, useEffect } from "react";
import {
  instructorService,
  type InstructorCourse,
  type CreateCourseData,
  type UpdateCourseData,
} from "../services/instructorService";
import Button from "../components/ui/Button/Button";
import InputField from "../components/ui/InputField/InputField";
import TextArea from "../components/ui/TextArea/TextArea";
import Table from "../components/ui/Table/Table";
import SearchBar from "../components/ui/SearchBar/SearchBar";

export default function InstructorCourses() {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<InstructorCourse | null>(
    null
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const coursesData = await instructorService.getCourses();
      setCourses(coursesData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      )
    )
      return;

    try {
      await instructorService.deleteCourse(courseId);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      !searchTerm ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--color-grey-05)]">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="heading-3 mb-2">Course Management</h1>
            <p className="body text-[var(--color-grey-55)]">
              Create and manage your courses
            </p>
          </div>
          <Button variant="blue" onClick={() => setShowCreateModal(true)}>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Course
          </Button>
        </div>

        {/* Search */}
        <div className="dashboard-card p-4 mb-6">
          <SearchBar
            placeholder="Search by course code or title..."
            onSearch={handleSearch}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Courses Table */}
        <div className="dashboard-card p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "No courses match your search"
                : "No courses found. Create your first course to get started!"}
            </div>
          ) : (
            <Table
              noBorder
              data={[
                ["Code", "Title", "Term", "Students", "Submissions", "Actions"],
                ...filteredCourses.map((course) => [
                  course.code,
                  course.title,
                  course.term || "N/A",
                  course.enrolled_count,
                  course.submission_count,
                  <div className="flex gap-2" key={course.id}>
                    <Button
                      variant="blue"
                      onClick={() => setEditingCourse(course)}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="red"
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-xs"
                    >
                      Delete
                    </Button>
                  </div>,
                ]),
              ]}
            />
          )}
        </div>

        {/* Create/Edit Course Modal */}
        {(showCreateModal || editingCourse) && (
          <CourseModal
            course={editingCourse}
            onClose={() => {
              setShowCreateModal(false);
              setEditingCourse(null);
            }}
            onSave={() => {
              loadData();
              setShowCreateModal(false);
              setEditingCourse(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Course Create/Edit Modal Component
function CourseModal({
  course,
  onClose,
  onSave,
}: {
  course: InstructorCourse | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    code: course?.code || "",
    title: course?.title || "",
    description: course?.description || "",
    term: course?.term || "",
    passcode: course?.passcode || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (course) {
        // Update existing course
        const updateData: UpdateCourseData = {
          code: formData.code,
          title: formData.title,
          description: formData.description,
          term: formData.term,
          passcode: formData.passcode || undefined,
        };
        await instructorService.updateCourse(course.id, updateData);
      } else {
        // Create new course
        const createData: CreateCourseData = {
          code: formData.code,
          title: formData.title,
          description: formData.description,
          term: formData.term,
          passcode: formData.passcode || undefined,
        };
        await instructorService.createCourse(createData);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {course ? "Edit Course" : "Create New Course"}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Course Code"
            value={formData.code}
            onChange={(value: string) =>
              setFormData({ ...formData, code: value })
            }
            placeholder="e.g., CS101"
            required
          />

          <InputField
            label="Course Title"
            value={formData.title}
            onChange={(value: string) =>
              setFormData({ ...formData, title: value })
            }
            placeholder="e.g., Introduction to Computer Science"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <TextArea
              value={formData.description}
              onChange={(value: string) =>
                setFormData({ ...formData, description: value })
              }
              placeholder="Course description..."
              maxLength={1000}
              showCharCount
            />
          </div>

          <InputField
            label="Term"
            value={formData.term}
            onChange={(value: string) =>
              setFormData({ ...formData, term: value })
            }
            placeholder="e.g., Fall 2025"
          />

          <InputField
            label="Course Passcode (Optional)"
            value={formData.passcode}
            onChange={(value: string) =>
              setFormData({ ...formData, passcode: value })
            }
            placeholder="Leave blank to use course code as passcode"
          />
          <p className="text-xs text-gray-500 -mt-2">
            Case-sensitive. Students must enter this passcode to enroll.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="blue"
              disabled={saving}
              className="flex-1"
            >
              {saving
                ? "Saving..."
                : course
                ? "Update Course"
                : "Create Course"}
            </Button>
            <Button
              type="button"
              variant="grey"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
