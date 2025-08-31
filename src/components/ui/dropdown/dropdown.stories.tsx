import React from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import Dropdown from "./dropdown";
import type { DropdownOption } from "./dropdown";


export default {
    title: "Components/Dropdown",
    component: Dropdown,
    parameters: {
        layout: 'padded',
    },
};

// Sample data for different scenarios
const projectOptions: DropdownOption[] = [
    { id: '1', label: 'Project 1: Effects of Climate Change on Marine Life' },
    { id: '2', label: 'Project 2: Pros and Cons of Interdisciplinary Learning' },
    { id: '3', label: 'Project 3: Healthy Living Starts with a Healthy Diet' },
];

const shortOptions: DropdownOption[] = [
    { id: '1', label: 'Option 1' },
    { id: '2', label: 'Option 2' },
    { id: '3', label: 'Option 3' },
];

const manyOptions: DropdownOption[] = [
    { id: '1', label: 'Project 1: Effects of Climate Change on Marine Life' },
    { id: '2', label: 'Project 2: Pros and Cons of Interdisciplinary Learning' },
    { id: '3', label: 'Project 3: Healthy Living Starts with a Healthy Diet' },
    { id: '4', label: 'Project 4: Digital Transformation in Education' },
    { id: '5', label: 'Project 5: Sustainable Urban Planning for Smart Cities' },
    { id: '6', label: 'Project 6: AI Ethics in Healthcare Applications' },
    { id: '7', label: 'Project 7: Renewable Energy Solutions' },
    { id: '8', label: 'Project 8: Social Media Impact on Mental Health' },
];

// Default story
export const Default = () => (
    <div style={{ width: '400px' }}>
        <Dropdown
            options={projectOptions}
            selectedOption={null}
            onSelect={(option) => console.log('Selected:', option)}
            placeholder="Project 1 (recent)"
        />
    </div>
);

// With selection
export const WithSelection = () => (
    <div style={{ width: '400px' }}>
        <Dropdown
            options={projectOptions}
            selectedOption={projectOptions[0]}
            onSelect={(option) => console.log('Selected:', option)}
            placeholder="Select a project"
        />
    </div>
);

// Short options
export const ShortOptions = () => (
    <div style={{ width: '300px' }}>
        <Dropdown
            options={shortOptions}
            selectedOption={null}
            onSelect={(option) => console.log('Selected:', option)}
            placeholder="Choose an option"
        />
    </div>
);

// Many options (scrollable)
export const ManyOptions = () => (
    <div style={{ width: '450px' }}>
        <Dropdown
            options={manyOptions}
            selectedOption={null}
            onSelect={(option) => console.log('Selected:', option)}
            placeholder="Select from many projects"
        />
    </div>
);

// Small width
export const SmallWidth = () => (
    <div style={{ width: '200px' }}>
        <Dropdown
            options={shortOptions}
            selectedOption={null}
            onSelect={(option) => console.log('Selected:', option)}
            placeholder="Small dropdown"
        />
    </div>
);

// Custom placeholder
export const CustomPlaceholder = () => (
    <div style={{ width: '400px' }}>
        <Dropdown
            options={projectOptions}
            selectedOption={null}
            onSelect={(option) => console.log('Selected:', option)}
            placeholder="Please select a project to continue..."
        />
    </div>
);

// Interactive example showing state changes
export const Interactive = () => {
    const [selectedOption, setSelectedOption] = React.useState<DropdownOption | null>(null);

    return (
        <div style={{ width: '400px' }}>
            <Dropdown
                options={projectOptions}
                selectedOption={selectedOption}
                onSelect={setSelectedOption}
                placeholder="Interactive dropdown"
            />
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <strong>Selected:</strong> {selectedOption ? selectedOption.label : 'None'}
            </div>
        </div>
    );
};

// Different states showcase
export const States = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '400px' }}>
        <div>
            <h4 style={{ marginBottom: '8px' }}>Default State</h4>
            <Dropdown
                options={projectOptions}
                selectedOption={null}
                onSelect={(option) => console.log('Selected:', option)}
                placeholder="Project 1 (recent)"
            />
        </div>

        <div>
            <h4 style={{ marginBottom: '8px' }}>Selected State</h4>
            <Dropdown
                options={projectOptions}
                selectedOption={projectOptions[1]}
                onSelect={(option) => console.log('Selected:', option)}
                placeholder="Project 1 (recent)"
            />
        </div>
    </div>
);
