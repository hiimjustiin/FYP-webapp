import React, { useState, useRef, useEffect } from "react";
import "./dropdown.css";
import ChevronIcon from "../../../assets/icons/chevron_down.svg"

export interface DropdownOption {
    id: string;
    label: string;
}

interface DropdownProps {
    options: DropdownOption[];
    selectedOption: DropdownOption | null;
    onSelect: (option: DropdownOption) => void;
    placeholder?: string;
    className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
    options,
    selectedOption,
    onSelect,
    placeholder = "Select an option",
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
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
        onSelect(option);
        setIsOpen(false);
    };

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
                    {selectedOption ? selectedOption.label : placeholder}
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
                </div>
            )}
        </div>
    );
};

export default Dropdown;
