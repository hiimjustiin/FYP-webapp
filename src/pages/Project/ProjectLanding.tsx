import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from "../../components/ui/Button/Button";
import SearchBar, { type Member } from "../../components/ui/SearchBar/SearchBar";
import { AlertDialog, type AlertDialogType } from "../../components/ui/AlertDialog/AlertDialog";

const ProjectLanding = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        course: '',
        projectName: '',
        projectType: '',
        text: ''
    });

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
