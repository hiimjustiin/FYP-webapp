import React from 'react';
import './Checkbox.css';

export interface CheckboxProps {
    value?: string;
    name?: string;
    checked?: boolean;
    label?: string;
    disabled?: boolean;
    onChange?: (checked: boolean, value?: string) => void;
    className?: string;
    indeterminate?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    value,
    name,
    checked = false,
    label,
    disabled = false,
    onChange,
    className = '',
    indeterminate = false,
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange && !disabled) {
            onChange(event.target.checked, value);
        }
    };

    return (
        <label
            className={`checkbox ${disabled ? 'checkbox--disabled' : ''} ${className}`}
        >
            <input
                type="checkbox"
                value={value}
                name={name}
                checked={checked}
                disabled={disabled}
                onChange={handleChange}
                className="checkbox__input"
                ref={(input) => {
                    if (input) input.indeterminate = indeterminate;
                }}
            />
            <span className={`checkbox__custom ${indeterminate ? 'checkbox__custom--indeterminate' : ''}`}>
                <svg className="checkbox__checkmark" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <svg className="checkbox__indeterminate" viewBox="0 0 16 16" fill="none">
                    <path
                        d="M4 7a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-2z"
                        fill="currentColor"
                    />
                </svg>
            </span>
            {label && <span className="checkbox__label caption">{label}</span>}
        </label>
    );
};
