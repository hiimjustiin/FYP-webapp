import React from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import Dropdown from "./Dropdown";
import type { DropdownOption } from "./Dropdown";
import Calendar from "../Calendar/Calendar";


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

export const CalendarDropdown = () => {
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-UK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div style={{ width: '320px' }}>
            <Dropdown
                placeholder="Start Date"
                customTriggerText={selectedDate ? formatDate(selectedDate) : undefined}
            >
                <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                />
            </Dropdown>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-grey-05)', borderRadius: '8px' }}>
                <strong>Selected Date:</strong> {selectedDate ? formatDate(selectedDate) : 'No date selected'}
            </div>
        </div>
    );
};

export const DateRangePicker = () => {
    const [startDate, setStartDate] = React.useState<Date | null>(null);
    const [endDate, setEndDate] = React.useState<Date | null>(null);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-UK', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '700px' }}>
            <Dropdown
                placeholder="Start Date"
                customTriggerText={startDate ? formatDate(startDate) : undefined}
            >
                <Calendar
                    selectedDate={startDate}
                    onDateSelect={setStartDate}
                />
            </Dropdown>
            
            <span className='body-2'>to</span>
            
            <Dropdown
                placeholder="End Date"
                customTriggerText={endDate ? formatDate(endDate) : undefined}
            >
                <Calendar
                    selectedDate={endDate}
                    onDateSelect={setEndDate}
                />
            </Dropdown>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-grey-05)', borderRadius: '8px', width: '100%' }}>
                <strong>Range:</strong> 
                {startDate && endDate 
                    ? `${formatDate(startDate)} - ${formatDate(endDate)}` 
                    : 'No range selected'}
            </div>
        </div>
    );
};
