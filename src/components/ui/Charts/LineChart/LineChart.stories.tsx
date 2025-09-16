import { useState } from 'react';
import { DimensionLineChart } from './LineChart';
import DimensionLabelsContainer from '../../DimensionLabel/DimensionLabelsContainer';
import { Checkbox } from '../../Checkbox/Checkbox'; 

import "../../../../assets/fonts/typography.css";
import "../../../../assets/fonts/fonts.css";
import "../../../../assets/colors/colors.css";
import "../../../../../src/index.css";

export default {
    title: "Components/DimensionLineChart",
    component: DimensionLineChart,
    parameters: {
        layout: 'padded',
    },
};

const sampleData = [
    {
        submission: 'Draft',
        1: 5,
        2: 4,
        3: 2,
        4: 6,
        5: 4,
        6: 5,
        7: 6,
        8: 1,
        9: 3
    },
    {
        submission: 'Submit 1',
        1: 6,
        2: 4,
        3: 3,
        4: 6,
        5: 4,
        6: 6,
        7: 7,
        8: 1,
        9: 3
    },
    {
        submission: 'Submit 2',
        1: 6,
        2: 4,
        3: 2,
        4: 8,
        5: 5,
        6: 6,
        7: 7,
        8: 2,
        9: 4
    },
    {
        submission: 'Submit 3',
        1: 7,
        2: 5,
        3: 3,
        4: 8,
        5: 5,
        6: 7,
        7: 8,
        8: 2,
        9: 4
    },
    {
        submission: 'Submit 4',
        1: 8,
        2: 6,
        3: 4,
        4: 10,
        5: 6,
        6: 8,
        7: 9,
        8: 2,
        9: 5
    }
];

const dimensionConfig = [
    { id: '1', text: 'Frame the problem with an integrative approach', variant: 'lime' as const, color: 'var(--color-green-m1)' },
    { id: '2', text: 'Stakeholder consideration', variant: 'yellow' as const, color: 'var(--color-yellow)' },
    { id: '3', text: 'Range of disciplinary perspectives', variant: 'purple' as const, color: 'var(--color-purple)' },
    { id: '4', text: 'Disciplinary reasoning', variant: 'teal' as const, color: 'var(--color-teal)' },
    { id: '5', text: 'Credibility of disciplinary knowledge', variant: 'blue' as const, color: 'var(--color-blue-m3)' },
    { id: '6', text: 'Number of disciplinary integration', variant: 'grey' as const, color: 'var(--color-grey-80)' },
    { id: '7', text: 'Depth of disciplinary integration', variant: 'green' as const, color: 'var(--color-green-p1)' },
    { id: '8', text: 'Social (society) impact', variant: 'navy' as const, color: 'var(--color-blue-ntu)' },
    { id: '9', text: 'Limitations', variant: 'pink' as const, color: 'var(--color-red-p2)' }
];

const allSubmissions = ['Draft', 'Submit 1', 'Submit 2', 'Submit 3', 'Submit 4'];

export const Default = () => {
    const chartDimensions = dimensionConfig.map(d => ({
        id: d.id,
        text: d.text,
        color: d.color
    }));

    return (
        <DimensionLineChart
            data={sampleData}
            dimensions={chartDimensions}
            title="Student Performance Across Submissions"
            showArea={true}
        />
    );
};

export const Filtering = () => {
    const [selectedDimensions, setSelectedDimensions] = useState<string[]>(
        dimensionConfig.map(d => d.id)
    );
    const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>(
        allSubmissions
    );

    const filteredData = sampleData.filter(item => 
        selectedSubmissions.includes(item.submission)
    );

    const chartDimensions = dimensionConfig
        .filter(d => selectedDimensions.includes(d.id))
        .map(d => ({
            id: d.id,
            text: d.text,
            color: d.color
        }));

    const handleSubmissionToggle = (checked: boolean, submission?: string) => {
        if (!submission) return;
        
        setSelectedSubmissions(prev =>
            checked
                ? [...prev, submission]
                : prev.filter(s => s !== submission)
        );
    };

    return (
        <div>
            <div className="p-4 border-2 rounded-xl bg-blue-50 flex flex-col">
                <h4 className="mb-4 subtitle-2">Interactive Chart Controls</h4>
                
                <div className="mb-4">
                    <DimensionLabelsContainer
                        title="Select Dimensions"
                        dimensions={dimensionConfig}
                        selectedDimensions={selectedDimensions}
                        onDimensionToggle={setSelectedDimensions}
                        size="small"
                        multiSelect={true}
                        maxWidth="100%"
                    />
                </div>

                <div>
                    <h5 className="body-1">Select Submissions ({selectedSubmissions.length}/{allSubmissions.length})</h5>
                    <div className="gap-4 flex flex-wrap">
                        {allSubmissions.map(submission => (
                            <Checkbox
                                key={submission}
                                value={submission}
                                checked={selectedSubmissions.includes(submission)}
                                label={submission}
                                onChange={handleSubmissionToggle}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <DimensionLineChart
                data={filteredData}
                dimensions={chartDimensions}
                title={`Performance Analysis - ${selectedDimensions.length} Dimensions, ${selectedSubmissions.length} Submissions`}
                showArea={true}
                height={400}
            />
        </div>
    );
};
