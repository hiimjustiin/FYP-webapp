// API configuration and utilities

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: unknown[];
  };
  message?: string;
}

class ApiError extends Error {
  public statusCode: number;
  public details?: unknown[];

  constructor(message: string, statusCode: number, details?: unknown[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem("ila-token");
};

// Create authenticated request headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API request function
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || `HTTP ${response.status}`,
        response.status,
        data.error?.details
      );
    }

    if (!data.success) {
      throw new ApiError(
        data.error?.message || "Request failed",
        response.status,
        data.error?.details
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      0
    );
  }
};

// Convenience methods for different HTTP verbs
export const api = {
  get: <T = unknown>(endpoint: string): Promise<T> =>
    apiRequest<T>(endpoint, { method: "GET" }),

  post: <T = unknown>(endpoint: string, data?: unknown): Promise<T> =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = unknown>(endpoint: string, data?: unknown): Promise<T> =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = unknown>(endpoint: string, data?: unknown): Promise<T> =>
    apiRequest<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = unknown>(endpoint: string): Promise<T> =>
    apiRequest<T>(endpoint, { method: "DELETE" }),
};

// API endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    me: "/auth/me",
  },

  // Users
  users: {
    list: "/users",
    byId: (id: string) => `/users/${id}`,
  },

  // Projects
  projects: {
    list: "/projects",
    byId: (id: string) => `/projects/${id}`,
    create: "/projects",
    update: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
  },

  // Essays
  essays: {
    list: "/essays",
    byId: (id: string) => `/essays/${id}`,
    create: "/essays",
    update: (id: string) => `/essays/${id}`,
    delete: (id: string) => `/essays/${id}`,
  },
};

export { ApiError };
export default api;
