import React from "react";
import DimensionLabel from "../DimensionLabel/DimensionLabel";
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
  className = "",
}) => {
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

        <p className="dimension-feedback-text caption">
          {feedbackText}
        </p>
      </div>
    </div>
  );
};

export default DimensionFeedbackCard;
