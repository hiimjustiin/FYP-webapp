// API configuration and utilities

// Determine API base URL based on environment
// This function is used by both api.ts and AuthContext.tsx
export const getAPIBaseURL = (): string => {
  const configUrl = import.meta.env.VITE_API_BASE_URL;

  // If VITE_API_BASE_URL is explicitly set, use it
  if (configUrl) {
    // If it's a relative path like /api, it will use the current origin's proxy
    // If it's an absolute URL like http://..., use it directly
    return configUrl.startsWith("http") ? configUrl : configUrl;
  }

  // Fallback for when env var is not set
  return "http://localhost:3001/api";
};

const API_BASE_URL = getAPIBaseURL();

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

// Token management utilities
const TOKEN_KEY = "ila-token";
const REFRESH_TOKEN_KEY = "ila-refresh-token";
const TOKEN_EXPIRY_KEY = "ila-token-expiry";

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get refresh token from localStorage
const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Save tokens to localStorage
export const saveTokens = (token: string, refreshToken: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  // Decode JWT to get expiry time
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    localStorage.setItem(TOKEN_EXPIRY_KEY, payload.exp.toString());
  } catch (e) {
    console.error("Failed to decode token:", e);
  }
};

// Clear all tokens
export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// Check if token is expired or will expire soon (within 5 minutes)
const isTokenExpiringSoon = (): boolean => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;

  const expiryTime = parseInt(expiry) * 1000; // Convert to milliseconds
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return expiryTime - now < fiveMinutes;
};

// Refresh token function
let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = async (): Promise<boolean> => {
  // If already refreshing, return existing promise
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data: ApiResponse<{
        token: string;
        refreshToken: string;
      }> = await response.json();

      if (response.ok && data.success && data.data) {
        saveTokens(data.data.token, data.data.refreshToken);
        return true;
      } else {
        clearTokens();
        return false;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Create authenticated request headers
const getAuthHeaders = (isFormData: boolean = false): HeadersInit => {
  const token = getAuthToken();
  if (isFormData) {
    // FormData - don't set Content-Type, browser will set it with boundary
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }
  // JSON request
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API request function with auto-retry on 401
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  // Check if token is expiring soon and refresh proactively
  if (retryCount === 0 && isTokenExpiringSoon()) {
    await refreshAccessToken();
  }

  const config: RequestInit = {
    headers: getAuthHeaders(isFormData),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && retryCount === 0) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        // Retry the request with new token
        return apiRequest<T>(endpoint, options, retryCount + 1);
      } else {
        // Refresh failed, redirect to login
        window.location.href = "/login";
        throw new ApiError("Session expired. Please login again.", 401);
      }
    }

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
      body:
        data instanceof FormData
          ? data
          : data
          ? JSON.stringify(data)
          : undefined,
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

export { ApiError };
export default api;
