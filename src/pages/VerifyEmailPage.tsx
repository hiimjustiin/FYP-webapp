import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OwlIconWhite from "../assets/icons/owl_white.svg";
import Button from "../components/ui/Button/Button";
import { api } from "../lib/api";

// Type definitions for API responses
interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

interface VerifyOTPDataPayload {
  message: string;
  user: User;
  token: string;
  refreshToken: string;
}

interface ResendOTPDataPayload {
  message: string;
}

const VerifyEmailPage: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [canResend, setCanResend] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from navigation state
  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear error when user starts typing
    if (error) setError("");
    if (success) setSuccess("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5 && newOtp.every((digit) => digit !== "")) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle paste
    if (e.key === "v" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6).split("");
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit;
        });
        setOtp(newOtp);

        // Focus last filled input
        const lastIndex = Math.min(digits.length, 5);
        inputRefs.current[lastIndex]?.focus();

        // Auto-submit if all digits filled
        if (newOtp.every((digit) => digit !== "")) {
          handleVerifyOTP(newOtp.join(""));
        }
      });
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp.join("");

    if (codeToVerify.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await api.post<VerifyOTPDataPayload>("/auth/verify-otp", {
        email,
        otp: codeToVerify,
      });

      setSuccess("Email verified successfully! Redirecting...");

      // Store token
      const { token, refreshToken, user } = data;
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: unknown) {
      console.error("OTP verification error:", err);
      const errorMessage = (err as { message?: string })?.message;
      setError(errorMessage || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post<ResendOTPDataPayload>("/auth/resend-otp", { email });

      setSuccess("OTP has been resent to your email!");
      setCanResend(false);
      setCountdown(60); // 60 seconds cooldown
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      console.error("Resend OTP error:", err);
      const errorMessage = (err as { message?: string })?.message;
      setError(errorMessage || "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-gradient-blue">
      {/* Left Panel: Branding */}
      <div className="hidden lg:flex lg:w-5/8 flex-col justify-between px-20 pt-24 pb-14 relative">
        <div className="flex flex-col max-w-3xl items-start space-y-6">
          <img src={OwlIconWhite} alt="ILA Logo" className="w-32 h-32" />
          <h1
            className="heading-3 text-white"
            style={{ fontWeight: "bold", lineHeight: 1 }}
          >
            Almost there!
          </h1>
          <div className="body-1 text-white">
            <p>We've sent a verification code to your email.</p>
            <p>
              Please check your inbox and enter the code to complete your
              registration.
            </p>
          </div>
        </div>
        <footer className="body-2 text-white">
          &lt; &copy; 2025 Copyright Info &gt;
        </footer>
      </div>

      {/* Right Panel: OTP Form */}
      <div className="w-full lg:w-3/8 flex items-center justify-center p-8 bg-white backdrop-blur-sm">
        <div className="max-w-2xl w-full">
          <div className="space-y-10">
            <div>
              <h2
                className="heading-4"
                style={{ fontWeight: "bold", lineHeight: 1 }}
              >
                Verify Your Email
              </h2>
              <p className="mt-4 body-2 text-gray-600">
                We've sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-8">
              {/* Error/Success Messages */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-800">{success}</div>
                </div>
              )}

              {/* OTP Input */}
              <div>
                <label className="block subtitle-3 mb-4">
                  Enter Verification Code
                </label>
                <div className="flex gap-3 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isLoading}
                      className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-100"
                      style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                      }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-center text-sm text-gray-500">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {/* Verify Button */}
              <Button
                type="button"
                variant="darkBlue"
                className="w-full flex justify-center"
                onClick={() => handleVerifyOTP()}
                disabled={isLoading || otp.some((d) => d === "")}
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResendOTP}
                  disabled={!canResend || isLoading}
                  className={`text-sm font-medium ${
                    canResend && !isLoading
                      ? "text-blue-600 hover:text-blue-700 cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                  style={{ background: "none", border: "none", padding: 0 }}
                >
                  {canResend ? "Resend Code" : `Resend in ${countdown}s`}
                </button>
              </div>

              {/* Back to Registration */}
              <div className="text-center pt-4 border-t">
                <button
                  onClick={() => navigate("/register")}
                  className="text-sm text-gray-600 hover:text-gray-800"
                  style={{ background: "none", border: "none", padding: 0 }}
                >
                  ← Back to Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VerifyEmailPage;
