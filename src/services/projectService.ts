import { api } from "../lib/api";

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: string;
  email: string;
  display_name: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  status: "Processing" | "Completed" | "Failed";
  project_type?: "individual" | "group";
  course_id?: string;
  course_code?: string;
  submission_date?: string;
  interq_score?: number; // 1-3 scale average AI score
  ai_processing_status?: string; // pending | processing | completed | failed
  ai_processing_error?: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  members: ProjectMember[];
  latest_submission_id?: string | null;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  course_id: string;
  project_type: "individual" | "group";
  essay_text?: string;
  member_ids?: string[];
  files?: File[];
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  course_code?: string;
  submission_date?: string;
  settings?: Record<string, unknown>;
  member_ids?: string[];
}

interface ProjectsResponse {
  projects: Project[];
}

interface ProjectResponse {
  project: Project;
}

export interface CreateProjectResponse {
  project: Project;
  submission_id: string;
  message: string;
}

interface SubmitProjectResponse {
  project: Project;
  submission_id: string;
  message: string;
}

interface ResubmitProjectResponse {
  submission_id: string;
  iteration_number: number;
  previous_submission_id: string | null;
  message: string;
}

export interface SubmissionSummary {
  id: string;
  name: string;
  iteration_number: number;
  submitted_at: string;
  submitted_by_id?: string;
  submitted_by_name?: string;
  ai_processing_status: string;
  ai_overall_summary?: string;
  ai_estimated_level?: string;
  previous_submission_id?: string;
  comparison_analysis?: ComparisonAnalysis;
  avg_score?: number;
}

export interface DimensionComparison {
  dimension_id: number;
  dimension_name: string;
  previous_score: number;
  current_score: number;
  score_change: number;
  improvement_summary: string;
}

export interface ComparisonAnalysis {
  previous_submission_id: string;
  current_submission_id: string;
  overall_improvement: "improved" | "regressed" | "unchanged";
  previous_avg_score: number;
  current_avg_score: number;
  score_delta: number;
  dimension_comparisons: DimensionComparison[];
  summary: string;
  key_improvements: string[];
  key_regressions: string[];
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const data = await api.get<ProjectsResponse>("/projects");
    return data.projects;
  },

  async getProject(id: string): Promise<Project> {
    const data = await api.get<ProjectResponse>(`/projects/${id}`);
    return data.project;
  },

  async createProject(
    projectData: CreateProjectData,
  ): Promise<CreateProjectResponse> {
    // Build FormData for multipart/form-data request with files
    const formData = new FormData();
    formData.append("title", projectData.title);
    formData.append("course_id", projectData.course_id);
    formData.append("project_type", projectData.project_type);

    if (projectData.description) {
      formData.append("description", projectData.description);
    }
    if (projectData.essay_text) {
      formData.append("essay_text", projectData.essay_text);
    }
    if (projectData.member_ids && projectData.member_ids.length > 0) {
      formData.append("member_ids", JSON.stringify(projectData.member_ids));
    }
    if (projectData.files && projectData.files.length > 0) {
      projectData.files.forEach((file) => {
        formData.append("files", file);
      });
    }

    // Send FormData without custom headers (browser will set Content-Type correctly)
    const data = await api.post<CreateProjectResponse>("/projects", formData);
    return data;
  },

  async updateProject(
    id: string,
    projectData: UpdateProjectData,
  ): Promise<Project> {
    const data = await api.put<ProjectResponse>(`/projects/${id}`, projectData);
    return data.project;
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  async submitProject(
    id: string,
  ): Promise<{ project: Project; submission_id: string; message: string }> {
    const data = await api.post<SubmitProjectResponse>(
      `/projects/${id}/submit`,
      {},
    );
    return data;
  },

  async resubmitProject(
    id: string,
    essayText?: string,
    files?: File[],
  ): Promise<ResubmitProjectResponse> {
    // Use FormData to support file uploads
    const formData = new FormData();

    if (essayText) {
      formData.append("essay_text", essayText);
    }

    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    // Send FormData without custom Content-Type header (browser sets it with boundary)
    const data = await api.post<ResubmitProjectResponse>(
      `/projects/${id}/resubmit`,
      formData,
    );
    return data;
  },

  async getProjectSubmissions(
    projectId: string,
  ): Promise<{ submissions: SubmissionSummary[]; total_count: number }> {
    const data = await api.get<{
      submissions: SubmissionSummary[];
      total_count: number;
    }>(`/projects/${projectId}/submissions`);
    return data;
  },

  async getSubmissionFeedback(submissionId: string): Promise<{
    submission: {
      id: string;
      project_id: string;
      project_title: string;
      name: string;
      submitted_at: string;
      ai_processing_status: string;
      ai_processing_error?: string;
      ai_overall_summary?: string;
      ai_overall_strengths?: string[];
      ai_priority_improvements?: string[];
      ai_estimated_level?: string;
    };
    dimensions: Array<{
      dimension_id: number;
      dimension_label: string;
      dimension_variant: string;
      ai_score?: number;
      ai_reasoning?: string;
      ai_strengths?: string[];
      ai_improvements?: string[];
      ai_examples?: string;
      ai_processing_status: string;
      personal_score: number;
    }>;
  }> {
    interface SubmissionData {
      id: string;
      project_id: string;
      project_title: string;
      name: string;
      submitted_at: string;
      ai_processing_status: string;
      ai_processing_error?: string;
      ai_overall_summary?: string;
      ai_overall_strengths?: string[];
      ai_priority_improvements?: string[];
      ai_estimated_level?: string;
    }
    interface DimensionData {
      dimension_id: number;
      dimension_label: string;
      dimension_variant: string;
      ai_score?: number;
      ai_reasoning?: string;
      ai_strengths?: string[];
      ai_improvements?: string[];
      ai_examples?: string;
      ai_processing_status: string;
      personal_score: number;
    }
    const data = await api.get<{
      success: boolean;
      data: {
        submission: SubmissionData;
        dimensions: DimensionData[];
      };
    }>(`/projects/submissions/${submissionId}/feedback`);
    return data.data;
  },
};
