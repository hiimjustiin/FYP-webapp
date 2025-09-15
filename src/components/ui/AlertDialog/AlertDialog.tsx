import React from 'react';
import './AlertDialog.css';
import SuccessIcon from '../../../assets/icons/check.svg';
import WarningIcon from '../../../assets/icons/error.svg';
import InfoIcon from '../../../assets/icons/info.svg';
import CloseIcon from '../../../assets/icons/close.svg';
import Button from '../Button/Button';

export type AlertDialogType = 'warning' | 'success' | 'loading' | 'info' | 'error';

export interface AlertDialogProps {
    isOpen: boolean;
    type: AlertDialogType;
    title: string;
    message?: string;
    primaryButtonText?: string;
    secondaryButtonText?: string;
    onPrimaryAction?: () => void;
    onSecondaryAction?: () => void;
    onClose?: () => void;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    className?: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
    isOpen,
    type,
    title,
    message,
    primaryButtonText,
    secondaryButtonText,
    onPrimaryAction,
    onSecondaryAction,
    onClose,
    showCloseButton = false,
    closeOnOverlayClick = false,
    className = '',
}) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnOverlayClick && onClose) {
            onClose();
        }
    };

    const getPrimaryButtonVariant = () => {
        switch (type) {
            case 'warning':
            case 'error':
                return 'red';
            case 'success':
            case 'info':
            default:
                return 'green';
        }
    };

    const renderIcon = () => {
        switch (type) {
            case 'warning':
                return (
                    <div className="alert-dialog__icon alert-dialog__icon--warning">
                        <img src={WarningIcon} alt="Warning" className='icon' width='100%' height='100%' />
                    </div>
                );
            case 'success':
                return (
                    <div className="alert-dialog__icon alert-dialog__icon--success">
                        <img src={SuccessIcon} alt="Success" className='icon' width='100%' height='100%' />
                    </div>
                );
            case 'loading':
                return (
                    <div className="alert-dialog__icon">
                        <div className="alert-dialog__spinner"></div>
                    </div>
                );
            case 'error':
                return (
                    <div className="alert-dialog__icon alert-dialog__icon--error">
                        <img src={WarningIcon} alt="Error" className='icon' width='100%' height='100%' />
                    </div>
                );
            case 'info':
            default:
                return (
                    <div className="alert-dialog__icon alert-dialog__icon--info">
                        <img src={InfoIcon} alt="Info" className='icon' width='100%' height='100%' />
                    </div>
                );
        }
    };

    return (
        <div className="alert-dialog__overlay" onClick={handleOverlayClick}>
            <div className={`alert-dialog ${className}`}>
                {showCloseButton && (
                    <button className="alert-dialog__close" onClick={onClose}>
                        <img src={CloseIcon} alt="Close" className='icon' />
                    </button>
                )}

                <div className="alert-dialog__content">
                    {renderIcon()}

                    <div>
                        <h2 className="alert-dialog__title heading-6">{title}</h2>
                        {message && (
                            <p className="alert-dialog__message body-2">{message}</p>
                        )}
                    </div>

                    {(primaryButtonText || secondaryButtonText) && type !== 'loading' && (
                        <div className="alert-dialog__actions">
                            {secondaryButtonText && (
                                <Button
                                    onClick={onSecondaryAction}
                                    variant="grey"
                                    className="alert-dialog__button"
                                >
                                    {secondaryButtonText}
                                </Button>
                            )}
                            {primaryButtonText && (
                                <Button
                                    onClick={onPrimaryAction}
                                    variant={getPrimaryButtonVariant()}
                                    className="alert-dialog__button"
                                >
                                    {primaryButtonText}
                                </Button>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
