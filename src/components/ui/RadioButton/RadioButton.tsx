import React from 'react';
import './RadioButton.css';

export interface RadioButtonProps {
    value: string;
    name: string;
    checked?: boolean;
    label?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
    className?: string;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
    value,
    name,
    checked = false,
    label,
    disabled = false,
    onChange,
    className = '',
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange && !disabled) {
            onChange(event.target.value);
        }
    };

    return (
        <label
            className={`radio-button ${disabled ? 'radio-button--disabled' : ''} ${className}`}
        >
            <input
                type="radio"
                value={value}
                name={name}
                checked={checked}
                disabled={disabled}
                onChange={handleChange}
                className="radio-button__input"
            />
            <span className="radio-button__custom"></span>
            {label && <span className="radio-button__label caption">{label}</span>}
        </label>
    );
};
