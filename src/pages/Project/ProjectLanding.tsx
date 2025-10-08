import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from "../../components/ui/Button/Button";
import SearchBar, { type Member } from "../../components/ui/SearchBar/SearchBar";
import Dropdown, { type DropdownOption } from "../../components/ui/Dropdown/Dropdown";
import InputField from "../../components/ui/InputField/InputField";
import TextArea from "../../components/ui/TextArea/TextArea";
import FileDrop from "../../components/ui/FileDrop/FileDrop";
import { AlertDialog, type AlertDialogType } from "../../components/ui/AlertDialog/AlertDialog";

const ProjectLanding = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        course: '',
        projectName: '',
        projectType: '',
        text: ''
    });

    // Team members state for group projects
    const [selectedTeamMembers, setSelectedTeamMembers] = useState<Member[]>([]);

    // File state for group projects
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // Sample members data for the SearchBar
    const [members] = useState<Member[]>([
        {
            id: '1',
            name: 'John Doe',
            initials: 'JD',
            backgroundColor: 'blue',
        },
        {
            id: '2',
            name: 'Jane Smith',
            initials: 'JS',
            backgroundColor: 'green',
        },
        {
            id: '3',
            name: 'Mike Johnson',
            initials: 'MJ',
            backgroundColor: 'purple',
        },
        {
            id: '4',
            name: 'Sarah Wilson',
            initials: 'SW',
            backgroundColor: 'pink',
        },
        {
            id: '5',
            name: 'David Chen',
            initials: 'DC',
            backgroundColor: 'teal',
        },
    ]);

    // Convert arrays to DropdownOption format
    const courseOptions: DropdownOption[] = [
        { id: 'cs', label: 'Computer Science' },
        { id: 'ds', label: 'Data Science' },
        { id: 'se', label: 'Software Engineering' },
        { id: 'is', label: 'Information Systems' },
        { id: 'cyber', label: 'Cybersecurity' },
        { id: 'ai', label: 'AI & Machine Learning' }
    ];

    const projectTypeOptions: DropdownOption[] = [
        { id: 'group', label: 'Group Project' },
        { id: 'individual', label: 'Individual Project' }
    ];

    // Selected dropdown states
    const [selectedCourse, setSelectedCourse] = useState<DropdownOption | null>(null);
    const [selectedProjectType, setSelectedProjectType] = useState<DropdownOption | null>(null);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertType, setAlertType] = useState<AlertDialogType>('info');
    const [alertTitle, setAlertTitle] = useState('Review your submission');
    const [primaryButtonText, setPrimaryButtonText] = useState('Confirm');
    const [secondaryButtonText, setSecondaryButtonText] = useState('Cancel');
    const [alertMsg, setAlertMsg] = useState('');

    const buildSubmissionSummary = () => {
        const course = selectedCourse?.label || '—';
        const ptype = selectedProjectType?.label || '—';
        const team = selectedTeamMembers.length
            ? selectedTeamMembers.map(m => m.name).join(', ')
            : '—';
        const files = selectedFiles.length
            ? selectedFiles.map(f => `${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join('\n  • ')
            : '—';

        return [
            `Course: ${course}`,
            `Project name: ${formData.projectName || '—'}`,
            `Project type: ${ptype}`,
            `Team members: ${team}`,
            `Text: ${formData.text || '—'}`,
            `Files:\n  • ${files === '—' ? '—' : files}`
        ].join('\n');
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Form submitted:', {
            ...formData,
            course: selectedCourse?.label || '',
            projectType: selectedProjectType?.label || '',
            teamMembers: selectedTeamMembers,
            files: selectedFiles
        });
        // Handle form submission logic here
        openReviewDialog();
    };

    // SearchBar event handlers
    const handleSearch = (query: string) => {
        console.log('Searching for:', query);
    };

    const handleSelectMember = (member: Member) => {
        console.log('Selected member:', member);
    };

    const handleShowAll = () => {
        console.log('Show all members clicked');
    };

    // Team member search handlers
    const handleTeamMemberSearch = (query: string) => {
        console.log('Searching for team member:', query);
    };

    const handleSelectTeamMember = (member: Member) => {
        if (!selectedTeamMembers.find(m => m.id === member.id)) {
            setSelectedTeamMembers(prev => [...prev, member]);
        }
    };

    const handleRemoveTeamMember = (memberId: string) => {
        setSelectedTeamMembers(prev => prev.filter(member => member.id !== memberId));
    };

    const handleShowAllTeamMembers = () => {
        console.log('Show all team members clicked');
    };

    // File handlers
    const handleFilesSelected = (files: File[]) => {
        setSelectedFiles(files);
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Dropdown event handlers
    const handleCourseSelect = (option: DropdownOption) => {
        setSelectedCourse(option);
        handleInputChange('course', option.label);
    };

    const handleProjectTypeSelect = (option: DropdownOption) => {
        setSelectedProjectType(option);
        handleInputChange('projectType', option.label);

        // Clear team members if switching to individual project
        if (option.id === 'individual') {
            setSelectedTeamMembers([]);
        }
    };

    // InputField event handler
    const handleProjectNameChange = (value: string) => {
        handleInputChange('projectName', value);
    };

    // TextArea event handler
    const handleTextChange = (value: string) => {
        handleInputChange('text', value);
    };

    const openReviewDialog = () => {
        setAlertType('info');
        setAlertTitle('Review your submission');
        setPrimaryButtonText('Confirm');
        setSecondaryButtonText('Cancel');
        setAlertMsg(buildSubmissionSummary());
        setIsAlertOpen(true);
    };

    const showSuccessDialog = () => {
        setAlertType('success');
        setAlertTitle('Submitted!');
        setPrimaryButtonText('Close');
        setSecondaryButtonText(''); // hide secondary button
        setAlertMsg('Your project has been submitted successfully.');
        setIsAlertOpen(true);
    };

    const isGroupProject = selectedProjectType?.id === 'group';
    const isIndividualProject = selectedProjectType?.id === 'individual';

    return (
        <div className="p-3 sm:p-4 lg:p-6 h-screen flex flex-col">
            <div className="w-full flex-1 min-h-0 flex flex-col">
                <div className="flex flex-col h-full gap-4">
                    {/* row: header card and searchbar within section card */}
                    <div className="flex flex-row justify-between items-center gap-4 flex-shrink-0">
                        <div className="dashboard-card flex-7/12 px-4 py-2">
                            <h5 className="heading-5">Hi, User!</h5>
                            <p className="subtitle-2 text-grey-80">Let's begin a new project with ILA!</p>
                        </div>
                        {/* Add New Project card (clickable) */}
                        <div
                            className="dashboard-card basis-5/12 min-w-0 px-6 py-5 flex items-center justify-center cursor-pointer hover:scale-102 active:scale-98 transition-all"
                            onClick={() => navigate("/project/new")}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    navigate("/project/new");
                                }
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="subtitle-2 leading-none">＋</span>
                                <span className="subtitle-2">Add New Project</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0">
                        <div className="dashboard-card px-4 py-4 w-full h-full min-h-0 flex flex-col">
                            <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
                                <div className="flex flex-row w-full flex-1 min-h-0 gap-2">
                                    {/* dropdowns and submit button */}
                                    <div className="flex min-h-0 flex-col basis-2/3 p-4">
                                        {/* Scrollable content area */}
                                        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                                            <div className="flex flex-col w-sm space-y-4">
                                                {/* Course Dropdown */}
                                                <div>
                                                    <Dropdown
                                                        options={courseOptions}
                                                        selectedOption={selectedCourse}
                                                        onSelect={handleCourseSelect}
                                                        placeholder="Course"
                                                        className="w-full"
                                                    />
                                                </div>

                                                {/* Project Name Input */}
                                                <div>
                                                    <InputField
                                                        type="text"
                                                        placeholder="Project Name"
                                                        value={formData.projectName}
                                                        onChange={handleProjectNameChange}
                                                        className="w-full"
                                                        required
                                                    />
                                                </div>

                                                {/* Project Type Dropdown */}
                                                <div>
                                                    <Dropdown
                                                        options={projectTypeOptions}
                                                        selectedOption={selectedProjectType}
                                                        onSelect={handleProjectTypeSelect}
                                                        placeholder="Project Type (Group/Individual)"
                                                        className="w-full"
                                                    />
                                                </div>

                                                {/* Team Member Search - Only for Group Projects */}
                                                {isGroupProject && (
                                                    <div>
                                                        <SearchBar
                                                            placeholder="Team Member"
                                                            members={members.filter(member =>
                                                                !selectedTeamMembers.find(selected => selected.id === member.id)
                                                            )}
                                                            onSearch={handleTeamMemberSearch}
                                                            onSelect={handleSelectTeamMember}
                                                            onShowAll={handleShowAllTeamMembers}
                                                            maxResults={5}
                                                        />

                                                        {/* Selected Team Members Display */}
                                                        {selectedTeamMembers.length > 0 && (
                                                            <div className="mt-3">
                                                                <p className="caption mb-2">
                                                                    Selected Members ({selectedTeamMembers.length}):
                                                                </p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {selectedTeamMembers.map(member => (
                                                                        <div
                                                                            key={member.id}
                                                                            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                                                        >
                                                                            <span>{member.name}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveTeamMember(member.id)}
                                                                                className="text-blue-600 hover:cursor-pointer"
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

                                                {/* TextArea with FileDrop */}
                                                {(isGroupProject || isIndividualProject) && (
                                                    <div>
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
                                                            {formData.text.trim() === '' && (
                                                                <div className="mt-2">
                                                                    <FileDrop
                                                                        onFilesSelected={handleFilesSelected}
                                                                        accept=".pdf,.doc,.docx,.txt,.jpg,.png,.pptx,.xlsx"
                                                                        multiple={true}
                                                                        maxSize={10 * 1024 * 1024} // 10MB
                                                                    />
                                                                </div>
                                                            )}
                                                        </TextArea>

                                                        {/* Separate FileDrop when text has content */}
                                                        {formData.text.trim() !== '' && (
                                                            <div className="mt-4">
                                                                <label className="block caption mb-2">
                                                                    Attach Files
                                                                </label>
                                                                <FileDrop
                                                                    onFilesSelected={handleFilesSelected}
                                                                    accept=".pdf,.doc,.docx,.txt,.jpg,.png,.pptx,.xlsx"
                                                                    multiple={true}
                                                                    maxSize={10 * 1024 * 1024} // 10MB
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
                                                                                <span className="text-sm font-medium">{file.name}</span>
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

                                        {/* submit button */}
                                        <div className="self-end">
                                            <Button
                                                type="submit"
                                                variant="red"
                                            >
                                                Submit
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Right side description */}
                                    <div className="flex items-center justify-center overflow-hidden basis-1/3">
                                        <div className="text-center px-4">
                                            <p className="body-2">
                                                Some Text Description here on how to create project
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <AlertDialog
                isOpen={isAlertOpen}
                type={alertType}
                title={alertTitle}
                message={alertMsg}
                primaryButtonText={primaryButtonText}
                secondaryButtonText={secondaryButtonText}
                onPrimaryAction={() => {
                    if (alertType === 'info') {
                        showSuccessDialog();
                    } else {
                        setIsAlertOpen(false);
                        setAlertType('info');
                        setAlertTitle('Review your submission');
                        setPrimaryButtonText('Confirm');
                        setSecondaryButtonText('Cancel');
                    }
                }}
                onSecondaryAction={() => setIsAlertOpen(false)}
                onClose={() => setIsAlertOpen(false)}
                showCloseButton
                closeOnOverlayClick
            />

        </div>
    );
};

export default ProjectLanding;
