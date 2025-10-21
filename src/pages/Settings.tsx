import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userService, type UpdateUserData } from "../services/userService";
import { courseService, type Course } from "../services/courseService";
import InputField from "../components/ui/InputField/InputField";
import TextArea from "../components/ui/TextArea/TextArea";
import Button from "../components/ui/Button/Button";
import {
  AlertDialog,
  type AlertDialogType,
} from "../components/ui/AlertDialog/AlertDialog";

const Settings = () => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "courses">("profile");

  // Profile state
  const [profileData, setProfileData] = useState<UpdateUserData>({
    display_name: "",
    bio: "",
    phone: "",
    department: "",
    student_id: "",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Courses state
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Alert state
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<AlertDialogType>("info");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser?.id) return;

      try {
        setIsLoadingProfile(true);
        const userData = await userService.getUser(authUser.id);
        setProfileData({
          display_name: userData.display_name || "",
          bio: userData.bio || "",
          phone: userData.phone || "",
          department: userData.department || "",
          student_id: userData.student_id || "",
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
        showAlert("error", "Error", "Failed to load profile data");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [authUser?.id]);

  const loadCourses = async () => {
    try {
      setIsLoadingCourses(true);
      const [all, enrolled] = await Promise.all([
        courseService.getCourses(),
        courseService.getEnrolledCourses(),
      ]);
      setAvailableCourses(all);
      setEnrolledCourses(enrolled);
    } catch (error) {
      console.error("Failed to load courses:", error);
      showAlert("error", "Error", "Failed to load courses");
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // Load courses
  useEffect(() => {
    if (activeTab === "courses") {
      loadCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authUser?.id) return;

    // Validate required fields
    const errors: Record<string, string> = {};

    if (!profileData.display_name || profileData.display_name.trim() === "") {
      errors.display_name = "Display name is required";
    }

    if (!profileData.student_id || profileData.student_id.trim() === "") {
      errors.student_id = "Student ID is required";
    }

    if (!profileData.department || profileData.department.trim() === "") {
      errors.department = "Department is required";
    }

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
      showAlert(
        "error",
        "Validation Error",
        "Please fill in all required fields and correct any errors"
      );
      return;
    }

    setValidationErrors({});

    try {
      setIsSavingProfile(true);
      await userService.updateUser(authUser.id, profileData);
      showAlert("success", "Success", "Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      showAlert(
        "error",
        "Error",
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleEnrollCourse = async (courseId: string) => {
    try {
      await courseService.enrollCourse(courseId);
      showAlert("success", "Enrolled", "Successfully enrolled in course");
      await loadCourses();
    } catch (error) {
      console.error("Failed to enroll:", error);
      showAlert(
        "error",
        "Error",
        error instanceof Error ? error.message : "Failed to enroll in course"
      );
    }
  };

  const handleUnenrollCourse = async (courseId: string) => {
    try {
      await courseService.unenrollCourse(courseId);
      showAlert("success", "Unenrolled", "Successfully unenrolled from course");
      await loadCourses();
    } catch (error) {
      console.error("Failed to unenroll:", error);
      showAlert(
        "error",
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to unenroll from course"
      );
    }
  };

  const showAlert = (type: AlertDialogType, title: string, message: string) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  const handleInputChange = (field: keyof UpdateUserData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const filteredCourses = availableCourses.filter((course) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      course.code.toLowerCase().includes(query) ||
      course.title.toLowerCase().includes(query) ||
      course.instructor_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-screen flex flex-col">
      <div className="mx-auto max-w-7xl w-full flex-1 min-h-0 flex flex-col">
        <div className="space-y-6 flex-1 min-h-0 flex flex-col">
          {/* Header */}
          <div className="dashboard-card px-6 py-4 flex-shrink-0">
            <h5 className="heading-5">Settings</h5>
            <p className="subtitle-2 text-grey-80">
              Manage your profile and course enrollments
            </p>
          </div>

          {/* Tabs */}
          <div className="dashboard-card flex-shrink-0">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === "profile"
                    ? "border-b-2 border-[#181C62] text-[#181C62]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("courses")}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === "courses"
                    ? "border-b-2 border-[#181C62] text-[#181C62]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Course Enrollments
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="dashboard-card px-6 py-6 flex-1 min-h-0 overflow-y-auto">
            {activeTab === "profile" && (
              <div className="max-w-2xl">
                {isLoadingProfile ? (
                  <div className="text-center py-8">Loading profile...</div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Email (read-only) */}
                    <div>
                      <label className="block caption mb-2 text-gray-700 font-medium">
                        Email
                      </label>
                      <InputField
                        type="email"
                        value={authUser?.email || ""}
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
                          if (validationErrors.display_name) {
                            setValidationErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.display_name;
                              return newErrors;
                            });
                          }
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

                    {/* Student ID */}
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
                          if (validationErrors.student_id) {
                            setValidationErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.student_id;
                              return newErrors;
                            });
                          }
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

                    {/* Department */}
                    <div>
                      <label className="block caption mb-2 text-gray-700 font-medium">
                        Department <span className="text-red-600">*</span>
                      </label>
                      <InputField
                        type="text"
                        placeholder="Enter your department"
                        value={profileData.department}
                        onChange={(value) => {
                          handleInputChange("department", value);
                          if (validationErrors.department) {
                            setValidationErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.department;
                              return newErrors;
                            });
                          }
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
                          if (validationErrors.phone) {
                            setValidationErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.phone;
                              return newErrors;
                            });
                          }
                        }}
                        className={`w-full ${
                          validationErrors.phone ? "border-red-500" : ""
                        }`}
                      />
                      {validationErrors.phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.phone}
                        </p>
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
                          if (validationErrors.bio) {
                            setValidationErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.bio;
                              return newErrors;
                            });
                          }
                        }}
                        rows={4}
                        maxLength={500}
                        showCharCount={true}
                        className={`w-full ${
                          validationErrors.bio ? "border-red-500" : ""
                        }`}
                      />
                      {validationErrors.bio && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.bio}
                        </p>
                      )}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        variant="blue"
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === "courses" && (
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="max-w-md">
                  <InputField
                    type="text"
                    placeholder="Search courses by code, title, or instructor..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="w-full"
                  />
                </div>

                {isLoadingCourses ? (
                  <div className="text-center py-8">Loading courses...</div>
                ) : (
                  <>
                    {/* Enrolled Courses */}
                    <div>
                      <h6 className="heading-6 mb-4">
                        My Enrolled Courses ({enrolledCourses.length})
                      </h6>
                      {enrolledCourses.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">
                            You are not enrolled in any courses yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {enrolledCourses.map((course) => (
                            <div
                              key={course.id}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="font-bold text-lg">
                                      {course.code}
                                    </span>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                      Enrolled
                                    </span>
                                  </div>
                                  <h6 className="font-semibold text-gray-800 mb-1">
                                    {course.title}
                                  </h6>
                                  {course.description && (
                                    <p className="text-sm text-gray-600 mb-2">
                                      {course.description}
                                    </p>
                                  )}
                                  <div className="text-sm text-gray-500">
                                    <p>
                                      Instructor:{" "}
                                      {course.instructor_name || "TBA"}
                                    </p>
                                    {course.term && <p>Term: {course.term}</p>}
                                  </div>
                                </div>
                                <Button
                                  variant="grey"
                                  onClick={() =>
                                    handleUnenrollCourse(course.id)
                                  }
                                >
                                  Unenroll
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Available Courses */}
                    <div>
                      <h6 className="heading-6 mb-4">Available Courses</h6>
                      {filteredCourses.filter((c) => !c.enrolled).length ===
                      0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">
                            {searchQuery
                              ? "No courses found matching your search."
                              : "All available courses are enrolled."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredCourses
                            .filter((course) => !course.enrolled)
                            .map((course) => (
                              <div
                                key={course.id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="font-bold text-lg">
                                        {course.code}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {course.enrollment_count || 0} enrolled
                                      </span>
                                    </div>
                                    <h6 className="font-semibold text-gray-800 mb-1">
                                      {course.title}
                                    </h6>
                                    {course.description && (
                                      <p className="text-sm text-gray-600 mb-2">
                                        {course.description}
                                      </p>
                                    )}
                                    <div className="text-sm text-gray-500">
                                      <p>
                                        Instructor:{" "}
                                        {course.instructor_name || "TBA"}
                                      </p>
                                      {course.term && (
                                        <p>Term: {course.term}</p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="blue"
                                    onClick={() =>
                                      handleEnrollCourse(course.id)
                                    }
                                  >
                                    Enroll
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        isOpen={isAlertOpen}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        primaryButtonText="Close"
        onPrimaryAction={() => setIsAlertOpen(false)}
        onClose={() => setIsAlertOpen(false)}
        showCloseButton
      />
    </div>
  );
};

export default Settings;
