import React from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import SearchBar, { type Member } from "./SearchBar";

export default {
    title: "Components/SearchBar",
    component: SearchBar,
    parameters: {
        layout: 'padded',
    },
};

const sampleMembers: Member[] = [
    { id: '1', name: 'Leslie Warren', backgroundColor: 'blue' },
    { id: '2', name: 'Esther Howard', backgroundColor: 'pink' },
    { id: '3', name: 'Guy Walkings', backgroundColor: 'green' },
    { id: '4', name: 'Warren Buffett', backgroundColor: 'purple' },
    { id: '5', name: 'Walter White', backgroundColor: 'teal' },
    { id: '6', name: 'William Shakespeare', backgroundColor: 'yellow' },
    { id: '7', name: 'Winston Churchill', backgroundColor: 'blue' },
    { id: '8', name: 'Walt Disney', backgroundColor: 'green' },
];

export const Default = () => {
    const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');

    return (
        <div style={{ width: '400px' }}>
            <SearchBar
                members={sampleMembers}
                placeholder="Search..."
                onSearch={setSearchQuery}
                onSelect={setSelectedMember}
            />

            {(selectedMember || searchQuery) && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                    {selectedMember && <div><strong>Selected:</strong> {selectedMember.name}</div>}
                </div>
            )}
        </div>
    );
};

export const CustomPlaceholder = () => (
    <div style={{ width: '400px' }}>
        <SearchBar
            members={sampleMembers}
            placeholder="Type to search members..."
            onSelect={(member) => console.log('Selected:', member)}
        />
    </div>
);
