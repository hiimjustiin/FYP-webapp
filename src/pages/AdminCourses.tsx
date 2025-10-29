import { useState, useEffect } from "react";
import {
  adminService,
  type AdminCourse,
  type Instructor,
} from "../services/adminService";
import Button from "../components/ui/Button/Button";
import InputField from "../components/ui/InputField/InputField";
import TextArea from "../components/ui/TextArea/TextArea";
import Dropdown from "../components/ui/Dropdown/Dropdown";
import Table from "../components/ui/Table/Table";
import SearchBar from "../components/ui/SearchBar/SearchBar";

export default function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [coursesData, instructorsData] = await Promise.all([
        adminService.getCourses(),
        adminService.getInstructors(),
      ]);
      setCourses(coursesData);
      setInstructors(instructorsData);
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
      await adminService.deleteCourse(courseId);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      !searchTerm ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Course Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage all courses and assign instructors
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
        <div className="dashboard-card">
          <SearchBar
            placeholder="Search by course code, title, or instructor..."
            onSearch={handleSearch}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Courses Table */}
        <div className="dashboard-card">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No courses match your search" : "No courses found"}
            </div>
          ) : (
            <Table
              data={[
                [
                  "Code",
                  "Title",
                  "Instructor",
                  "Term",
                  "Students",
                  "Submissions",
                  "Actions",
                ],
                ...filteredCourses.map((course) => [
                  course.code,
                  course.title,
                  course.instructor_name || "Unassigned",
                  course.term || "N/A",
                  course.enrollment_count,
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
          instructors={instructors}
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
  );
}

// Course Create/Edit Modal Component
function CourseModal({
  course,
  instructors,
  onClose,
  onSave,
}: {
  course: AdminCourse | null;
  instructors: Instructor[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    code: course?.code || "",
    title: course?.title || "",
    description: course?.description || "",
    instructor_id: course?.instructor_id || "",
    term: course?.term || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const instructorOptions = [
    { id: "", label: "No instructor assigned" },
    ...instructors.map((inst) => ({
      id: inst.id,
      label: `${inst.display_name} (${inst.email})`,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (course) {
        // Update existing course
        await adminService.updateCourse(course.id, {
          code: formData.code,
          title: formData.title,
          description: formData.description,
          instructor_id: formData.instructor_id || undefined,
          term: formData.term,
        });
      } else {
        // Create new course
        await adminService.createCourse({
          code: formData.code,
          title: formData.title,
          description: formData.description,
          instructor_id: formData.instructor_id || undefined,
          term: formData.term,
        });
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructor
            </label>
            <Dropdown
              options={instructorOptions}
              selectedOption={
                instructorOptions.find(
                  (opt) => opt.id === formData.instructor_id
                ) || null
              }
              onSelect={(option) =>
                setFormData({ ...formData, instructor_id: option.id })
              }
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
