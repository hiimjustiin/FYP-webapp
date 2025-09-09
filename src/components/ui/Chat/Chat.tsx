import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import './Chat.css';

export interface ChatMessageData {
    id: string;
    type: 'sent' | 'received';
    sender: string;
    timestamp: string;
    message: string;
}

interface ChatProps {
    messages: ChatMessageData[];
    onSendMessage: (message: string) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

const Chat: React.FC<ChatProps> = ({
    messages,
    onSendMessage,
    className = '',
    placeholder = "Text...",
    disabled = false
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className={`chat-container ${className}`}>
            <div className="chat-messages">
                {messages.map((msg) => (
                    <ChatMessage
                        key={msg.id}
                        id={msg.id}
                        type={msg.type}
                        sender={msg.sender}
                        timestamp={msg.timestamp}
                        message={msg.message}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <ChatInput
                placeholder={placeholder}
                onSend={onSendMessage}
                disabled={disabled}
            />
        </div>
    );
};

export default Chat;
