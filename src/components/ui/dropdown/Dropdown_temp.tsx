import React, { useState, useRef, useEffect, type ReactNode } from "react";
import "./Dropdown_temp.css";
import ChevronIcon from "../../../assets/icons/chevron_down.svg"

export interface DropdownOption {
    id: string;
    label: string;
}

interface DropdownProps {
    options?: DropdownOption[]; // Make options optional
    selectedOption?: DropdownOption | null;
    onSelect?: (option: DropdownOption) => void;
    placeholder?: string;
    className?: string;
    children?: ReactNode; // Add children prop for custom content
    customTriggerText?: string; // For custom trigger text (like date display)
}

const Dropdown: React.FC<DropdownProps> = ({
    options = [],
    selectedOption,
    onSelect,
    placeholder = "Select an option",
    className = "",
    children,
    customTriggerText,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleOptionSelect = (option: DropdownOption) => {
        if (onSelect) onSelect(option);
        setIsOpen(false);
    };

    const handleClose = () => setIsOpen(false);

    return (
        <div className={`dropdown-container ${className}`} ref={dropdownRef}>
            {/* Dropdown Trigger */}
            <button
                className={`dropdown-trigger body-2 ${isOpen ? "dropdown-trigger--open" : ""
                    }`}
                onClick={toggleDropdown}
                type="button"
            >
                <span className="dropdown-trigger__text">
                    {customTriggerText || (selectedOption ? selectedOption.label : placeholder)}
                </span>
                <img
                    src={ChevronIcon}
                    alt="dropdown arrow"
                    className={`dropdown-trigger__icon ${isOpen ? "dropdown-trigger__icon--rotated" : ""
                        }`}
                    width="40"
                    height="40"
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="dropdown-menu">
                    {/* Render custom content (like Calendar) if provided */}
                    {children ? (
                        <div className="dropdown-custom-content">
                            {React.isValidElement(children) 
                                ? React.cloneElement(children as React.ReactElement<{ onClose?: () => void }>, { onClose: handleClose })
                                : children
                            }
                        </div>
                    ) : (
                        /* Render normal dropdown options */
                        <div className="dropdown-menu__content">
                            {options.map((option) => (
                                <button
                                    key={option.id}
                                    className={`dropdown-option body-2 ${selectedOption?.id === option.id
                                            ? "dropdown-option--selected"
                                            : ""
                                        }`}
                                    onClick={() => handleOptionSelect(option)}
                                    type="button"
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dropdown;
