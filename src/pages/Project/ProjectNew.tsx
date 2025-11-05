import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectForm, {
  type ProjectFormData,
} from "../../components/layout/ProjectForm/ProjectForm";
import type { Member } from "../../components/ui/SearchBar/SearchBar";
import { projectService } from "../../services/projectService";

const ProjectNew = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (
    data: ProjectFormData,
    teamMembers: Member[],
    files: File[]
  ) => {
    try {
      setIsSubmitting(true);

      // Map form data to API payload
      const projectPayload = {
        title: data.projectName,
        description: data.description || undefined,
        course_id: data.course,
        project_type: data.projectType as "individual" | "group",
        essay_text: data.text || undefined,
        member_ids: teamMembers.map((m) => m.id),
        files: files.length > 0 ? files : undefined,
        status: "Draft" as const,
      };

      console.log("Submitting project:", projectPayload);

      const result = await projectService.createProject(projectPayload);

      console.log("Project created successfully:", result);
      alert("Project created successfully!");
      navigate("/project");
    } catch (error: unknown) {
      console.error("Failed to create project:", error);
      const errorMessage =
        (error as any)?.response?.data?.error?.message ||
        (error as Error)?.message ||
        "Failed to create project. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProjectForm
      isSubmitting={isSubmitting}
      isEditing={false}
      onSubmit={handleFormSubmit}
      onCancel={() => navigate("/project")}
    />
  );
};

export default ProjectNew;
