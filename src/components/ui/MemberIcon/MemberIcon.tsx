import React from 'react';
import './MemberIcon.css';

export interface MemberIconProps {
    name: string;
    profilePicture?: string;
    size?: 'small' | 'medium' | 'large' | 'xlarge';
    backgroundColor?: 'blue' | 'pink' | 'green' | 'purple' | 'teal' | 'yellow' | 'auto';
    className?: string;
    onClick?: () => void;
    showBorder?: boolean;
}

const MemberIcon: React.FC<MemberIconProps> = ({
    name,
    profilePicture,
    size = 'medium',
    backgroundColor = 'auto',
    className = '',
    onClick,
    showBorder = false,
}) => {
    const getInitials = (fullName: string): string => {
        const names = fullName.trim().split(' ');
        if (names.length === 1) {
            return names[0].substring(0, 2).toUpperCase();
        }
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    };

    const getAutoBackgroundColor = (name: string): string => {
        const colors = ['blue', 'pink', 'green', 'purple', 'teal', 'yellow'];
        const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return colors[charSum % colors.length];
    };

    const finalBackgroundColor = backgroundColor === 'auto'
        ? getAutoBackgroundColor(name)
        : backgroundColor;

    const initials = getInitials(name);

    const handleClick = () => {
        if (onClick) onClick();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <div
            className={`member-icon member-icon--${size} member-icon--${finalBackgroundColor} ${showBorder ? 'member-icon--bordered' : ''} ${onClick ? 'member-icon--clickable' : ''} ${className}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={onClick ? 0 : -1}
            role={onClick ? 'button' : 'img'}
            aria-label={`${name}'s profile`}
        >
            {profilePicture ? (
                <img
                    src={profilePicture}
                    alt={`${name}'s profile`}
                    className="member-icon__image"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                />
            ) : (
                <span className="member-icon__initials caption">{initials}</span>
            )}
        </div>
    );
};

export default MemberIcon;
