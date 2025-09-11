import { useState } from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import Chat, { type ChatMessageData } from "./Chat";

export default {
    title: "Components/Chat",
    component: Chat,
    parameters: {
        layout: 'padded',
    },
};

const initialMessages: ChatMessageData[] = [
    {
        id: '1',
        type: 'received',
        sender: 'LLM',
        timestamp: '26 Apr 2024 at 07:28',
        message: 'Text'
    },
    {
        id: '2',
        type: 'sent',
        sender: 'User',
        timestamp: '26 Apr 2024 at 07:30',
        message: 'Text'
    },
    {
        id: '3',
        type: 'received',
        sender: 'LLM',
        timestamp: '26 Apr 2024 at 07:32',
        message: 'Text'
    },
    {
        id: '4',
        type: 'sent',
        sender: 'User',
        timestamp: '26 Apr 2024 at 07:34',
        message: 'Text'
    },
    {
        id: '5',
        type: 'received',
        sender: 'LLM',
        timestamp: '26 Apr 2024 at 07:36',
        message: 'Text'
    }
];

// Interactive Chat
export const Default = () => {
    const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);

    const handleSendMessage = (message: string) => {
        const newMessage: ChatMessageData = {
            id: Date.now().toString(),
            type: 'sent',
            sender: 'User',
            timestamp: new Date().toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            message
        };

        setMessages(prev => [...prev, newMessage]);

        // Simulate AI response after delay
        setTimeout(() => {
            const aiResponse: ChatMessageData = {
                id: (Date.now() + 1).toString(),
                type: 'received',
                sender: 'LLM',
                timestamp: new Date().toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                message: 'Reply'
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

    return (
        <div style={{ width: '600px', height: '500px' }}>
            <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                placeholder="Type your message..."
            />
        </div>
    );
};

// Empty Chat
export const Empty = () => {
    const [messages, setMessages] = useState<ChatMessageData[]>([]);

    const handleSendMessage = (message: string) => {
        const newMessage: ChatMessageData = {
            id: Date.now().toString(),
            type: 'sent',
            sender: 'User',
            timestamp: new Date().toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            message
        };

        setMessages(prev => [...prev, newMessage]);
    };

    return (
        <div style={{ width: '600px', height: '400px' }}>
            <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                placeholder="Start a conversation..."
            />
        </div>
    );
};

// Mobile View
export const Mobile = () => {
    const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);

    const handleSendMessage = (message: string) => {
        const newMessage: ChatMessageData = {
            id: Date.now().toString(),
            type: 'sent',
            sender: 'User',
            timestamp: new Date().toLocaleString(),
            message
        };

        setMessages(prev => [...prev, newMessage]);
    };

    return (
        <div style={{ width: '375px', height: '600px' }}>
            <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                placeholder="Message..."
            />
        </div>
    );
};
