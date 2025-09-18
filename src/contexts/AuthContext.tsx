import React, { createContext, useContext, useState, useEffect } from "react";

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
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user is already logged in on app start
  useEffect(() => {
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
              localStorage.removeItem("ila-token");
              localStorage.removeItem("ila-refresh-token");
            }
          } else {
            // Token is invalid, clear it
            localStorage.removeItem("ila-token");
            localStorage.removeItem("ila-refresh-token");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          // Clear invalid tokens
          localStorage.removeItem("ila-token");
          localStorage.removeItem("ila-refresh-token");
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
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

        // Save tokens to localStorage
        localStorage.setItem("ila-token", token);
        if (refreshToken) {
          localStorage.setItem("ila-refresh-token", refreshToken);
        }

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
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("ila-token");
    localStorage.removeItem("ila-refresh-token");
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
