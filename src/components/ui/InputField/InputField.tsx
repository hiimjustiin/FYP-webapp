import React, { useState, useRef, type InputHTMLAttributes, type ReactNode } from 'react';

import VisibilityFalse from '../../../assets/icons/visibility_false.svg';
import VisibilityTrue from '../../../assets/icons/visibility_true.svg';

import './InputField.css';

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value?: string;
    onChange?: (value: string) => void;
    label?: string;
    error?: string;
    required?: boolean;
    className?: string;
    type?: 'text' | 'email' | 'password' | 'date' | 'number' | 'tel' | 'url';
    icon?: ReactNode;
    showPasswordToggle?: boolean;
    disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
    value = '',
    onChange,
    label,
    error,
    required = false,
    className = '',
    type = 'text',
    showPasswordToggle = false,
    disabled = false,
    placeholder,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange && !disabled) {
            onChange(e.target.value);
        }
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className={`inputfield-container ${className}`}>
            {label && (
                <label className="inputfield-label subtitle-3">
                    {label}
                    {required && <span className="inputfield-required">*</span>}
                </label>
            )}

            <div className={`inputfield-wrapper ${isFocused ? 'inputfield-wrapper--focused' : ''} ${error ? 'inputfield-wrapper--error' : ''} ${disabled ? 'inputfield-wrapper--disabled' : ''}`}>
                <input
                    ref={inputRef}
                    type={inputType}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className={`inputfield body-2`}
                    disabled={disabled}
                    {...props}
                />

                {type === 'password' && showPasswordToggle && (
                    <button
                        type="button"
                        className="inputfield-password-toggle"
                        onClick={togglePasswordVisibility}
                        disabled={disabled}
                    >
                        {showPassword ? (
                            <img
                                src={VisibilityFalse}
                                alt="Hide Password"
                                width="20"
                                height="20"
                            />
                        ) : (
                            <img
                                src={VisibilityTrue}
                                alt="Show Password"
                                width="20"
                                height="20"
                            />
                        )}
                    </button>
                )}

                {type === 'date' && (
                    <span className="inputfield-icon inputfield-icon--right">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </span>
                )}
            </div>

            {error && <span className="inputfield-error caption">{error}</span>}
        </div>
    );
};

export default InputField;
