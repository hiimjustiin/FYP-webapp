import React, { useState, useRef } from 'react';
import Button from '../Button/Button';

interface ChatInputProps {
    placeholder?: string;
    onSend: (message: string) => void;
    disabled?: boolean;
    className?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
    placeholder = "Text...",
    onSend,
    disabled = false,
    className = ''
}) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            const newValue = message.substring(0, start) + '\t' + message.substring(end);
            setMessage(newValue);

            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 1;
            }, 0);
        } else if (e.key === 'Enter') {
            if (e.shiftKey) {
                return;
            } else {
                e.preventDefault();
                handleSend();
            }
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
    };

    return (
        <div className={`chat-input-container ${className}`}>
            <textarea
                ref={textareaRef}
                className="chat-textarea caption"
                placeholder={placeholder}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                disabled={disabled}
                rows={1}
            />
            <Button
                variant="green"
                onClick={handleSend}
                disabled={disabled || !message.trim()}
                className="chat-send-button"
            >
                Send
            </Button>
        </div>
    );
};

export default ChatInput;
