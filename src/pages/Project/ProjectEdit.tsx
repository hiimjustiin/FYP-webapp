import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProjectForm, {
  type ProjectFormData,
} from "../../components/layout/ProjectForm/ProjectForm";
import { projectService, type Project } from "../../services/projectService";
import type { Member } from "../../components/ui/SearchBar/SearchBar";

const ProjectEdit = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [existingMembers, setExistingMembers] = useState<Member[]>([]);

  // Fetch project data on mount
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        if (!projectId) {
          setError("Project ID not found");
          return;
        }

        const project = await projectService.getProject(projectId);
        setProjectData(project);

        // Convert project members to Member format for the form
        if (project.members && project.members.length > 0) {
          const members: Member[] = project.members.map((m) => {
            const nameParts = (m.display_name || "Unknown").split(" ");
            const initials = nameParts
              .map((part) => part.charAt(0).toUpperCase())
              .join("")
              .substring(0, 2);

            // Generate consistent color based on ID
            const colors: (
              | "blue"
              | "pink"
              | "green"
              | "purple"
              | "teal"
              | "yellow"
            )[] = ["blue", "pink", "green", "purple", "teal", "yellow"];
            const colorIndex =
              parseInt(m.user_id.substring(0, 8), 16) % colors.length;

            return {
              id: m.user_id,
              name: m.display_name || "Unknown",
              initials,
              backgroundColor: colors[colorIndex],
            };
          });
          setExistingMembers(members);
        }
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _files: File[],
  ) => {
    try {
      setIsSubmitting(true);
      if (!projectId) {
        throw new Error("Project ID not found");
      }

      // Build update payload
      const updateData: {
        title?: string;
        description?: string;
        member_ids?: string[];
      } = {};

      if (data.projectName) {
        updateData.title = data.projectName;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      // Include team members for group projects
      if (data.projectType === "group") {
        updateData.member_ids = teamMembers.map((m) => m.id);
      }

      await projectService.updateProject(projectId, updateData);

      // Navigate back to project list or detail
      navigate("/project");
    } catch (error) {
      console.error("Failed to update project:", error);
      alert(
        `Failed to update project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
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

  // Determine project type — use project_type from API, fall back to member count
  const projectType =
    projectData.project_type ||
    (existingMembers.length > 0 ? "group" : "individual");

  // Convert project data to form data
  const initialFormData: ProjectFormData = {
    course: projectData.course_id || projectData.course_code || "",
    projectName: projectData.title || "",
    projectType: projectType,
    description: projectData.description || "",
    text: "",
  };

  return (
    <ProjectForm
      initialData={initialFormData}
      selectedTeamMembers={existingMembers}
      selectedFiles={[]}
      isSubmitting={isSubmitting}
      isEditing={true}
      onSubmit={handleFormSubmit}
      onCancel={() => navigate("/project")}
    />
  );
};

export default ProjectEdit;
