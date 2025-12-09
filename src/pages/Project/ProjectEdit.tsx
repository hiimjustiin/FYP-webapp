import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProjectForm, {
  type ProjectFormData,
} from "../../components/layout/ProjectForm/ProjectForm";
import type { Project } from "../../services/projectService";
import type { Member } from "../../components/ui/SearchBar/SearchBar";

const ProjectEdit = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<Project | null>(null);

  // Fetch project data on mount
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        if (!projectId) {
          setError("Project ID not found");
          return;
        }

        // TODO: Replace with actual API call when available
        // const project = await projectService.getProjectById(projectId);
        // setProjectData(project);

        // Mock data for now
        const mockProject: Project = {
          id: projectId,
          owner_id: "user-123",
          title: "Sample Project",
          description: "Sample project description",
          course_code: "cs",
          status: "Completed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          submission_date: new Date().toISOString(),
          members: [],
          interq_score: undefined,
        };
        setProjectData(mockProject);
      } catch (err) {
        console.error("Failed to load project:", err);
        setError("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleFormSubmit = async (
    data: ProjectFormData,
    teamMembers: Member[],
    files: File[]
  ) => {
    try {
      setIsSubmitting(true);
      if (!projectId) {
        throw new Error("Project ID not found");
      }

      // TODO: Replace with actual API call to projectService
      const projectPayload = {
        course: data.course,
        title: data.projectName,
        type: data.projectType,
        description: data.description,
        notes: data.text,
        members: teamMembers,
        files: files,
      };

      console.log("Updating project:", projectPayload);
      // const result = await projectService.updateProject(projectId, projectPayload);

      // Show success message
      alert("Project updated successfully!");
      navigate("/project");
    } catch (error) {
      console.error("Failed to update project:", error);
      alert(
        `Failed to update project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="subtitle-2 text-[var(--color-grey-55)]">
          Loading project...
        </p>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="subtitle-2 text-red-500 mb-3">
            {error || "Project not found"}
          </p>
          <button
            onClick={() => navigate("/project")}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Convert project data to form data
  const initialFormData: ProjectFormData = {
    course: projectData.course_code || "",
    projectName: projectData.title || "",
    projectType: "", // TODO: Get from project data when API updated
    description: projectData.description || "",
    text: "",
  };

  return (
    <ProjectForm
      initialData={initialFormData}
      selectedTeamMembers={[]}
      selectedFiles={[]}
      isSubmitting={isSubmitting}
      isEditing={true}
      onSubmit={handleFormSubmit}
      onCancel={() => navigate("/project")}
    />
  );
};

export default ProjectEdit;
