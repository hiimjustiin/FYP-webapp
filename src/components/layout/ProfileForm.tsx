import { useState } from "react";
import { userService, type UpdateUserData } from "../../services/userService";
import InputField from "../ui/InputField/InputField";
import TextArea from "../ui/TextArea/TextArea";
import Button from "../ui/Button/Button";

interface ProfileFormProps {
  authUserId: string;
  authUserEmail: string;
  authUserRole?: string;
  initialData: UpdateUserData;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const ProfileForm = ({
  authUserId,
  authUserEmail,
  authUserRole,
  initialData,
  onSuccess,
  onError,
}: ProfileFormProps) => {
  const isStudent = authUserRole === "student";
  const [profileData, setProfileData] = useState<UpdateUserData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const handleInputChange = (field: keyof UpdateUserData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const clearFieldError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const errors: Record<string, string> = {};

    if (!profileData.display_name || profileData.display_name.trim() === "") {
      errors.display_name = "Display name is required";
    }

    // Student ID is only required for students
    if (
      isStudent &&
      (!profileData.student_id || profileData.student_id.trim() === "")
    ) {
      errors.student_id = "Student ID is required";
    }

    // Department is now optional for all roles

    // Validate phone format if provided
    if (profileData.phone) {
      const phoneRegex =
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(profileData.phone)) {
        errors.phone = "Invalid phone number format";
      }
    }

    if (profileData.bio && profileData.bio.length > 500) {
      errors.bio = "Bio cannot exceed 500 characters";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      onError("Please fill in all required fields and correct any errors");
      return;
    }

    setValidationErrors({});

    try {
      setIsSaving(true);

      // Clean up the data - remove empty strings for optional fields
      const cleanedData: UpdateUserData = {
        display_name: profileData.display_name,
      };

      if (profileData.bio?.trim()) {
        cleanedData.bio = profileData.bio;
      }

      if (profileData.phone?.trim()) {
        cleanedData.phone = profileData.phone;
      }

      if (profileData.department?.trim()) {
        cleanedData.department = profileData.department;
      }

      if (profileData.student_id?.trim()) {
        cleanedData.student_id = profileData.student_id;
      }

      await userService.updateUser(authUserId, cleanedData);
      onSuccess("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      onError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Email (read-only) */}
      <div>
        <label className="block caption mb-2 text-gray-700 font-medium">
          Email
        </label>
        <InputField
          type="email"
          value={authUserEmail}
          disabled
          className="w-full bg-gray-50"
        />
      </div>

      {/* Display Name */}
      <div>
        <label className="block caption mb-2 text-gray-700 font-medium">
          Display Name <span className="text-red-600">*</span>
        </label>
        <InputField
          type="text"
          placeholder="Enter your display name"
          value={profileData.display_name}
          onChange={(value) => {
            handleInputChange("display_name", value);
            clearFieldError("display_name");
          }}
          className={`w-full ${
            validationErrors.display_name ? "border-red-500" : ""
          }`}
        />
        {validationErrors.display_name && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.display_name}
          </p>
        )}
      </div>

      {/* Student ID - Only for students */}
      {isStudent && (
        <div>
          <label className="block caption mb-2 text-gray-700 font-medium">
            Student ID <span className="text-red-600">*</span>
          </label>
          <InputField
            type="text"
            placeholder="Enter your student ID"
            value={profileData.student_id}
            onChange={(value) => {
              handleInputChange("student_id", value);
              clearFieldError("student_id");
            }}
            className={`w-full ${
              validationErrors.student_id ? "border-red-500" : ""
            }`}
          />
          {validationErrors.student_id && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.student_id}
            </p>
          )}
        </div>
      )}

      {/* Department - Optional for all roles */}
      <div>
        <label className="block caption mb-2 text-gray-700 font-medium">
          Department
        </label>
        <InputField
          type="text"
          placeholder="Enter your department"
          value={profileData.department}
          onChange={(value) => {
            handleInputChange("department", value);
            clearFieldError("department");
          }}
          className={`w-full ${
            validationErrors.department ? "border-red-500" : ""
          }`}
        />
        {validationErrors.department && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.department}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block caption mb-2 text-gray-700 font-medium">
          Phone Number
        </label>
        <InputField
          type="tel"
          placeholder="+65 8234 5678"
          value={profileData.phone}
          onChange={(value) => {
            handleInputChange("phone", value);
            clearFieldError("phone");
          }}
          className={`w-full ${validationErrors.phone ? "border-red-500" : ""}`}
        />
        {validationErrors.phone && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label className="block caption mb-2 text-gray-700 font-medium">
          Bio
        </label>
        <TextArea
          placeholder="Tell us about yourself..."
          value={profileData.bio}
          onChange={(value) => {
            handleInputChange("bio", value);
            clearFieldError("bio");
          }}
          rows={4}
          maxLength={500}
          showCharCount={true}
          className={`w-full ${validationErrors.bio ? "border-red-500" : ""}`}
        />
        {validationErrors.bio && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.bio}</p>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button type="submit" variant="blue" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
