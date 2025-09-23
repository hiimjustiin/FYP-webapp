import { useState } from 'react';
import Button from "../components/ui/Button/Button";
import SearchBar, { type Member } from "../components/ui/SearchBar/SearchBar";
import Dropdown, { type DropdownOption } from "../components/ui/Dropdown/Dropdown";
import InputField from "../components/ui/InputField/InputField";

const Project = () => {
    const [formData, setFormData] = useState({
        course: '',
        projectName: '',
        projectType: ''
    });

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
        { id: 'group', label: 'Group' },
        { id: 'individual', label: 'Individual' }
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

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Form submitted:', {
            ...formData,
            course: selectedCourse?.label || '',
            projectType: selectedProjectType?.label || ''
        });
        // Handle form submission logic here
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

    // Dropdown event handlers
    const handleCourseSelect = (option: DropdownOption) => {
        setSelectedCourse(option);
        handleInputChange('course', option.label);
    };

    const handleProjectTypeSelect = (option: DropdownOption) => {
        setSelectedProjectType(option);
        handleInputChange('projectType', option.label);
    };

    // InputField event handler
    const handleProjectNameChange = (value: string) => {
        handleInputChange('projectName', value);
    };

    return (
        <div className="p-3 sm:p-4 lg:p-6 h-screen flex flex-col">
            <div className="max-w-7xl flex-1 flex flex-col">
                <div className="space-y-4 flex flex-col flex-1">
                    {/* row: header card and searchbar within section card */}
                    <div className="flex flex-row justify-between items-center gap-4">
                        <div className="dashboard-card flex-7/12 px-4 py-2">
                            <h5 className="heading-5">New Project</h5>
                            <p className="subtitle-2 text-grey-80">New Project Submission</p>
                        </div>
                        <div className="dashboard-card flex flex-5/12 items-center px-4 py-2 h-20">
                            <SearchBar
                                placeholder="Person / Project Name"
                                members={members}
                                onSearch={handleSearch}
                                onSelect={handleSelectMember}
                                onShowAll={handleShowAll}
                                maxResults={5}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 min-h-0">
                        <div className="dashboard-card px-4 py-4 w-full h-full">
                            <form onSubmit={handleSubmit} className="h-full">
                                {/* left dropdowns and button, right text descriptions */}
                                <div className="flex flex-row w-full h-full gap-2">
                                    {/* dropdowns and submit button */}
                                    <div className="flex flex-col flex-2/3 p-4 justify-between min-w-96">
                                        {/* dropdowns */}
                                        <div className="flex flex-col w-sm space-y-6">
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
                                        </div>
                                        
                                        {/* submit button */}
                                        <div className="flex self-end">
                                            <Button
                                                type="submit"
                                                variant="red"
                                            >
                                                Submit
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {/* Right side description */}
                                    <div className="flex items-center justify-center flex-1/3">
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
        </div>
    );
};

export default Project;
