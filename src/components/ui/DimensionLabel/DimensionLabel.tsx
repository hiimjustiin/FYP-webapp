import React from 'react';
import './DimensionLabel.css';

export interface DimensionLabelProps {
    text: string;
    variant?: 'lime' | 'yellow' | 'purple' | 'teal' | 'blue' | 'grey' | 'green' | 'navy' | 'pink';
    size?: 'small' | 'medium' | 'large';
    className?: string;
    isSelected?: boolean;
    onClick?: () => void;
    disabled?: boolean;
}

const DimensionLabel: React.FC<DimensionLabelProps> = ({
    text,
    variant = 'grey',
    size = 'medium',
    className = '',
    isSelected = false,
    onClick,
    disabled = false
}) => {
    const handleClick = () => {
        if (!disabled && onClick) {
            onClick();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!disabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            className={`dimension-label dimension-label--${variant} dimension-label--${size} ${
                isSelected ? 'dimension-label--selected' : ''
            } ${
                onClick && !disabled ? 'dimension-label--clickable' : ''
            } ${
                disabled ? 'dimension-label--disabled' : ''
            } ${className}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-pressed={isSelected}
            aria-disabled={disabled}
        >
            <span className="dimension-label__text overline">{text}</span>
        </div>
    );
};

export default DimensionLabel;
