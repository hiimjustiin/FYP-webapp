import React from 'react';

interface ChatMessageProps {
    id: string;
    type: 'sent' | 'received';
    sender: string;
    timestamp: string;
    message: string;
    className?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
    type,
    sender,
    timestamp,
    message,
    className = ''
}) => {
    const isUser = type === 'sent';

    return (
        <div className={`chat-message ${type} ${className}`}>
            <div className="chat-message-header">
                <span className="chat-sender caption">{sender}</span>
                <span className="chat-timestamp caption">|</span>
                <span className="chat-timestamp caption">{timestamp}</span>
            </div>
            <div className={`chat-bubble caption ${isUser ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                <span className="caption">{message}</span>
            </div>
        </div>
    );
};

export default ChatMessage;
