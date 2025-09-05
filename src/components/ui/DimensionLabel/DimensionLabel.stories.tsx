import React from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import DimensionLabel from "./DimensionLabel";
import DimensionLabelsContainer, { type Dimension } from "./DimensionLabelsContainer";
import Button from '../Button/Button';

export default {
    title: "Components/DimensionLabel",
    component: DimensionLabel,
    parameters: {
        layout: 'padded',
    },
};

// Filtering example
export const FilteringExample = () => {
    const [selectedDimensions, setSelectedDimensions] = React.useState<string[]>([]);

    const dimensions: Dimension[] = [
        { id: '1', text: 'Frame the problem with an integrative approach', variant: 'lime' },
        { id: '2', text: 'Stakeholder consideration', variant: 'yellow' },
        { id: '3', text: 'Range of disciplinary perspectives', variant: 'purple' },
        { id: '4', text: 'Disciplinary reasoning', variant: 'teal' },
        { id: '5', text: 'Credibility of disciplinary knowledge', variant: 'blue' },
        { id: '6', text: 'Number of disciplinary integration', variant: 'grey' },
        { id: '7', text: 'Depth of disciplinary integration', variant: 'green' },
        { id: '8', text: 'Social (society) impact', variant: 'navy' },
        { id: '9', text: 'Limitations', variant: 'pink' }
    ];

    const handleDimensionToggle = (selectedIds: string[]) => {
        setSelectedDimensions(selectedIds);
    };

    const clearFilters = () => {
        setSelectedDimensions([]);
    };

    const selectAll = () => {
        setSelectedDimensions(dimensions.map(d => d.id));
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <DimensionLabelsContainer
                title="Filter by Dimensions"
                dimensions={dimensions}
                selectedDimensions={selectedDimensions}
                onDimensionToggle={handleDimensionToggle}
            />

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <Button
                    onClick={clearFilters}
                    variant='grey'
                >
                    Clear All
                </Button>
                <Button
                    onClick={selectAll}
                    variant='green'
                >
                    Select All
                </Button>
            </div>

            {selectedDimensions.length > 0 && (
                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '12px',
                    border: '1px solid #e0f2fe'
                }}>
                    <strong>Active Filters:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        {selectedDimensions.map(id => {
                            const dimension = dimensions.find(d => d.id === id);
                            return <li key={id}>{dimension?.text}</li>;
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Single select mode
export const SingleSelectMode = () => {
    const [selectedDimension, setSelectedDimension] = React.useState<string>('');

    const dimensions: Dimension[] = [
        { id: '1', text: 'Integration', variant: 'lime' },
        { id: '2', text: 'Stakeholders', variant: 'yellow' },
        { id: '3', text: 'Perspectives', variant: 'purple' },
        { id: '4', text: 'Reasoning', variant: 'teal' },
        { id: '5', text: 'Knowledge', variant: 'blue' }
    ];

    const handleDimensionToggle = (dimensionId: string) => {
        setSelectedDimension(prev => prev === dimensionId ? '' : dimensionId);
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <h4>Single Selection Mode</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                {dimensions.map((dimension) => (
                    <DimensionLabel
                        key={dimension.id}
                        text={dimension.text}
                        variant={dimension.variant}
                        isSelected={selectedDimension === dimension.id}
                        onClick={() => handleDimensionToggle(dimension.id)}
                    />
                ))}
            </div>

            {selectedDimension && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                    <strong>Selected:</strong> {dimensions.find(d => d.id === selectedDimension)?.text}
                </div>
            )}
        </div>
    );
};

// Different sizes
export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
            <h4>Small</h4>
            <DimensionLabel text="Stakeholder consideration" variant="yellow" size="small" />
        </div>
        <div>
            <h4>Medium</h4>
            <DimensionLabel text="Stakeholder consideration" variant="yellow" size="medium" />
        </div>
        <div>
            <h4>Large</h4>
            <DimensionLabel text="Stakeholder consideration" variant="yellow" size="large" />
        </div>
    </div>
);

// All Dimensions
export const AllDimensions = () => {
    const dimensions: Dimension[] = [
        { id: '1', text: 'Frame the problem with an integrative approach', variant: 'lime' },
        { id: '2', text: 'Stakeholder consideration', variant: 'yellow' },
        { id: '3', text: 'Range of disciplinary perspectives', variant: 'purple' },
        { id: '4', text: 'Disciplinary reasoning', variant: 'teal' },
        { id: '5', text: 'Credibility of disciplinary knowledge', variant: 'blue' },
        { id: '6', text: 'Number of disciplinary integration', variant: 'grey' },
        { id: '7', text: 'Depth of disciplinary integration', variant: 'green' },
        { id: '8', text: 'Social (society) impact', variant: 'navy' },
        { id: '9', text: 'Limitations', variant: 'pink' }
    ];

    return (
        <DimensionLabelsContainer
            title="Label/Dimension"
            dimensions={dimensions}
            size="medium"
        />
    );
};
