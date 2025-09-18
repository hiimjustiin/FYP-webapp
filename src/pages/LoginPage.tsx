import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import OwlIconWhite from "../assets/icons/owl_white.svg";
import InputField from "../components/ui/InputField/InputField";
import Button from "../components/ui/Button/Button";
import GoogleIcon from "../assets/icons/google_icon.svg";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Individual field errors
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string): string => {
    if (!email) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
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

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
    if (error) setError("");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(validatePassword(value));
    if (error) setError("");
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);

    if (emailValidationError || passwordValidationError) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/");
      } else {
        setError("Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Add your Google OAuth logic here
    console.log("Logging in with Google...");
    alert("Google login not implemented yet.");
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
          <p className="body-1 text-white">
            <p> Engage in interdisciplinary learning seamlessly. </p>
            <p>
              We provide feedback for your interdisciplinary natured essays
              within seconds.
            </p>
          </p>
        </div>
        <footer className="body-2 text-white">
          &lt; &copy; 2025 Copyright Info &gt;
        </footer>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-3/8 flex items-center justify-center p-8 bg-white backdrop-blur-sm">
        <div className="max-w-xs w-full">
          <div className="space-y-10">
            <h2
              className="heading-4"
              style={{
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              Interdisciplinary Learning Analytics
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="heading-6">Welcome Back!</h3>
                <p className="subtitle-3" style={{ fontSize: "14px" }}>
                  Don't have an account?{" "}
                  <a
                    href="#"
                    className="button hover:text-blue-500"
                    style={{
                      fontSize: "14px",
                      textDecoration: "underline",
                    }}
                  >
                    Create a new account now
                  </a>
                  <a>.</a>
                </p>
              </div>

              <form className="mt-8" onSubmit={handleLoginSubmit}>
                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-4">
                    <div className="text-sm text-red-800">{error}</div>
                  </div>
                )}

                <div>
                  <div className="h-20">
                    <InputField
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="username@email.com"
                      disabled={isLoading}
                      autoComplete="email"
                      error={emailError}
                      required
                    />
                  </div>

                  <div className="h-20">
                    <InputField
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Password"
                      disabled={isLoading}
                      showPasswordToggle={true}
                      autoComplete="current-password"
                      error={passwordError}
                      required
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <Button
                    type="submit"
                    variant="darkBlue"
                    className="w-full flex justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login Now"}
                  </Button>
                </div>
              </form>

              <Button
                variant="white"
                className="w-full gap-3 -mt-5 flex justify-center"
                onClick={handleGoogleLogin}
              >
                <img src={GoogleIcon} alt="Google Icon" className="w-6 h-6" />
                Login with Google
              </Button>

              <div className="text-center">
                <p className="subtitle-3" style={{ color: 'var(--color-grey-55)' }}>
                  Forget password
                  <a
                    className="button hover:text-blue-500 text-black underline ml-2"
                    href="#"
                  >
                    Click here
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
