import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userService, type UpdateUserData } from "../services/userService";
import { courseService, type Course } from "../services/courseService";
import ProfileForm from "../components/layout/ProfileForm";
import CourseEnrollment from "../components/layout/CourseEnrollment";
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

  // Courses state
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

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
      console.log("All courses:", all);
      console.log("Enrolled courses:", enrolled);
      console.log("Enrolled course IDs:", enrolled.map(c => c.id));
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

  const handleEnrollCourse = async (courseId: string, passcode: string) => {
    try {
      setIsLoadingCourses(true);
      console.log("Enrolling in course:", courseId);
      await courseService.enrollCourse(courseId, passcode);
      console.log("Enrollment successful");
      showAlert("success", "Enrolled", "Successfully enrolled in course");
      // Refresh from backend to get updated enrollment status
      await loadCourses();
    } catch (error) {
      console.error("Failed to enroll:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to enroll in course";
      showAlert("error", "Error", errorMessage);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleUnenrollCourse = async (courseId: string) => {
    try {
      setIsLoadingCourses(true);
      console.log("Unenrolling from course:", courseId);
      await courseService.unenrollCourse(courseId);
      console.log("Unenroll successful, reloading courses...");
      showAlert("success", "Unenrolled", "Successfully unenrolled from course");
      // Refresh from backend to get updated enrollment status (should exclude dropped courses)
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
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const showAlert = (type: AlertDialogType, title: string, message: string) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

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
                  <ProfileForm
                    authUserId={authUser?.id || ""}
                    authUserEmail={authUser?.email || ""}
                    initialData={profileData}
                    onSuccess={(message) =>
                      showAlert("success", "Success", message)
                    }
                    onError={(message) => showAlert("error", "Error", message)}
                  />
                )}
              </div>
            )}

            {activeTab === "courses" && (
              <CourseEnrollment
                availableCourses={availableCourses}
                enrolledCourses={enrolledCourses}
                onEnroll={handleEnrollCourse}
                onUnenroll={handleUnenrollCourse}
                isLoading={isLoadingCourses}
              />
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
