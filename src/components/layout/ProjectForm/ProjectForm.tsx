import { useState, useEffect } from "react";
import Button from "../../ui/Button/Button";
import SearchBar, { type Member } from "../../ui/SearchBar/SearchBar";
import Dropdown, { type DropdownOption } from "../../ui/Dropdown/Dropdown";
import InputField from "../../ui/InputField/InputField";
import TextArea from "../../ui/TextArea/TextArea";
import FileDrop from "../../ui/FileDrop/FileDrop";
import {
  AlertDialog,
  type AlertDialogType,
} from "../../ui/AlertDialog/AlertDialog";
import { courseService } from "../../../services/courseService";

export interface ProjectFormData {
  course: string;
  projectName: string;
  projectType: string;
  description: string;
  text: string;
}

interface ProjectFormProps {
  initialData?: ProjectFormData;
  selectedTeamMembers?: Member[];
  selectedFiles?: File[];
  isSubmitting?: boolean;
  isEditing?: boolean;
  hasSubmissions?: boolean;
  projectId?: string;
  onSubmit: (
    data: ProjectFormData,
    teamMembers: Member[],
    files: File[],
  ) => void;
  onCancel: () => void;
}

const projectTypeOptions: DropdownOption[] = [
  { id: "group", label: "Group Project" },
  { id: "individual", label: "Individual Project" },
];

