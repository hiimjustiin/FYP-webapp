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
  status:
    | "Draft"
    | "Submitted"
    | "Completed"
    | "active"
    | "completed"
    | "archived";
  course_code?: string;
  submission_date?: string;
  interq_score?: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  members: ProjectMember[];
}

export interface CreateProjectData {
  title: string;
  description?: string;
  status?: "Draft" | "Submitted" | "Completed";
  course_id: string;
  project_type: "individual" | "group";
  essay_text?: string;
  member_ids?: string[];
  files?: File[];
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  status?: "Draft" | "Submitted" | "Completed";
  course_code?: string;
  submission_date?: string;
  interq_score?: string;
  settings?: Record<string, unknown>;
}

interface ProjectsResponse {
  projects: Project[];
}

interface ProjectResponse {
  project: Project;
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

  async createProject(projectData: CreateProjectData): Promise<Project> {
    // Build FormData for multipart/form-data request with files
    const formData = new FormData();
    formData.append("title", projectData.title);
    formData.append("course_id", projectData.course_id);
    formData.append("project_type", projectData.project_type);
    
    if (projectData.description) {
      formData.append("description", projectData.description);
    }
    if (projectData.status) {
      formData.append("status", projectData.status);
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

    const data = await api.post<ProjectResponse>("/projects", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data.project;
  },

  async updateProject(
    id: string,
    projectData: UpdateProjectData
  ): Promise<Project> {
    const data = await api.put<ProjectResponse>(`/projects/${id}`, projectData);
    return data.project;
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};
