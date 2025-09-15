import React from 'react';
import './SiteBanner.css';
export type BannerType = 'warning' | 'info';

export interface SiteBannerProps {
    isVisible: boolean;
    type: BannerType;
    title?: string;
    description?: string;
    bulletPoints?: string[];
    showIcon?: boolean;
    showCloseButton?: boolean;
    /** Whether title should be displayed as header or inline text */
    hasHeader?: boolean;
    /** Smaller vertical padding when true */
    slim?: boolean;
    onClose?: () => void;
    children?: React.ReactNode;
    className?: string;
}

export const SiteBanner: React.FC<SiteBannerProps> = ({
    isVisible,
    type,
    title,
    description,
    bulletPoints,
    showIcon = true,
    showCloseButton = true,
    hasHeader = true,
    slim = false,
    onClose,
    children,
    className = '',
}) => {
    if (!isVisible) return null;

    const renderIcon = () => {
        if (!showIcon) return null;

        switch (type) {
            case 'warning':
                return (
                    <div className="site-banner__icon site-banner__icon--warning">
                        <span className='icon' />
                    </div>
                );
            case 'info':
                return (
                    <div className="site-banner__icon site-banner__icon--info">
                        <span className='icon' />
                    </div>
                );
            default:
                return null;
        }
    };

    const renderContent = () => {
        if (children) {
            return <div className="site-banner__content">{children}</div>;
        }

        if (hasHeader) {
            return (
                <div className="site-banner__content">
                    <div className="site-banner__text site-banner__text--header">
                        {title && <span className="site-banner__title heading-6">{title}</span>}
                        {description && (
                            <span
                                className="site-banner__description body-2"
                                dangerouslySetInnerHTML={{ __html: description }}
                            />
                        )}
                    </div>

                    {bulletPoints && bulletPoints.length > 0 && (
                        <ul className="site-banner__bullet-points body-2">
                            {bulletPoints.map((point, index) => (
                                <li key={index} dangerouslySetInnerHTML={{ __html: point }} />
                            ))}
                        </ul>
                    )}
                </div>
            );
        }

        return (
            <div className="site-banner__content">
                <div className="site-banner__text site-banner__text--inline">
                    {title && <span className="site-banner__title site-banner__title--inline body-2">{title}</span>}
                    {description && (
                        <span
                            className="site-banner__description body-2"
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`site-banner site-banner--${type} ${slim ? 'site-banner--slim' : ''} ${className}`}>
            {/* Add indicator for info banners */}
            {type === 'info' && <div className="site-banner__indicator" />}
            
            <div className="site-banner__container">
                {renderIcon()}
                {renderContent()}

                {showCloseButton && (
                    <button className="site-banner__close" onClick={onClose} aria-label="Close banner">
                        <span className='icon' />
                    </button>
                )}
            </div>
        </div>
    );
};
