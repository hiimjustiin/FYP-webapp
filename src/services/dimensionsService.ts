import { api } from "../lib/api";

// Type definitions
export type Variant =
  | "lime"
  | "yellow"
  | "purple"
  | "teal"
  | "blue"
  | "grey"
  | "green"
  | "navy"
  | "pink";

export interface Dimension {
  id: number;
  label: string;
  variant: Variant;
  display_order: number;
}

export interface DimensionScore {
  personal: number;
  classAvg: number;
}

export interface Submission {
  id: string;
  name: string;
  date: string;
  scores: Record<string, DimensionScore>;
}

export interface Project {
  id: string;
  name: string;
  date: string;
  summary: string;
}

export interface ProjectWithSubmissions {
  project: Project;
  submissions: Submission[];
}

export interface ProjectListItem {
  id: string;
  name: string;
  summary: string;
  date: string;
  submission_count: number;
}

// API response types
interface DimensionsResponse {
  dimensions: Dimension[];
}

interface ProjectSubmissionsResponse {
  project: Project | null;
  submissions: Submission[];
}

interface ProjectsResponse {
  projects: ProjectListItem[];
}

// Service functions
export const dimensionsService = {
  /**
   * Get all dimensions (static catalog data)
   */
  async getDimensions(): Promise<Dimension[]> {
    const data = await api.get<DimensionsResponse>("/dimensions");
    return data.dimensions;
  },

  /**
   * Get all submissions with scores for a specific project
   */
  async getProjectSubmissions(projectId: string): Promise<ProjectWithSubmissions> {
    const data = await api.get<ProjectSubmissionsResponse>(
      `/dimensions/projects/${projectId}/submissions`
    );
    
    // Return empty structure if no project found
    if (!data.project) {
      return {
        project: {
          id: projectId,
          name: "",
          date: new Date().toISOString(),
          summary: "",
        },
        submissions: [],
      };
    }

    return {
      project: data.project,
      submissions: data.submissions,
    };
  },

  /**
   * Get all projects for the current user
   */
  async getProjects(): Promise<ProjectListItem[]> {
    const data = await api.get<ProjectsResponse>("/dimensions/projects");
    return data.projects;
  },
};
