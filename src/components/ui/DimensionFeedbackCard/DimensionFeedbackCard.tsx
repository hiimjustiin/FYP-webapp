import React, { useState } from "react";
import DimensionLabel from "../DimensionLabel/DimensionLabel";
import ChevronDown from "../../../assets/icons/chevron_down.svg";
import ChevronUp from "../../../assets/icons/chevron_up.svg";
import "./DimensionFeedbackCard.css";

export interface DimensionFeedbackCardProps {
  dimensionLabel: string;
  dimensionColor?: string; // Hex color code (e.g., #84CC16)
  dimensionVariant?:
    | "lime"
    | "yellow"
    | "purple"
    | "teal"
    | "blue"
    | "grey"
    | "green"
    | "navy"
    | "pink"; // Deprecated, use dimensionColor
  level: number;
  feedbackText: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

const DimensionFeedbackCard: React.FC<DimensionFeedbackCardProps> = ({
  dimensionLabel,
  dimensionColor,
  dimensionVariant,
  level,
  feedbackText,
  isExpanded = false,
  onToggleExpand,
  className = "",
}) => {
  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setExpanded(!expanded);
    }
  };

  const displayText = expanded
    ? feedbackText
    : feedbackText.slice(0, 150) + (feedbackText.length > 150 ? "..." : "");

  return (
    <div className={`dimension-feedback-card ${className}`}>
      <div className="dimension-feedback-header">
        <DimensionLabel
          text={dimensionLabel}
          color={dimensionColor}
          variant={dimensionVariant}
          size="medium"
        />
      </div>

      <div className="dimension-feedback-body">
        <div className="dimension-feedback-level">
          <span className="body-2">Your</span>
          <span className="body-2 font-medium">{dimensionLabel}</span>
          <span className="body-2">
            level is <strong>{level}</strong>
          </span>
        </div>

        <p
          className={`dimension-feedback-text caption ${
            expanded ? "expanded" : "collapsed"
          }`}
        >
          {displayText}
        </p>

        {feedbackText.length > 150 && (
          <button
            className="dimension-feedback-expand"
            onClick={handleToggle}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <span className="body-2">{expanded ? "Collapse" : "Expand"}</span>
            <img
              src={expanded ? ChevronUp : ChevronDown}
              alt=""
              className="chevron-icon"
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default DimensionFeedbackCard;
