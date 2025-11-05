import { useState } from "react";
import type { Course } from "../../../services/courseService";
import Button from "../Button/Button";
import InputField from "../InputField/InputField";

interface EnrollmentModalProps {
  course: Course | null;
  isOpen: boolean;
  isLoading: boolean;
  onEnroll: (passcode: string) => Promise<void>;
  onClose: () => void;
  errorMessage?: string;
}

const EnrollmentModal = ({
  course,
  isOpen,
  isLoading,
  onEnroll,
  onClose,
  errorMessage,
}: EnrollmentModalProps) => {
  const [passcode, setPasscode] = useState("");
  const [localError, setLocalError] = useState("");

  if (!isOpen || !course) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!passcode.trim()) {
      setLocalError("Passcode is required");
      return;
    }

    try {
      await onEnroll(passcode);
      setPasscode("");
    } catch (error) {
      console.error("Enrollment error:", error);
      // Error will be handled by parent component
    }
  };

  const displayError = errorMessage || localError;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Enroll in Course</h3>
          <p className="text-sm text-gray-600 mt-1">
            {course.title}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {course.description && (
            <p className="text-sm text-gray-700 mb-4">
              {course.description}
            </p>
          )}

          <div className="text-sm text-gray-600 mb-6 space-y-1">
            {course.instructor_name && (
              <p>
                <span className="font-medium">Instructor:</span>{" "}
                {course.instructor_name}
              </p>
            )}
            {course.term && (
              <p>
                <span className="font-medium">Term:</span> {course.term}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Passcode Input */}
            <div>
              <label htmlFor="passcode" className="block text-sm font-medium text-gray-700 mb-2">
                Course Passcode
              </label>
              <InputField
                id="passcode"
                type="password"
                placeholder="Enter course passcode"
                value={passcode}
                onChange={setPasscode}
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Passcode is case-sensitive
              </p>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-700">{displayError}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="grey"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="blue"
                onClick={handleSubmit}
                disabled={isLoading || !passcode.trim()}
                className="flex-1"
              >
                {isLoading ? "Enrolling..." : "Enroll"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentModal;
