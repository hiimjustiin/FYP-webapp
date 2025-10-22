import { useState } from "react";
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
  onSubmit: (
    data: ProjectFormData,
    teamMembers: Member[],
    files: File[]
  ) => void;
  onCancel: () => void;
}

const courseOptions: DropdownOption[] = [
  { id: "cs", label: "Computer Science" },
  { id: "ds", label: "Data Science" },
  { id: "se", label: "Software Engineering" },
  { id: "is", label: "Information Systems" },
  { id: "cyber", label: "Cybersecurity" },
  { id: "ai", label: "AI & Machine Learning" },
];

const projectTypeOptions: DropdownOption[] = [
  { id: "group", label: "Group Project" },
  { id: "individual", label: "Individual Project" },
];

// Sample members data
const sampleMembers: Member[] = [
  {
    id: "1",
    name: "John Doe",
    initials: "JD",
    backgroundColor: "blue",
  },
  {
    id: "2",
    name: "Jane Smith",
    initials: "JS",
    backgroundColor: "green",
  },
  {
    id: "3",
    name: "Mike Johnson",
    initials: "MJ",
    backgroundColor: "purple",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    initials: "SW",
    backgroundColor: "pink",
  },
  {
    id: "5",
    name: "David Chen",
    initials: "DC",
    backgroundColor: "teal",
  },
];

const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  selectedTeamMembers: initialTeamMembers = [],
  selectedFiles: initialFiles = [],
  isSubmitting = false,
  isEditing = false,
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
    }
  );

  const [selectedTeamMembers, setSelectedTeamMembers] =
    useState<Member[]>(initialTeamMembers);
  const [selectedFiles, setSelectedFiles] = useState<File[]>(initialFiles);

  const [selectedCourse, setSelectedCourse] = useState<DropdownOption | null>(
    initialData && initialData.course
      ? courseOptions.find((c) => c.id === initialData.course) || null
      : null
  );

  const [selectedProjectType, setSelectedProjectType] =
    useState<DropdownOption | null>(
      initialData && initialData.projectType
        ? projectTypeOptions.find((p) => p.id === initialData.projectType) ||
            null
        : null
    );

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<AlertDialogType>("info");
  const [alertTitle, setAlertTitle] = useState("Review your submission");
  const [primaryButtonText, setPrimaryButtonText] = useState("Confirm");
  const [alertMsg, setAlertMsg] = useState("");

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
      selectedFiles
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
                  <Dropdown
                    options={courseOptions}
                    selectedOption={selectedCourse}
                    onSelect={setSelectedCourse}
                    placeholder="Select course"
                  />
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
                  <Dropdown
                    options={projectTypeOptions}
                    selectedOption={selectedProjectType}
                    onSelect={setSelectedProjectType}
                    placeholder="Select project type"
                  />
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
                    <SearchBar
                      placeholder="Search and select team members"
                      members={sampleMembers}
                      onSelect={(member) => {
                        if (
                          !selectedTeamMembers.find((m) => m.id === member.id)
                        ) {
                          setSelectedTeamMembers((prev) => [...prev, member]);
                        }
                      }}
                      maxResults={6}
                    />

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
                                    prev.filter((m) => m.id !== member.id)
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

                {/* Additional Notes and File Upload */}
                {selectedProjectType && (
                  <div>
                    <label className="caption text-[var(--color-grey-55)] mb-2 block">
                      Additional Notes
                    </label>
                    <TextArea
                      value={formData.text}
                      onChange={handleTextChange}
                      placeholder="Text"
                      rows={4}
                      maxLength={500}
                      showCharCount={true}
                      className="w-full"
                    >
                      {/* FileDrop integrated within TextArea */}
                      {formData.text.trim() === "" && (
                        <div className="mt-2">
                          <FileDrop
                            onFilesSelected={handleFilesSelected}
                            accept=".pdf,.doc,.docx,.txt,.jpg,.png,.pptx,.xlsx"
                            multiple={true}
                            maxSize={10 * 1024 * 1024}
                          />
                        </div>
                      )}
                    </TextArea>

                    {/* Separate FileDrop when text has content */}
                    {formData.text.trim() !== "" && (
                      <div className="mt-4">
                        <label className="block caption mb-2">
                          Attach Files
                        </label>
                        <FileDrop
                          onFilesSelected={handleFilesSelected}
                          accept=".pdf,.doc,.docx,.txt,.jpg,.png,.pptx,.xlsx"
                          multiple={true}
                          maxSize={10 * 1024 * 1024}
                        />
                      </div>
                    )}

                    {/* Selected Files Display */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <p className="caption mb-2">
                          Selected Files ({selectedFiles.length}):
                        </p>
                        <div className="space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-white p-2 rounded border"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
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
              isEditing ? "Review your changes" : "Review your submission"
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
