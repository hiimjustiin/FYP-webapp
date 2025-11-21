import React from "react";
import Dropdown, { type DropdownOption } from "../../ui/Dropdown/Dropdown";
import "./ComparisonSelector.css";

export interface ComparisonSelectorProps {
  submissions: DropdownOption[];
  leftSubmission: string;
  rightSubmission: string;
  onLeftChange: (value: string) => void;
  onRightChange: (value: string) => void;
  className?: string;
}

const ComparisonSelector: React.FC<ComparisonSelectorProps> = ({
  submissions,
  leftSubmission,
  rightSubmission,
  onLeftChange,
  onRightChange,
  className = "",
}) => {
  return (
    <div className={`comparison-selector ${className}`}>
      <div className="comparison-selector-label">
        <h4 className="body-1">Choose two submits to compare</h4>
      </div>

      <div className="comparison-selector-controls">
        <div className="comparison-selector-dropdown">
          <Dropdown
            options={submissions}
            selectedOption={
              submissions.find((s) => s.id === leftSubmission) || null
            }
            onSelect={(option) => onLeftChange(option.id)}
            placeholder="Select submission"
          />
        </div>

        <div className="comparison-selector-divider">
          <span className="body-1 font-medium">V.s.</span>
        </div>

        <div className="comparison-selector-dropdown">
          <Dropdown
            options={submissions}
            selectedOption={
              submissions.find((s) => s.id === rightSubmission) || null
            }
            onSelect={(option) => onRightChange(option.id)}
            placeholder="Select submission"
          />
        </div>
      </div>
    </div>
  );
};

export default ComparisonSelector;
