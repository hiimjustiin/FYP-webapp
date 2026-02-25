import { useState, useEffect } from "react";
import {
  adminService,
  type AdminProject,
  type AdminCourse,
} from "../services/adminService";
import Button from "../components/ui/Button/Button";
import InputField from "../components/ui/InputField/InputField";
import TextArea from "../components/ui/TextArea/TextArea";
import Dropdown from "../components/ui/Dropdown/Dropdown";
import Table from "../components/ui/Table/Table";
import SearchBar from "../components/ui/SearchBar/SearchBar";

export default function AdminProjects() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [editingProject, setEditingProject] = useState<AdminProject | null>(
    null,
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [projectsData, coursesData] = await Promise.all([
        adminService.getProjects(),
        adminService.getCourses(),
      ]);
      setProjects(projectsData);
      setCourses(coursesData);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleDeleteProject = async (project: AdminProject) => {
    const submissionCount = Number(project.submission_count);

    if (submissionCount > 0) {
      const confirmed = confirm(
        `⚠️ Warning: "${project.title}" has ${submissionCount} submission(s) with student work.\n\nDeleting this project will permanently remove ALL submissions and their AI feedback.\n\nAre you sure you want to proceed?`,
      );
      if (!confirmed) return;

      // Double confirmation for projects with submissions
      const doubleConfirmed = confirm(
        `This is irreversible. Type OK to confirm deletion of "${project.title}" and all ${submissionCount} submission(s).`,
      );
      if (!doubleConfirmed) return;

      try {
        await adminService.deleteProject(project.id, true);
        loadData();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete project");
      }
    } else {
      if (
        !confirm(
          `Delete project "${project.title}"? This action cannot be undone.`,
        )
      )
        return;

      try {
        await adminService.deleteProject(project.id);
      } catch (err: unknown) {
        // Backend may still return 409 if race condition; handle force deletion
        const apiError = err as { response?: { status?: number } };
        if (apiError.response?.status === 409) {
          const forceConfirm = confirm(
            "This project has submissions. Delete anyway?",
          );
          if (!forceConfirm) return;
          await adminService.deleteProject(project.id, true);
        } else {
          alert(
            err instanceof Error ? err.message : "Failed to delete project",
          );
          return;
        }
      }
      loadData();
    }
  };

  // Filter projects client-side
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      !searchTerm ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.owner_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" || project.project_type === typeFilter;

    const matchesCourse =
      courseFilter === "all" || project.course_id === courseFilter;

    return matchesSearch && matchesType && matchesCourse;
  });

  const typeOptions = [
    { id: "all", label: "All Types" },
    { id: "individual", label: "Individual" },
    { id: "group", label: "Group" },
  ];

  const courseOptions = [
    { id: "all", label: "All Courses" },
    ...courses.map((c) => ({
      id: c.id,
      label: c.code ? `${c.code} - ${c.title}` : c.title,
    })),
  ];

  return (
    <div className="min-h-screen bg-[var(--color-grey-05)]">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="heading-3 mb-2">Project Management</h1>
            <p className="body text-[var(--color-grey-55)]">
              View and manage all student projects and their submissions
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="dashboard-card p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search by project title or owner..."
                onSearch={handleSearch}
              />
            </div>
            <div className="w-full md:w-48">
              <Dropdown
                options={typeOptions}
                selectedOption={
                  typeOptions.find((opt) => opt.id === typeFilter) || null
                }
                onSelect={(option) => setTypeFilter(option.id)}
              />
            </div>
            <div className="w-full md:w-56">
              <Dropdown
                options={courseOptions}
                selectedOption={
                  courseOptions.find((opt) => opt.id === courseFilter) || null
                }
                onSelect={(option) => setCourseFilter(option.id)}
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Projects Table */}
        <div className="dashboard-card p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No projects found
            </div>
          ) : (
            <Table
              noBorder
              data={[
                [
                  "Title",
                  "Owner",
                  "Course",
                  "Type",
                  "Members",
                  "Submissions",
                  "Status",
                  "Created",
                  "Actions",
                ],
                ...filteredProjects.map((project) => [
                  project.title,
                  <div key={`owner-${project.id}`}>
                    <div className="font-medium text-sm">
                      {project.owner_name || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {project.owner_email}
                    </div>
                  </div>,
                  project.course_code ? `${project.course_code}` : "No course",
                  <span
                    key={`type-${project.id}`}
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      project.project_type === "group"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {project.project_type === "group" ? "Group" : "Individual"}
                  </span>,
                  project.project_type === "group"
                    ? `${Number(project.member_count) + 1}`
                    : "—",
                  <span
                    key={`sub-${project.id}`}
                    className={
                      Number(project.submission_count) > 0
                        ? "font-medium text-green-700"
                        : "text-gray-400"
                    }
                  >
                    {project.submission_count}
                  </span>,
                  <span
                    key={`status-${project.id}`}
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      project.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : project.status === "Processing"
                          ? "bg-yellow-100 text-yellow-800"
                          : project.status === "Failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {project.status}
                  </span>,
                  new Date(project.created_at).toLocaleDateString(),
                  <div className="flex gap-2" key={`actions-${project.id}`}>
                    <Button
                      variant="blue"
                      onClick={() => setEditingProject(project)}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="red"
                      onClick={() => handleDeleteProject(project)}
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

        {/* Edit Project Modal */}
        {editingProject && (
          <ProjectEditModal
            project={editingProject}
            onClose={() => setEditingProject(null)}
            onSave={() => {
              loadData();
              setEditingProject(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Project Edit Modal Component
function ProjectEditModal({
  project,
  onClose,
  onSave,
}: {
  project: AdminProject;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    title: project.title || "",
    description: project.description || "",
    status: project.status || "Draft",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const statusOptions = [
    { id: "Draft", label: "Draft" },
    { id: "Submitted", label: "Submitted" },
    { id: "Processing", label: "Processing" },
    { id: "Completed", label: "Completed" },
    { id: "Failed", label: "Failed" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      await adminService.updateProject(project.id, {
        title: formData.title,
        description: formData.description,
        status: formData.status,
      });
      onSave();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to update project",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Project</h2>

        {/* Read-only project info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border text-sm">
          <p>
            <span className="font-medium">Owner:</span> {project.owner_name}
          </p>
          <p>
            <span className="font-medium">Type:</span>{" "}
            {project.project_type === "group" ? "Group" : "Individual"}
          </p>
          {project.course_code && (
            <p>
              <span className="font-medium">Course:</span> {project.course_code}
            </p>
          )}
          {Number(project.submission_count) > 0 && (
            <p className="text-amber-700 mt-1">
              ⚠ This project has {project.submission_count} submission(s)
            </p>
          )}
        </div>

        {formError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Project Title"
            value={formData.title}
            onChange={(value: string) =>
              setFormData({ ...formData, title: value })
            }
            required
          />

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(value: string) =>
              setFormData({ ...formData, description: value })
            }
            rows={3}
            maxLength={1000}
            showCharCount={true}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Dropdown
              options={statusOptions}
              selectedOption={
                statusOptions.find((opt) => opt.id === formData.status) || null
              }
              onSelect={(option) =>
                setFormData({ ...formData, status: option.id })
              }
              placeholder="Select status"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="grey"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="blue"
              onClick={() =>
                handleSubmit(new Event("submit") as unknown as React.FormEvent)
              }
              disabled={saving || !formData.title.trim()}
              className="flex-1"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
