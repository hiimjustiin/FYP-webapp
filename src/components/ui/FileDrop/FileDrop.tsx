import React, { useState, useRef, type DragEvent } from 'react';
import './FileDrop.css';

interface FileDropProps {
    onFilesSelected?: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in bytes
    className?: string;
    disabled?: boolean;
}

const FileDrop: React.FC<FileDropProps> = ({
    onFilesSelected,
    accept,
    multiple = false,
    maxSize,
    className = '',
    disabled = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
    };

    const validateFiles = (files: FileList): File[] => {
        const validFiles: File[] = [];
        setError('');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (maxSize && file.size > maxSize) {
                setError(`File "${file.name}" is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
                continue;
            }

            validFiles.push(file);
        }

        return validFiles;
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        const validFiles = validateFiles(files);

        if (validFiles.length > 0 && onFilesSelected) {
            onFilesSelected(validFiles);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const validFiles = validateFiles(e.target.files);
            if (validFiles.length > 0 && onFilesSelected) {
                onFilesSelected(validFiles);
            }
        }
    };

    const handleClick = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className={`filedrop-container ${className}`}>
            <div
                className={`filedrop-zone ${isDragging ? 'filedrop-zone--dragging' : ''} ${disabled ? 'filedrop-zone--disabled' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <div className="filedrop-content">
                    <p className="filedrop-text body-2">Drag and drop your file here.</p>
                    <p className="filedrop-subtext caption">or click to browse files</p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileInput}
                    className="filedrop-input"
                    disabled={disabled}
                />
            </div>

            {error && <p className="filedrop-error caption">{error}</p>}
        </div>
    );
};

export default FileDrop;
