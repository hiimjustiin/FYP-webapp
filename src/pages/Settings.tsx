import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userService, type UpdateUserData } from "../services/userService";
import ProfileForm from "../components/layout/ProfileForm";
import {
  AlertDialog,
  type AlertDialogType,
} from "../components/ui/AlertDialog/AlertDialog";

const Settings = () => {
  const { user: authUser } = useAuth();

  // Profile state
  const [profileData, setProfileData] = useState<UpdateUserData>({
    display_name: "",
    bio: "",
    phone: "",
    department: "",
    student_id: "",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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
              Manage your profile information
            </p>
          </div>

          {/* Content */}
          <div className="dashboard-card px-6 py-6 flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-2xl">
              {isLoadingProfile ? (
                <div className="text-center py-8">Loading profile...</div>
              ) : (
                <ProfileForm
                  authUserId={authUser?.id || ""}
                  authUserEmail={authUser?.email || ""}
                  authUserRole={authUser?.role}
                  initialData={profileData}
                  onSuccess={(message) =>
                    showAlert("success", "Success", message)
                  }
                  onError={(message) => showAlert("error", "Error", message)}
                />
              )}
            </div>
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
