import React from 'react';
import DimensionLabel from './DimensionLabel';
import './DimensionLabelsContainer.css';

export interface Dimension {
    id: string;
    text: string;
    variant: 'lime' | 'yellow' | 'purple' | 'teal' | 'blue' | 'grey' | 'green' | 'navy' | 'pink';
}

interface DimensionLabelsContainerProps {
    title?: string;
    dimensions: Dimension[];
    selectedDimensions?: string[];
    onDimensionToggle?: (selectedIds: string[]) => void;
    size?: 'small' | 'medium' | 'large';
    className?: string;
    maxWidth?: string;
    multiSelect?: boolean;
}

const DimensionLabelsContainer: React.FC<DimensionLabelsContainerProps> = ({
    title = "Label/Dimension",
    dimensions,
    selectedDimensions = [],
    onDimensionToggle,
    size = 'small',
    className = '',
    maxWidth = '700px',
    multiSelect = true
}) => {
    const handleDimensionClick = (dimensionId: string) => {
        if (!onDimensionToggle) return;
        
        if (!multiSelect) {
            if (selectedDimensions.includes(dimensionId)) {
                onDimensionToggle([]);
            } else {
                onDimensionToggle([dimensionId]);
            }
        } else {
            if (selectedDimensions.includes(dimensionId)) {
                onDimensionToggle(selectedDimensions.filter(id => id !== dimensionId));
            } else {
                onDimensionToggle([...selectedDimensions, dimensionId]);
            }
        }
    };

    return (
        <div className={`dimension-labels-container ${className}`} style={{ maxWidth }}>
            <div className="dimension-labels-header">
                <h3 className="dimension-labels-title body-1">{title}</h3>
                {selectedDimensions.length > 0 && (
                    <span className="dimension-labels-counter overline">
                        {selectedDimensions.length} selected {!multiSelect && '(single mode)'}
                    </span>
                )}
            </div>
            <div className="dimension-labels-grid">
                {dimensions.map((dimension) => (
                    <DimensionLabel
                        key={dimension.id}
                        text={dimension.text}
                        variant={dimension.variant}
                        size={size}
                        isSelected={selectedDimensions.includes(dimension.id)}
                        onClick={() => handleDimensionClick(dimension.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default DimensionLabelsContainer;
