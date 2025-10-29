import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { saveTokens, clearTokens } from "../lib/api";

interface User {
  id: string;
  email: string;
  display_name?: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

const BYPASS_AUTH =
  (import.meta.env.VITE_BYPASS_AUTH ?? "").toLowerCase() === "true";

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

const createBypassUser = (overrides: Partial<User> = {}): User => ({
  id: "dev-bypass",
  email: import.meta.env.VITE_BYPASS_USER_EMAIL || "developer@ila.dev",
  display_name: import.meta.env.VITE_BYPASS_USER_NAME || "Developer User",
  role: import.meta.env.VITE_BYPASS_USER_ROLE || "admin",
  ...overrides,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(BYPASS_AUTH);
  const [user, setUser] = useState<User | null>(
    BYPASS_AUTH ? createBypassUser() : null
  );
  const [loading, setLoading] = useState<boolean>(!BYPASS_AUTH);
  const [isInitialized, setIsInitialized] = useState<boolean>(BYPASS_AUTH);
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Logout function
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    clearTokens();
    
    // Clear inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Redirect to login
    window.location.href = "/login";
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    inactivityTimerRef.current = setTimeout(() => {
      console.log("User inactive for 1 hour, logging out...");
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [logout]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated || BYPASS_AUTH) return;

    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Set up activity listeners
    activities.forEach(activity => {
      window.addEventListener(activity, handleActivity);
    });

    // Start initial timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      activities.forEach(activity => {
        window.removeEventListener(activity, handleActivity);
      });
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // Check if user is already logged in on app start
  useEffect(() => {
    if (BYPASS_AUTH) {
      return;
    }

    const checkAuthStatus = async () => {
      const token = localStorage.getItem("ila-token");
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setIsAuthenticated(true);
              setUser(data.data.user);
            } else {
              // Token is invalid, clear it
              clearTokens();
            }
          } else {
            // Token is invalid, clear it
            clearTokens();
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          // Clear invalid tokens
          clearTokens();
        }
      }
      setLoading(false);
      setIsInitialized(true);
    };
    
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (BYPASS_AUTH) {
      setIsAuthenticated(true);
      setUser(
        createBypassUser({
          email,
          display_name:
            import.meta.env.VITE_BYPASS_USER_NAME ||
            (email ? email.split("@")[0] : undefined),
        })
      );
      setLoading(false);
      setIsInitialized(true);
      return true;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { user: userData, token, refreshToken } = data.data;

        setIsAuthenticated(true);
        setUser(userData);

        // Save tokens using centralized function
        saveTokens(token, refreshToken);

        return true;
      } else {
        console.error("Login failed:", data.error?.message || "Unknown error");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    user,
    loading,
    isInitialized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
