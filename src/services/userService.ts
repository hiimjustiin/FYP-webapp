import { api } from "../lib/api";

export interface User {
  id: string;
  email: string;
  display_name?: string;
  role: string;
  bio?: string;
  phone?: string;
  department?: string;
  student_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserData {
  display_name?: string;
  bio?: string;
  phone?: string;
  department?: string;
  student_id?: string;
}

interface UserResponse {
  user: User;
}

export const userService = {
  async getCurrentUser(): Promise<User> {
    const data = await api.get<UserResponse>("/auth/me");
    return data.user;
  },

  async getUser(id: string): Promise<User> {
    const data = await api.get<UserResponse>(`/users/${id}`);
    return data.user;
  },

  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const data = await api.put<UserResponse>(`/users/${id}`, userData);
    return data.user;
  },
};
