import React from "react";
import styles from "./button.module.css";

type ButtonVariant = 
    "red" | 
    "grey" | 
    "green" | 
    "blue" | 
    "darkBlue" |
    "purple" | 
    "white" |
    "whiteCard";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
}

function getButtonClass(variant?: ButtonVariant) {
  switch (variant) {
    case "red":
      return styles.btnRed;
    case "grey":
      return styles.btnGrey;
    case "green":
      return styles.btnGreen;
    case "blue":
      return styles.btnBlue;
    case "darkBlue":
      return styles.btnDarkBlue;
    case "purple":
      return styles.btnPurple;
    case "white":
      return styles.btnWhite;
    case "whiteCard":
      return styles.btnWhiteCard;
    default:
      return styles.btnRed; // fallback
  }
}
const Button: React.FC<ButtonProps> = ({
  variant = "red",
  className,
  children,
  ...props
}) => {
  const baseClass = variant === "whiteCard" ? "" : styles.btnBase;
  const variantClass = getButtonClass(variant);

  return (
    <button className={`${baseClass} ${variantClass} ${className || ""}`.trim()} {...props}>
      {children}
    </button>
  );
};

export default Button;
