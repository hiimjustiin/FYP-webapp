import React from "react";
import "./StarRating.css";

export interface StarRatingProps {
  initialRating: number;
  finalRating: number;
  showArrow?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  initialRating,
  finalRating,
  showArrow = true,
  size = "medium",
  className = "",
}) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`star-${i}`} className="star-icon filled">
          ⭐
        </span>
      );
    }

    return stars;
  };

  return (
    <div className={`star-rating star-rating-${size} ${className}`}>
      <div className="star-rating-group">
        <span className="star-rating-label caption">Initial</span>
        <div className="star-rating-stars">
          {renderStars(initialRating)}
          {initialRating === 0 && (
            <span className="star-rating-none caption">None</span>
          )}
        </div>
      </div>

      {showArrow && (
        <div className="star-rating-arrow">
          <svg
            width="16"
            height="2"
            viewBox="0 0 16 2"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 1H16" stroke="var(--color-grey-55)" strokeWidth="1" />
          </svg>
        </div>
      )}

      <div className="star-rating-group">
        <span className="star-rating-label caption">Final</span>
        <div className="star-rating-stars">
          {renderStars(finalRating)}
          {finalRating === 0 && (
            <span className="star-rating-none caption">None</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StarRating;
