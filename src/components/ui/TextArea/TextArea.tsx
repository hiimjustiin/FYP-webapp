import React, { useState, useRef, type TextareaHTMLAttributes, type ReactNode} from 'react';
import './TextArea.css';

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
    label?: string;
    required?: boolean;
    rows?: number;
    maxLength?: number;
    showCharCount?: boolean;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
    children?: ReactNode;
}

const TextArea: React.FC<TextAreaProps> = ({
    value = '',
    onChange,
    placeholder = "Type your message here.",
    className = '',
    error,
    label,
    required = false,
    rows = 4,
    maxLength,
    showCharCount = false,
    resize = 'vertical',
    disabled = false,
    children,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    const characterCount = value.length;
    const isOverLimit = maxLength ? characterCount > maxLength : false;

    return (
        <div className={`textarea-container ${className}`}>
            {label && (
                <label className="textarea-label subtitle-3">
                    {label}
                    {required && <span className="textarea-required">*</span>}
                </label>
            )}

            <div className={`textarea-wrapper ${isFocused ? 'textarea-wrapper--focused' : ''} ${error ? 'textarea-wrapper--error' : ''} ${disabled ? 'textarea-wrapper--disabled' : ''}`}>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className={`textarea body-2 ${resize ? `textarea--resize-${resize}` : ''}`}
                    rows={rows}
                    maxLength={maxLength}
                    disabled={disabled}
                    {...props}
                />
                {children && <div className="textarea-children">{children}</div>}
            </div>

            <div className="textarea-footer">
                {error && <span className="textarea-error caption">{error}</span>}
                {showCharCount && maxLength && (
                    <span className={`textarea-char-count caption ${isOverLimit ? 'textarea-char-count--error' : ''}`}>
                        {characterCount}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    );
};

export default TextArea;
