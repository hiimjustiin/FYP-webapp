import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectForm, {
  type ProjectFormData,
} from "../../components/layout/ProjectForm/ProjectForm";
import type { Member } from "../../components/ui/SearchBar/SearchBar";

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

      console.log("Submitting project:", projectPayload);
      // const result = await projectService.createProject(projectPayload);

      // Show success message
      alert("Project created successfully!");
      navigate("/project");
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
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