const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  selectedTeamMembers: initialTeamMembers = [],
  selectedFiles: initialFiles = [],
  isSubmitting = false,
  isEditing = false,
  hasSubmissions = false,
  projectId,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ProjectFormData>(
    initialData || {
      course: "",
      projectName: "",
      projectType: "",
      description: "",
      text: "",
    },
  );

  const [selectedTeamMembers, setSelectedTeamMembers] =
    useState<Member[]>(initialTeamMembers);
  const [selectedFiles, setSelectedFiles] = useState<File[]>(initialFiles);

  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const [courseOptions, setCourseOptions] = useState<DropdownOption[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<DropdownOption | null>(
    null,
  );

  const [selectedProjectType, setSelectedProjectType] =
    useState<DropdownOption | null>(
      initialData && initialData.projectType
        ? projectTypeOptions.find((p) => p.id === initialData.projectType) ||
            null
        : null,
    );

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<AlertDialogType>("info");
  const [alertTitle, setAlertTitle] = useState("Review your submission");
  const [primaryButtonText, setPrimaryButtonText] = useState("Confirm");
  const [alertMsg, setAlertMsg] = useState("");
  const [enrolledStudentsFetchError, setEnrolledStudentsFetchError] =
    useState(false);

  // Fetch enrolled courses on mount
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const courses = await courseService.getEnrolledCourses();

        // Convert courses to dropdown options
        const options: DropdownOption[] = courses.map((course) => ({
          id: course.id,
          label: course.code
            ? `${course.code} - ${course.title}`
            : course.title,
        }));
        setCourseOptions(options);

        // Set initial selected course if editing
        if (initialData && initialData.course) {
          const initialCourse = options.find(
            (c) => c.id === initialData.course,
          );
          if (initialCourse) {
            setSelectedCourse(initialCourse);
          }
        }
      } catch (error) {
        console.error("Failed to fetch enrolled courses:", error);
        setAlertType("error");
        setAlertTitle("Error");
        setAlertMsg(
          "Failed to load your enrolled courses. Please refresh the page.",
        );
        setIsAlertOpen(true);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchEnrolledCourses();
  }, [initialData]);

  // Fetch enrolled students when course is selected
  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      if (!selectedCourse) {
        setAvailableMembers([]);
        setEnrolledStudentsFetchError(false);
        return;
      }

      try {
        setIsLoadingMembers(true);
        setEnrolledStudentsFetchError(false);
        const students = await courseService.getEnrolledStudents(
          selectedCourse.id,
        );

        // Convert students to Member format
        const members: Member[] = students.map((student) => {
          const nameParts = student.display_name.split(" ");
          const initials = nameParts
            .map((part) => part.charAt(0).toUpperCase())
            .join("")
            .substring(0, 2);

          // Generate consistent color based on student ID
          const colors: (
            | "blue"
            | "pink"
            | "green"
            | "purple"
            | "teal"
            | "yellow"
          )[] = ["blue", "pink", "green", "purple", "teal", "yellow"];
          const colorIndex =
            parseInt(student.id.substring(0, 8), 16) % colors.length;

          return {
            id: student.id,
            name: student.display_name,
            initials,
            backgroundColor: colors[colorIndex],
          };
        });

        setAvailableMembers(members);
      } catch (error) {
        console.error("Failed to fetch enrolled students:", error);
        // Set flag instead of showing error - we'll handle this gracefully
        setAvailableMembers([]);
        setEnrolledStudentsFetchError(true);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchEnrolledStudents();
  }, [selectedCourse]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTextChange = (value: string) => {
    handleInputChange("text", value);
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const buildSubmissionSummary = () => {
    const course = selectedCourse?.label || "—";
    const ptype = selectedProjectType?.label || "—";
    const team = selectedTeamMembers.length
      ? selectedTeamMembers.map((m) => m.name).join(", ")
      : "—";
    const files = selectedFiles.length
      ? selectedFiles
          .map((f) => `${f.name} (${(f.size / 1024).toFixed(1)} KB)`)
          .join("\n  • ")
      : "—";

    return [
      `Course: ${course}`,
      `Project name: ${formData.projectName || "—"}`,
      `Project type: ${ptype}`,
      `Description: ${formData.description || "—"}`,
      `Team members: ${team}`,
      `Additional notes: ${formData.text || "—"}`,
      `Files:\n  • ${files === "—" ? "—" : files}`,
    ].join("\n");
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.projectName.trim()) {
      setAlertType("error");
      setAlertTitle("Missing Project Name");
      setAlertMsg("Please enter a project name.");
      setIsAlertOpen(true);
      return;
    }

    if (!selectedCourse) {
      setAlertType("error");
      setAlertTitle("Missing Course");
      setAlertMsg("Please select a course.");
      setIsAlertOpen(true);
      return;
    }

    if (!selectedProjectType) {
      setAlertType("error");
      setAlertTitle("Missing Project Type");
      setAlertMsg("Please select a project type.");
      setIsAlertOpen(true);
      return;
    }

    // Build submission summary for confirmation
    const summary = buildSubmissionSummary();
    setAlertMsg(summary);
    setAlertTitle(isEditing ? "Review your changes" : "Review your submission");
    setPrimaryButtonText(isEditing ? "Update" : "Create");
    setAlertType("info");
    setIsAlertOpen(true);
  };

  const handleConfirmSubmit = () => {
    setFormData({
      ...formData,
      course: selectedCourse?.id || "",
      projectType: selectedProjectType?.id || "",
    });
    onSubmit(
      {
        ...formData,
        course: selectedCourse?.id || "",
        projectType: selectedProjectType?.id || "",
      },
      selectedTeamMembers,
      selectedFiles,
    );
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-6xl mx-auto">
            <div className="flex gap-8">
              {/* Left side form */}
              <div className="flex-1 space-y-6">
                <h2 className="heading-3 mb-6">
                  {isEditing ? "Edit Project" : "Create New Project"}
                </h2>

                {/* Course Dropdown */}
                <div>
                  <label className="caption text-[var(--color-grey-55)] mb-2 block">
                    Course
                  </label>
                  {isLoadingCourses ? (
                    <div className="p-3 border rounded bg-gray-50">
                      <p className="text-sm text-gray-500">
                        Loading courses...
                      </p>
                    </div>
                  ) : courseOptions.length === 0 ? (
                    <div className="p-3 border rounded bg-yellow-50">
                      <p className="text-sm text-gray-700">
                        You are not enrolled in any courses. Please enroll in a
                        course first.
                      </p>
                    </div>
                  ) : isEditing && selectedCourse ? (
                    <div className="p-3 border rounded bg-gray-100">
                      <p className="text-sm text-gray-700">
                        {selectedCourse.label}
                      </p>
                    </div>
                  ) : (
                    <Dropdown
                      options={courseOptions}
                      selectedOption={selectedCourse}
                      onSelect={setSelectedCourse}
                      placeholder="Select course"
                    />
                  )}
                </div>

                {/* Project Name */}
                <div>
                  <label className="caption text-[var(--color-grey-55)] mb-2 block">
                    Project Name
                  </label>
                  <InputField
                    value={formData.projectName}
                    onChange={(value) =>
                      handleInputChange("projectName", value)
                    }
                    placeholder="Enter project name"
                  />
                </div>

                {/* Project Type Dropdown */}
                <div>
                  <label className="caption text-[var(--color-grey-55)] mb-2 block">
                    Project Type
                  </label>
                  {isEditing && selectedProjectType ? (
                    <div className="p-3 border rounded bg-gray-100">
                      <p className="text-sm text-gray-700">
                        {selectedProjectType.label}
                      </p>
                    </div>
                  ) : !selectedCourse ? (
                    <div className="p-3 border rounded bg-gray-50">
                      <p className="text-sm text-gray-500">
                        Please select a course first
                      </p>
                    </div>
                  ) : availableMembers.length < 1 && !isLoadingMembers ? (
                    <div className="space-y-2">
                      <Dropdown
                        options={[
                          { id: "individual", label: "Individual Project" },
                        ]}
                        selectedOption={
                          selectedProjectType?.id === "individual"
                            ? selectedProjectType
                            : null
                        }
                        onSelect={(option) => {
                          if (option) {
                            setSelectedProjectType(option);
                          }
                        }}
                        placeholder="Select project type"
                      />
                      <p className="text-xs text-amber-600 mt-1">
                        Only individual projects are available as there are no
                        other students in this course.
                      </p>
                    </div>
                  ) : (
                    <Dropdown
                      options={projectTypeOptions}
                      selectedOption={selectedProjectType}
                      onSelect={setSelectedProjectType}
                      placeholder="Select project type"
                    />
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="caption text-[var(--color-grey-55)] mb-2 block">
                    Description
                  </label>
                  <TextArea
                    value={formData.description}
                    onChange={(value) =>
                      handleInputChange("description", value)
                    }
                    placeholder="Enter project description"
                    rows={3}
                    maxLength={300}
                    showCharCount={true}
                    className="w-full"
                  />
                </div>

                {/* Team Members (only for group projects) */}
                {selectedProjectType?.id === "group" && (
                  <div>
                    <label className="caption text-[var(--color-grey-55)] mb-2 block">
                      Team Members
                    </label>
                    {!selectedCourse ? (
                      <div className="p-3 border rounded bg-gray-50">
                        <p className="text-sm text-gray-500">
                          Please select a course first to see available
                          classmates
                        </p>
                      </div>
                    ) : isLoadingMembers ? (
                      <div className="p-3 border rounded bg-gray-50">
                        <p className="text-sm text-gray-500">
                          Loading classmates...
                        </p>
                      </div>
                    ) : enrolledStudentsFetchError ? (
                      <div className="p-3 border rounded bg-yellow-50">
                        <p className="text-sm text-gray-700">
                          Unable to load classmates. There may be no other
                          students enrolled in this course yet, or please try
                          again.
                        </p>
                      </div>
                    ) : availableMembers.length === 0 ? (
                      <div className="p-3 border rounded bg-yellow-50">
                        <p className="text-sm text-gray-700">
                          No other students are enrolled in this course yet.
                        </p>
                      </div>
                    ) : (
                      <SearchBar
                        placeholder="Search and select team members"
                        members={availableMembers.filter(
                          (m) =>
                            !selectedTeamMembers.find((s) => s.id === m.id),
                        )}
                        onSelect={(member) => {
                          if (
                            !selectedTeamMembers.find((m) => m.id === member.id)
                          ) {
                            setSelectedTeamMembers((prev) => [...prev, member]);
                          }
                        }}
                        maxResults={6}
                      />
                    )}

                    {/* Selected Team Members Display */}
                    {selectedTeamMembers.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <p className="caption mb-2">
                          Selected Members ({selectedTeamMembers.length}):
                        </p>
                        <div className="space-y-2">
                          {selectedTeamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between bg-white p-2 rounded border"
                            >
                              <span className="text-sm font-medium">
                                {member.name}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTeamMembers((prev) =>
                                    prev.filter((m) => m.id !== member.id),
                                  )
                                }
                                className="text-red-600 hover:text-red-800 text-sm font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Essay Body - Text or File Upload */}
                {selectedProjectType && isEditing && hasSubmissions ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      📝 Submissions exist for this project
                    </p>
                    <p className="text-xs text-blue-700">
                      To submit a new version, go to the{" "}
                      {projectId ? (
                        <a
                          href={`/project/${projectId}`}
                          className="underline font-medium hover:text-blue-900"
                        >
                          project detail page
                        </a>
                      ) : (
                        "project detail page"
                      )}{" "}
                      and click &quot;Submit New Version&quot;. Previous
                      submissions are preserved.
                    </p>
                  </div>
                ) : selectedProjectType ? (
                  <div>
                    <label className="caption text-[var(--color-grey-55)] mb-2 block">
                      Essay Body{" "}
                      <span className="text-xs text-gray-400">(Optional)</span>
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      You can either write your essay directly below OR upload a
                      PDF/document file. Choose whichever works best for you.
                    </p>

                    {/* Text Essay Input */}
                    <div className="mb-4">
                      <label className="text-sm text-gray-700 mb-2 block font-medium">
                        Write Essay Text
                      </label>
                      <TextArea
                        value={formData.text}
                        onChange={handleTextChange}
                        placeholder="Type your essay here... (or leave empty and upload a file instead)"
                        rows={6}
                        maxLength={5000}
                        showCharCount={true}
                        className="w-full"
                      />
                    </div>

                    {/* File Upload Section */}
                    <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <label className="text-sm text-gray-700 mb-2 block font-medium">
                        OR Upload PDF File
                      </label>
                      <p className="text-xs text-gray-600 mb-3">
                        Upload a PDF file for AI evaluation. Only PDF format is
                        currently supported.
                      </p>
                      <FileDrop
                        onFilesSelected={handleFilesSelected}
                        accept=".pdf"
                        multiple={true}
                        maxSize={50 * 1024 * 1024}
                      />
                    </div>

                    {/* Selected Files Display */}
                    {selectedFiles.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="caption mb-3 text-blue-900">
                          📎 Selected Files ({selectedFiles.length}):
                        </p>
                        <div className="space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-white p-3 rounded border border-blue-100"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-medium text-gray-800">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="ml-2 text-red-600 hover:text-red-800 text-sm font-bold px-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Help text */}
                    {formData.text.trim() === "" &&
                      selectedFiles.length === 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-xs text-yellow-800">
                            💡 Tip: You don't need to add both text and files.
                            Just add whichever you prefer!
                          </p>
                        </div>
                      )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="border-t border-[var(--color-grey-20)] p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="grey"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="red" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : isEditing ? "Update" : "Submit"}
            </Button>
          </div>
        </div>
      </form>

      <AlertDialog
        isOpen={isAlertOpen}
        type={alertType}
        title={alertTitle}
        message={alertMsg}
        primaryButtonText={primaryButtonText}
        onPrimaryAction={() => {
          if (alertType === "info") {
            handleConfirmSubmit();
          } else {
            setIsAlertOpen(false);
            setAlertType("info");
            setAlertTitle(
              isEditing ? "Review your changes" : "Review your submission",
            );
            setPrimaryButtonText(isEditing ? "Update" : "Create");
          }
        }}
        onSecondaryAction={() => setIsAlertOpen(false)}
        showCloseButton
        closeOnOverlayClick
      />
    </div>
  );
};

export default ProjectForm;
