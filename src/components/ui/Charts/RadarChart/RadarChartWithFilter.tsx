import React, { useState } from 'react';
import RadarChart, { type RadarDataPoint } from './RadarChart';
import DimensionLabel from '../../DimensionLabel/DimensionLabel';
import Button from '../../Button/Button';

interface RadarChartWithFilterProps {
    data: RadarDataPoint[];
    className?: string;
}

const ALL_DIMENSIONS = [
    { id: '1', text: 'Frame the problem with an integrative approach', variant: 'lime' as const },
    { id: '2', text: 'Stakeholder consideration', variant: 'yellow' as const },
    { id: '3', text: 'Range of disciplinary perspectives', variant: 'purple' as const },
    { id: '4', text: 'Disciplinary reasoning', variant: 'teal' as const },
    { id: '5', text: 'Credibility of disciplinary knowledge', variant: 'blue' as const },
    { id: '6', text: 'Number of disciplinary integration', variant: 'grey' as const },
    { id: '7', text: 'Depth of disciplinary integration', variant: 'green' as const },
    { id: '8', text: 'Social (society) impact', variant: 'navy' as const },
    { id: '9', text: 'Limitations', variant: 'pink' as const }
];

const RadarChartWithFilter: React.FC<RadarChartWithFilterProps> = ({
    data,
    className = ''
}) => {
    const [selectedDimensions, setSelectedDimensions] = useState<string[]>(
        ALL_DIMENSIONS.slice(0, 5).map(d => d.text)
    );

    const handleDimensionToggle = (dimensionText: string) => {
        setSelectedDimensions(prev =>
            prev.includes(dimensionText)
                ? prev.filter(d => d !== dimensionText)
                : [...prev, dimensionText]
        );
    };

    const handleSelectAll = () => {
        setSelectedDimensions(ALL_DIMENSIONS.map(d => d.text));
    };

    const handleClearAll = () => {
        setSelectedDimensions([]);
    };

    return (
        <div className={`radar-chart-with-filter ${className}`}>
            {/* Filter Controls */}
            <div className="filter-section">
                <div className="filter-header">
                    <h3 className="heading-5">Select Dimensions</h3>
                    <div className="filter-actions">
                        <Button
                            variant="green"
                            onClick={handleSelectAll}
                            disabled={selectedDimensions.length === ALL_DIMENSIONS.length}
                        >
                            Select All
                        </Button>
                        <Button
                            variant="grey"
                            onClick={handleClearAll}
                            disabled={selectedDimensions.length === 0}
                        >
                            Clear All
                        </Button>
                    </div>
                </div>
                
                {/* Dimension Tags Filter */}
                <div className="dimension-tags-container">
                    {ALL_DIMENSIONS.map((dimension) => (
                        <DimensionLabel
                            key={dimension.id}
                            text={dimension.text}
                            variant={dimension.variant}
                            isSelected={selectedDimensions.includes(dimension.text)}
                            onClick={() => handleDimensionToggle(dimension.text)}
                            size="medium"
                        />
                    ))}
                </div>
                
                <div className="filter-info">
                    <p className="caption">
                        {selectedDimensions.length} of {ALL_DIMENSIONS.length} dimensions selected
                    </p>
                </div>
            </div>

            {/* Radar Chart */}
            <div className="chart-section">
                <RadarChart
                    key={selectedDimensions.sort().join('_')}
                    data={data}
                    selectedDimensions={selectedDimensions}
                    height={500}
                />
            </div>
        </div>
    );
};

export default RadarChartWithFilter;
