import React from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import TextArea from "./TextArea";
import FileDrop from "../FileDrop/FileDrop";

export default {
    title: "Components/TextArea",
    component: TextArea,
    parameters: {
        layout: 'padded',
    },
};

export const Default = () => {
    const [value, setValue] = React.useState('');

    return (
        <div style={{ width: '600px' }}>
            <TextArea
                value={value}
                onChange={setValue}
                placeholder="Type your message here."
            />
        </div>
    );
};

export const WithCharacterCount = () => {
    const [value, setValue] = React.useState('');

    return (
        <div style={{ width: '600px' }}>
            <TextArea
                label="Description"
                value={value}
                onChange={setValue}
                placeholder="Type your message here."
                maxLength={500}
                showCharCount={true}
            />
        </div>
    );
};

export const FileDropZone = () => {
    const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

    return (
        <div style={{ width: '600px' }}>
            <FileDrop
                onFilesSelected={setSelectedFiles}
                accept=".pdf,.doc,.docx,.txt"
                multiple={false}
                maxSize={10 * 1024 * 1024}
            />
            {selectedFiles.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <strong>Selected Files:</strong>
                    <ul>
                        {selectedFiles.map((file, index) => (
                            <li key={index}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const Combined = () => {
    const [message, setMessage] = React.useState('');
    const [files, setFiles] = React.useState<File[]>([]);

    return (
        <div style={{ width: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <TextArea
                label="Message"
                value={message}
                onChange={setMessage}
                placeholder="Type your message here."
                rows={6}
            />
            <FileDrop
                onFilesSelected={setFiles}
                accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                multiple={true}
                maxSize={5 * 1024 * 1024}
            />

            {(files.length > 0 || message.trim()) && (
                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    {message.trim() && (
                        <div style={{ marginBottom: files.length > 0 ? '12px' : '0' }}>
                            <strong>Message:</strong>
                            <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>{message}</p>
                        </div>
                    )}

                    {files.length > 0 && (
                        <div>
                            <strong>Selected Files ({files.length}):</strong>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                                {files.map((file, index) => (
                                    <li key={index} style={{ margin: '4px 0', color: '#64748b' }}>
                                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const TextAreaWithDropText = () => {
    const [message, setMessage] = React.useState('');
    const [files, setFiles] = React.useState<File[]>([]);

    const showFileDrop = message.trim() === '';

    return (
        <div style={{ width: '600px' }}>
            <TextArea
                label="Message"
                value={message}
                onChange={setMessage}
                placeholder="Type your message here."
                rows={6}
            >
                {showFileDrop && (
                    <div>
                        <FileDrop
                            onFilesSelected={(selectedFiles) => {
                                setFiles(selectedFiles);
                                if (selectedFiles.length > 0) {
                                    setMessage(''); 
                                }
                            }}
                            accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                            multiple={true}
                            maxSize={5 * 1024 * 1024}
                        />
                    </div>
                )}
            </TextArea>

            {/* Show selected files */}
            {files.length > 0 && (
                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <strong>Selected Files ({files.length}):</strong>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        {files.map((file, index) => (
                            <li key={index} style={{ margin: '4px 0', color: '#64748b' }}>
                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
