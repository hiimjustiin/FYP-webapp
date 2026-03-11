import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertDialog } from "../../components/ui/AlertDialog/AlertDialog";
import ProjectForm, {
  type ProjectFormData,
} from "../../components/layout/ProjectForm/ProjectForm";
import type { Member } from "../../components/ui/SearchBar/SearchBar";
import { projectService } from "../../services/projectService";
import { waitForSubmissionProcessing } from "../../services/submissionProcessingService";

const ProjectNew = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const activeWaitSessionRef = useRef(0);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleCloseProcessingDialog = () => {
    activeWaitSessionRef.current += 1;
    setIsProcessingDialogOpen(false);
    navigate("/project");
  };

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
      };

      console.log("Submitting project for AI evaluation:", projectPayload);

      const result = await projectService.createProject(projectPayload);
      const waitSession = activeWaitSessionRef.current + 1;
      activeWaitSessionRef.current = waitSession;

      console.log("Project created and submitted for AI evaluation:", result);
      setIsProcessingDialogOpen(true);

      await waitForSubmissionProcessing(result.submission_id, {
        timeoutMs: 60000,
      });

      if (
        !isMountedRef.current ||
        activeWaitSessionRef.current !== waitSession
      ) {
        return;
      }

      navigate(`/projects/${result.project.id}`);
    } catch (error: unknown) {
      console.error("Failed to create project:", error);
      interface ErrorResponse {
        response?: { data?: { error?: { message?: string } } };
      }
      const errorMessage =
        (error as ErrorResponse)?.response?.data?.error?.message ||
        (error as Error)?.message ||
        "Failed to create project. Please try again.";
      alert(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsProcessingDialogOpen(false);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <>
      <ProjectForm
        isSubmitting={isSubmitting}
        isEditing={false}
        onSubmit={handleFormSubmit}
        onCancel={() => navigate("/project")}
      />
      <AlertDialog
        isOpen={isProcessingDialogOpen}
        type="loading"
        title="AI is processing your submission..."
        message="This usually takes 30-60 seconds. We'll take you to details once ready."
        showCloseButton
        onClose={handleCloseProcessingDialog}
      />
    </>
  );
};

export default ProjectNew;
