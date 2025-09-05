import React from 'react';
import MemberIcon from './MemberIcon';
import './MemberGroup.css';

export interface Member {
    id: string;
    name: string;
    profilePicture?: string;
    backgroundColor?: 'blue' | 'pink' | 'green' | 'purple' | 'teal' | 'yellow' | 'auto';
}

interface MemberGroupProps {
    members: Member[];
    size?: 'small' | 'medium' | 'large' | 'xlarge';
    maxVisible?: number;
    onMemberClick?: (member: Member) => void;
    onMoreClick?: () => void;
    className?: string;
    layout?: 'horizontal' | 'stacked';
}

const MemberGroup: React.FC<MemberGroupProps> = ({
    members,
    size = 'medium',
    maxVisible = 5,
    onMemberClick,
    onMoreClick,
    className = '',
    layout = 'horizontal'
}) => {
    const visibleMembers = members.slice(0, maxVisible);
    const remainingCount = members.length - maxVisible;

    return (
        <div className={`member-group member-group--${layout} ${className}`}>
            {visibleMembers.map((member, index) => (
                <MemberIcon
                    key={member.id}
                    name={member.name}
                    profilePicture={member.profilePicture}
                    backgroundColor={member.backgroundColor}
                    size={size}
                    onClick={() => onMemberClick?.(member)}
                    className={layout === 'stacked' ? `member-group__item--stacked-${index}` : ''}
                />
            ))}

            {remainingCount > 0 && (
                <div
                    className={`member-icon member-icon--${size} member-icon--more`}
                    onClick={onMoreClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (onMoreClick && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onMoreClick();
                        }
                    }}
                >
                    <span className="member-icon__initials">+{remainingCount}</span>
                </div>
            )}
        </div>
    );
};

export default MemberGroup;
