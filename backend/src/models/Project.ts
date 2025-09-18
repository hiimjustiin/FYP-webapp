export interface Project {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  status: "active" | "completed" | "archived";
  settings?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  owner_id: string;
  status?: "active" | "completed" | "archived";
  settings?: Record<string, unknown>;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: "active" | "completed" | "archived";
  settings?: Record<string, unknown>;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  joined_at: Date;
}

export interface ProjectWithMembers extends Project {
  members: (ProjectMember & {
    user: {
      id: string;
      email: string;
      display_name?: string;
    };
  })[];
}
