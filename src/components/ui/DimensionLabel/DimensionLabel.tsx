import React from "react";
import "./DimensionLabel.css";

export interface DimensionLabelProps {
  text: string;
  color?: string; // Hex color code (e.g., #84CC16)
  variant?:
    | "lime"
    | "yellow"
    | "purple"
    | "teal"
    | "blue"
    | "grey"
    | "green"
    | "navy"
    | "pink"; // Deprecated, use color instead
  size?: "small" | "medium" | "large";
  className?: string;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const DimensionLabel: React.FC<DimensionLabelProps> = ({
  text,
  color,
  variant = "grey",
  size = "medium",
  className = "",
  isSelected = false,
  onClick,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  // If color is provided, use inline styles; otherwise fall back to CSS class
  const style = color
    ? {
        backgroundColor: `${color}20`, // 20% opacity
        color: color,
        borderColor: `${color}40`, // 40% opacity
      }
    : undefined;

  const variantClass = color ? "" : `dimension-label--${variant}`;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={`dimension-label ${variantClass} dimension-label--${size} ${
        isSelected ? "dimension-label--selected" : ""
      } ${onClick && !disabled ? "dimension-label--clickable" : ""} ${
        disabled ? "dimension-label--disabled" : ""
      } ${className}`}
      style={style}
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
