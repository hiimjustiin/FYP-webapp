import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import OwlIconWhite from "../assets/icons/owl_white.svg";
import InputField from "../components/ui/InputField/InputField";
import Button from "../components/ui/Button/Button";
import GoogleIcon from "../assets/icons/google_icon.svg";
import { authService } from "../services/authService";

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    school: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Individual field errors
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    school: "",
    password: "",
    confirmPassword: "",
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string): string => {
    if (!email) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email address";
    }
    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return "";
  };

  const validateConfirmPassword = (
    confirmPassword: string,
    password: string
  ): string => {
    if (!confirmPassword) {
      return "Please confirm your password";
    }
    if (confirmPassword !== password) {
      return "Passwords do not match";
    }
    return "";
  };

  const validateRequired = (value: string, fieldName: string): string => {
    if (!value.trim()) {
      return `${fieldName} is required`;
    }
    return "";
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear general error when user starts typing
    if (error) setError("");

    // Validate field and update error state
    let fieldError = "";
    switch (field) {
      case "firstName":
        fieldError = validateRequired(value, "Given name");
        break;
      case "lastName":
        fieldError = validateRequired(value, "Last name");
        break;
      case "email":
        fieldError = validateEmail(value);
        break;
      case "school":
        fieldError = validateRequired(value, "School");
        break;
      case "password":
        fieldError = validatePassword(value);
        // Also revalidate confirm password if it exists
        if (formData.confirmPassword) {
          setFieldErrors((prev) => ({
            ...prev,
            confirmPassword: validateConfirmPassword(
              formData.confirmPassword,
              value
            ),
          }));
        }
        break;
      case "confirmPassword":
        fieldError = validateConfirmPassword(value, formData.password);
        break;
    }

    setFieldErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const errors = {
      firstName: validateRequired(formData.firstName, "Given name"),
      lastName: validateRequired(formData.lastName, "Last name"),
      email: validateEmail(formData.email),
      school: validateRequired(formData.school, "School"),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(
        formData.confirmPassword,
        formData.password
      ),
    };

    setFieldErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call the registration API
      const result = await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        school: formData.school,
      });

      if (result.success) {
        // Auto-login after successful registration
        const success = await login(formData.email, formData.password);
        if (success) {
          navigate("/");
        } else {
          setError(
            "Registration successful but auto-login failed. Please login manually."
          );
          // Redirect to login page after 2 seconds
          setTimeout(() => navigate("/login"), 2000);
        }
      } else {
        setError(result.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // TODO: Add your Google OAuth registration logic here
    console.log("Registering with Google...");
    alert("Google registration not implemented yet.");
  };

  return (
    <main className="flex min-h-screen bg-gradient-blue">
      {/* Left Panel: Branding & Information */}
      <div className="hidden lg:flex lg:w-5/8 flex-col justify-between px-20 pt-24 pb-14 relative">
        <div className="flex flex-col max-w-3xl items-start space-y-6">
          <img src={OwlIconWhite} alt="ILA Logo" className="w-32 h-32" />
          <h1
            className="heading-3 text-white"
            style={{
              fontWeight: "bold",
              lineHeight: 1,
            }}
          >
            Welcome to Interdisciplinary Learning Analytics (ILA)!
          </h1>
          <div className="body-1 text-white">
            <p> Engage in interdisciplinary learning seamlessly. </p>
            <p>
              We provide feedback for your interdisciplinary natured essays
              within seconds.
            </p>
          </div>
        </div>
        <footer className="body-2 text-white">
          &lt; &copy; 2025 Copyright Info &gt;
        </footer>
      </div>

      {/* Right Panel: Registration Form */}
      <div className="w-full lg:w-3/8 flex items-center justify-center p-8 bg-white backdrop-blur-sm">
        <div className="max-w-2xl w-full">
          <div className="space-y-10">
            <h2
              className="heading-4"
              style={{
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              Registration
            </h2>

            <div className="space-y-8">
              <div>
                <p
                  className="subtitle-3"
                  style={{ fontSize: "16px", color: "var(--color-grey-55)" }}
                >
                  Already have an account?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="button hover:text-blue-500 underline text-black"
                    style={{
                      fontSize: "16px",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Login
                  </button>
                </p>
              </div>

              <form className="mt-8" onSubmit={handleRegisterSubmit}>
                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-4">
                    <div className="text-sm text-red-800">{error}</div>
                  </div>
                )}

                {/* Two Column Layout for Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="h-20">
                    <InputField
                      type="text"
                      value={formData.firstName}
                      onChange={(value) =>
                        handleFieldChange("firstName", value)
                      }
                      placeholder="e.g. Jun Jie"
                      label="Given Name"
                      disabled={isLoading}
                      autoComplete="given-name"
                      error={fieldErrors.firstName}
                      required
                    />
                  </div>

                  <div className="h-20">
                    <InputField
                      type="text"
                      value={formData.lastName}
                      onChange={(value) => handleFieldChange("lastName", value)}
                      placeholder="e.g. Tan"
                      label="Last Name"
                      disabled={isLoading}
                      autoComplete="family-name"
                      error={fieldErrors.lastName}
                      required
                    />
                  </div>
                </div>

                {/* Two Column Layout for Email and School */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="h-20">
                    <InputField
                      type="email"
                      value={formData.email}
                      onChange={(value) => handleFieldChange("email", value)}
                      placeholder="example@email.com"
                      label="Email"
                      disabled={isLoading}
                      autoComplete="email"
                      error={fieldErrors.email}
                      required
                    />
                  </div>

                  <div className="h-20">
                    <InputField
                      type="text"
                      value={formData.school}
                      onChange={(value) => handleFieldChange("school", value)}
                      placeholder="NTU / SMU / SUSS"
                      label="School"
                      disabled={isLoading}
                      autoComplete="organization"
                      error={fieldErrors.school}
                      required
                    />
                  </div>
                </div>

                {/* Two Column Layout for Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  <div className="h-24">
                    <InputField
                      type="password"
                      value={formData.password}
                      onChange={(value) => handleFieldChange("password", value)}
                      placeholder="Password"
                      label="Password"
                      disabled={isLoading}
                      showPasswordToggle={true}
                      autoComplete="new-password"
                      error={fieldErrors.password}
                      required
                    />
                  </div>

                  <div className="h-24">
                    <InputField
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(value) =>
                        handleFieldChange("confirmPassword", value)
                      }
                      placeholder="Confirm Password"
                      label="Confirm password"
                      disabled={isLoading}
                      showPasswordToggle={true}
                      autoComplete="new-password"
                      error={fieldErrors.confirmPassword}
                      required
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <Button
                    type="submit"
                    variant="darkBlue"
                    className="w-full flex justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </Button>

                  <Button
                    type="button"
                    variant="white"
                    className="w-full gap-3 flex justify-center"
                    onClick={handleGoogleRegister}
                    disabled={isLoading}
                  >
                    <img
                      src={GoogleIcon}
                      alt="Google Icon"
                      className="w-6 h-6"
                    />
                    Sign up with Google
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
