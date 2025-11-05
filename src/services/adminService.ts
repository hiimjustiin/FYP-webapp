import { api } from "../lib/api";

export interface AdminStats {
  users: {
    total: number;
    byRole: {
      student?: number;
      instructor?: number;
      admin?: number;
    };
  };
  courses: number;
  projects: number;
  submissions: {
    total: number;
    byStatus: {
      submitted?: number;
      scoring?: number;
      scored?: number;
      reviewed?: number;
    };
  };
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: "student" | "instructor" | "admin";
  is_active: boolean;
  created_at: string;
  student_id?: string;
  department?: string;
  phone?: string;
}

export interface AdminCourse {
  id: string;
  code: string;
  title: string;
  description: string;
  instructor_id: string;
  instructor_name: string;
  instructor_email: string;
  term: string;
  passcode?: string;
  enrollment_count: number;
  submission_count: number;
  created_at: string;
}

export interface AdminSubmission {
  id: string;
  user_id: string;
  project_id: string;
  course_id: string;
  student_name: string;
  student_email: string;
  project_title: string;
  course_title: string;
  course_code: string;
  status: string;
  file_url: string;
  submitted_at: string;
  scores_count: number;
}

export interface Instructor {
  id: string;
  email: string;
  display_name: string;
}

export interface PaginationResult<T> {
  items: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminService = {
  // Dashboard
  async getDashboardStats(): Promise<AdminStats> {
    const data = await api.get<{ stats: AdminStats }>("/admin/dashboard");
    return data.stats;
  },

  // User management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<PaginationResult<AdminUser[]>> {
    const queryString = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params || {})
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    const data = await api.get<{
      users: AdminUser[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/admin/users${queryString ? `?${queryString}` : ""}`);
    return { items: data.users, pagination: data.pagination };
  },

  async createUser(userData: {
    email: string;
    password: string;
    display_name?: string;
    role?: "student" | "instructor" | "admin";
    student_id?: string;
    department?: string;
    phone?: string;
  }): Promise<AdminUser> {
    const data = await api.post<{ user: AdminUser }>("/admin/users", userData);
    return data.user;
  },

  async updateUser(
    userId: string,
    updates: Partial<Omit<AdminUser, "id" | "email" | "created_at">>
  ): Promise<AdminUser> {
    const data = await api.put<{ user: AdminUser }>(
      `/admin/users/${userId}`,
      updates
    );
    return data.user;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  },

  // Course management
  async getCourses(): Promise<AdminCourse[]> {
    const data = await api.get<{ courses: AdminCourse[] }>("/admin/courses");
    return data.courses;
  },

  async createCourse(courseData: {
    code: string;
    title: string;
    description?: string;
    instructor_id?: string;
    term?: string;
    passcode?: string;
  }): Promise<AdminCourse> {
    const data = await api.post<{ course: AdminCourse }>(
      "/admin/courses",
      courseData
    );
    return data.course;
  },

  async updateCourse(
    courseId: string,
    updates: Partial<Omit<AdminCourse, "id" | "created_at">>
  ): Promise<AdminCourse> {
    const data = await api.put<{ course: AdminCourse }>(
      `/admin/courses/${courseId}`,
      updates
    );
    return data.course;
  },

  async deleteCourse(courseId: string): Promise<void> {
    await api.delete(`/admin/courses/${courseId}`);
  },

  // Submission management
  async getSubmissions(params?: {
    status?: string;
    courseId?: string;
  }): Promise<AdminSubmission[]> {
    const queryString = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params || {})
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    const data = await api.get<{ submissions: AdminSubmission[] }>(
      `/admin/submissions${queryString ? `?${queryString}` : ""}`
    );
    return data.submissions;
  },

  // Utility
  async getInstructors(): Promise<Instructor[]> {
    const data = await api.get<{ instructors: Instructor[] }>(
      "/admin/instructors"
    );
    return data.instructors;
  },
};
