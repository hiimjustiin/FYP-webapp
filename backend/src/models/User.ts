export interface User {
  id: string;
  email: string;
  email_verified?: Date;
  password_hash?: string;
  display_name?: string;
  role: "student" | "instructor" | "admin";
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password?: string;
  display_name?: string;
  role?: "student" | "instructor" | "admin";
  avatar_url?: string;
}

export interface UpdateUserInput {
  display_name?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  role: string;
  avatar_url?: string;
  created_at: Date;
}

export interface OAuthAccount {
  id: string;
  provider: string;
  provider_account_id: string;
  user_id: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}
