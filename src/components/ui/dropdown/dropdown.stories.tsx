import React from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import Dropdown from "./Dropdown";
import type { DropdownOption } from "./Dropdown";


export default {
    title: "Components/Dropdown",
    component: Dropdown,
    parameters: {
        layout: 'padded',
    },
};

const shortOptions: DropdownOption[] = [
    { id: '1', label: 'Option 1' },
    { id: '2', label: 'Option 2' },
    { id: '3', label: 'Option 3' },
];

const projectOptions: DropdownOption[] = [
    { id: '1', label: 'Project 1: Effects of Climate Change on Marine Life' },
    { id: '2', label: 'Project 2: Pros and Cons of Interdisciplinary Learning' },
    { id: '3', label: 'Project 3: Healthy Living Starts with a Healthy Diet' },
    { id: '4', label: 'Project 4: Digital Transformation in Education' },
    { id: '5', label: 'Project 5: Sustainable Urban Planning for Smart Cities' },
    { id: '6', label: 'Project 6: AI Ethics in Healthcare Applications' },
    { id: '7', label: 'Project 7: Renewable Energy Solutions' },
    { id: '8', label: 'Project 8: Social Media Impact on Mental Health' },
];

export const Default = () => {
    const [selectedOption, setSelectedOption] = React.useState<DropdownOption | null>(null);

    return (
        <div style={{ width: '360px' }}>
            <Dropdown
                options={projectOptions}
                selectedOption={selectedOption}
                onSelect={setSelectedOption}
                placeholder="Select an option..."
            />
        </div>
    );
};

// Short options
export const ShortOptions = () => {
    const [selectedOption, setSelectedOption] = React.useState<DropdownOption | null>(null);

    return (
        <div style={{ width: '200px' }}>
            <Dropdown
                options={shortOptions}
                selectedOption={selectedOption}
                onSelect={setSelectedOption}
                placeholder="Choose an option"
            />
        </div>
    );
};
