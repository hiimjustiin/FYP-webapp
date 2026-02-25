import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button/Button";
import SearchBar, { type Member } from "../components/ui/SearchBar/SearchBar";
import MemberIcon from "../components/ui/MemberIcon/MemberIcon";
import {
  AlertDialog,
  type AlertDialogType,
} from "../components/ui/AlertDialog/AlertDialog";
import {
  teamService,
  type TeamDetails,
  type TeamMember,
} from "../services/teamService";
import { courseService } from "../services/courseService";

const TeamManage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // State
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Member[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Alert state
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<AlertDialogType>("info");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Fetch team details
  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);
        setError(null);
        const teamData = await teamService.getTeamDetails(projectId);
        setTeam(teamData);

        // Check if user is the owner
        if (!teamData.ownerIsCurrentUser) {
          setError("You don't have permission to manage this team.");
          return;
        }

        // Fetch enrolled students for adding members
        if (teamData.course?.id) {
          fetchAvailableStudents(teamData.course.id, teamData.members);
        }
      } catch (err) {
        console.error("Failed to fetch team details:", err);
        setError("Failed to load team details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamDetails();
  }, [projectId]);

  // Fetch students that can be added to the team
  const fetchAvailableStudents = async (
    courseId: string,
    currentMembers: TeamMember[]
  ) => {
    try {
      setIsLoadingStudents(true);
      const students = await courseService.getEnrolledStudents(courseId);

      // Filter out students who are already members
      const memberIds = new Set(currentMembers.map((m) => m.id));
      const available = students
        .filter((s) => !memberIds.has(s.id))
        .map((s) => {
          const nameParts = s.display_name.split(" ");
          const initials = nameParts
            .map((part) => part.charAt(0).toUpperCase())
            .join("")
            .substring(0, 2);

          // Generate consistent color based on ID
          const colors: (
            | "blue"
            | "pink"
            | "green"
            | "purple"
            | "teal"
            | "yellow"
          )[] = ["blue", "pink", "green", "purple", "teal", "yellow"];
          const colorIndex =
            parseInt(s.id.substring(0, 8), 16) % colors.length;

          return {
            id: s.id,
            name: s.display_name,
            initials,
            backgroundColor: colors[colorIndex],
          };
        });

      setAvailableStudents(available);
    } catch (err) {
      console.error("Failed to fetch enrolled students:", err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Show alert helper
  const showAlert = (
    type: AlertDialogType,
    title: string,
    message: string,
    action?: () => void
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setPendingAction(action ? () => action : null);
    setIsAlertOpen(true);
  };

  // Handle adding a member
  const handleAddMember = async (member: Member) => {
    if (!projectId || !team) return;

    try {
      setIsAddingMember(true);
      const response = await teamService.addMember(projectId, member.id);

      // Update local state
      const newMember: TeamMember = {
        id: response.member.id,
        name: response.member.name,
        role: "member",
        initials: response.member.initials,
        email: response.member.email,
      };

      setTeam((prev) =>
        prev ? { ...prev, members: [...prev.members, newMember] } : null
      );

      // Remove from available students
      setAvailableStudents((prev) => prev.filter((s) => s.id !== member.id));

      showAlert("success", "Success", `${member.name} has been added to the team.`);
    } catch (err) {
      console.error("Failed to add member:", err);
      showAlert(
        "error",
        "Error",
        err instanceof Error ? err.message : "Failed to add team member."
      );
    } finally {
      setIsAddingMember(false);
    }
  };

  // Handle removing a member
  const handleRemoveMember = (member: TeamMember) => {
    showAlert(
      "warning",
      "Remove Team Member",
      `Are you sure you want to remove ${member.name} from the team?`,
      () => confirmRemoveMember(member)
    );
  };

  const confirmRemoveMember = async (member: TeamMember) => {
    if (!projectId || !team) return;

    try {
      setRemovingMemberId(member.id);
      await teamService.removeMember(projectId, member.id);

      // Update local state
      setTeam((prev) =>
        prev
          ? { ...prev, members: prev.members.filter((m) => m.id !== member.id) }
          : null
      );

      // Add back to available students
      const colors: (
        | "blue"
        | "pink"
        | "green"
        | "purple"
        | "teal"
        | "yellow"
      )[] = ["blue", "pink", "green", "purple", "teal", "yellow"];
      const colorIndex =
        parseInt(member.id.substring(0, 8), 16) % colors.length;

      setAvailableStudents((prev) => [
        ...prev,
        {
          id: member.id,
          name: member.name,
          initials: member.initials,
          backgroundColor: colors[colorIndex],
        },
      ]);

      showAlert("success", "Success", `${member.name} has been removed from the team.`);
    } catch (err) {
      console.error("Failed to remove member:", err);
      showAlert(
        "error",
        "Error",
        err instanceof Error ? err.message : "Failed to remove team member."
      );
    } finally {
      setRemovingMemberId(null);
    }
  };

  // Generate consistent color for a member
  const getMemberColor = (id: string) => {
    const colors: ("blue" | "pink" | "green" | "purple" | "teal" | "yellow")[] =
      ["blue", "pink", "green", "purple", "teal", "yellow"];
    const colorIndex = parseInt(id.substring(0, 8), 16) % colors.length;
    return colors[colorIndex];
  };

  // Handle alert actions
  const handleAlertPrimary = () => {
    if (pendingAction) {
      pendingAction();
    }
    setIsAlertOpen(false);
    setPendingAction(null);
  };

  const handleAlertSecondary = () => {
    setIsAlertOpen(false);
    setPendingAction(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-screen flex flex-col">
      <div className="mx-auto max-w-4xl w-full flex-1 min-h-0 flex flex-col">
        <div className="space-y-6 flex-1 min-h-0 flex flex-col">
          {/* Back button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate("/team")}
              className="flex items-center gap-2 text-[var(--color-grey-55)] hover:text-[var(--color-grey-80)] transition-colors"
            >
              <span>←</span>
              <span className="subtitle-2">Back to Teams</span>
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="dashboard-card px-6 py-8 flex items-center justify-center">
              <p className="subtitle-2 text-[var(--color-grey-55)]">
                Loading team details...
              </p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="dashboard-card px-6 py-8 flex flex-col items-center justify-center gap-4">
              <p className="subtitle-2 text-red-500">{error}</p>
              <Button variant="grey" onClick={() => navigate("/team")}>
                Go Back
              </Button>
            </div>
          )}

          {/* Team Details */}
          {!isLoading && !error && team && (
            <>
              {/* Header */}
              <div className="dashboard-card px-6 py-4 flex-shrink-0">
                <p className="caption text-[var(--color-grey-55)]">
                  {team.course.code} - {team.course.title}
                </p>
                <h5 className="heading-5 mt-1">{team.projectName}</h5>
                <p className="subtitle-2 text-grey-80 mt-1">
                  Manage team members for this group project
                </p>
              </div>

              {/* Members List */}
              <div className="dashboard-card px-6 py-6 flex-1 min-h-0 overflow-y-auto">
                <h6 className="subtitle-1 mb-4">
                  Team Members ({team.members.length})
                </h6>

                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-[var(--color-grey-10)] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <MemberIcon
                          name={member.name}
                          size="medium"
                          backgroundColor={getMemberColor(member.id)}
                        />
                        <div>
                          <p className="subtitle-2">{member.name}</p>
                          <p className="caption text-[var(--color-grey-55)]">
                            {member.role === "owner" ? "Owner" : "Member"}
                            {member.email && ` • ${member.email}`}
                          </p>
                        </div>
                      </div>

                      {/* Remove button (only for non-owners) */}
                      {member.role !== "owner" && (
                        <Button
                          variant="grey"
                          onClick={() => handleRemoveMember(member)}
                          disabled={removingMemberId === member.id}
                        >
                          {removingMemberId === member.id
                            ? "Removing..."
                            : "Remove"}
                        </Button>
                      )}

                      {/* Owner badge */}
                      {member.role === "owner" && (
                        <span className="px-3 py-1 bg-[var(--color-blue-10)] text-[var(--color-blue-60)] rounded-full caption">
                          Owner
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Member Section */}
                <div className="mt-8 pt-6 border-t border-[var(--color-grey-20)]">
                  <h6 className="subtitle-1 mb-4">Add Team Member</h6>

                  {isLoadingStudents ? (
                    <p className="caption text-[var(--color-grey-55)]">
                      Loading available classmates...
                    </p>
                  ) : availableStudents.length === 0 ? (
                    <div className="p-4 bg-[var(--color-grey-10)] rounded-lg">
                      <p className="caption text-[var(--color-grey-55)]">
                        No other classmates available to add. All enrolled
                        students are already members of this team.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <SearchBar
                        placeholder="Search classmates to add..."
                        members={availableStudents}
                        onSelect={handleAddMember}
                        maxResults={6}
                        className="w-full"
                      />
                      {isAddingMember && (
                        <p className="caption text-[var(--color-grey-55)]">
                          Adding member...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="dashboard-card px-6 py-4 flex-shrink-0 flex justify-end gap-3">
                <Button variant="grey" onClick={() => navigate("/team")}>
                  Done
                </Button>
                <Button
                  variant="blue"
                  onClick={() => navigate(`/project/${projectId}/edit`)}
                >
                  Edit Project
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={isAlertOpen}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        primaryButtonText={alertType === "warning" ? "Confirm" : "OK"}
        secondaryButtonText={alertType === "warning" ? "Cancel" : undefined}
        onPrimaryAction={handleAlertPrimary}
        onSecondaryAction={
          alertType === "warning" ? handleAlertSecondary : undefined
        }
        showCloseButton
        closeOnOverlayClick
      />
    </div>
  );
};

export default TeamManage;
