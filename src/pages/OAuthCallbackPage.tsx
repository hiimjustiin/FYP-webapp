import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveTokens } from "../lib/api";

const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      let errorMessage = "Authentication failed. Please try again.";
      
      switch (errorParam) {
        case "oauth_failed":
          errorMessage = "Google authentication was cancelled or failed.";
          break;
        case "token_exchange_failed":
          errorMessage = "Failed to exchange authorization code. Please try again.";
          break;
        case "no_email":
          errorMessage = "Your Google account must have an email address.";
          break;
        case "no_user_id":
          errorMessage = "Failed to retrieve your Google user ID. Please try again.";
          break;
        case "server_error":
          errorMessage = "Server error during authentication. Please try again.";
          break;
      }

      setError(errorMessage);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      return;
    }

    if (token && refreshToken) {
      // Save tokens
      saveTokens(token, refreshToken);
      
      // Redirect to home (AuthContext will pick up tokens automatically)
      window.location.href = "/";
    } else {
      setError("Missing authentication tokens.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-blue">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">⚠️</div>
            <h2 className="heading-5 mb-4">Authentication Error</h2>
            <p className="body-2 text-gray-600 mb-4">{error}</p>
            <p className="body-3 text-gray-500">Redirecting to login...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-blue">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="heading-5 mb-2">Completing sign in...</h2>
          <p className="body-3 text-gray-500">Please wait</p>
        </div>
      </div>
    </main>
  );
};

export default OAuthCallbackPage;
