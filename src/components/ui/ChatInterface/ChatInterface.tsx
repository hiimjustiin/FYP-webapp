import React, { useState, useRef, useEffect } from "react";
import Button from "../Button/Button";
import ChevronUp from "../../../assets/icons/chevron_up.svg";
import ChevronDown from "../../../assets/icons/chevron_down.svg";
import "./ChatInterface.css";

export interface ChatMessage {
  id: string;
  sender: "user" | "llm";
  message: string;
  timestamp: Date;
}

export interface ChatInterfaceProps {
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages = [],
  onSendMessage,
  isLoading = false,
  placeholder = "Text...",
  className = "",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

  return (
    <div
      className={`chat-interface ${
        isCollapsed ? "collapsed" : ""
      } ${className}`}
    >
      {/* Toolbar */}
      <div className="chat-toolbar">
        <button
          className="chat-collapse-button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand chat" : "Collapse chat"}
        >
          <span className="body-2">{isCollapsed ? "Expand" : "Collapse"}</span>
          <img
            src={isCollapsed ? ChevronDown : ChevronUp}
            alt=""
            className="chevron-icon"
          />
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Messages Area */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <p className="subtitle-2 text-grey-55">No messages yet</p>
                <p className="caption text-grey-55">
                  Start a conversation by typing a message below
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message ${
                      msg.sender === "user" ? "user-message" : "llm-message"
                    }`}
                  >
                    <div className="chat-message-content">
                      <p className="body-2">{msg.message}</p>
                    </div>
                    <span className="chat-message-timestamp caption">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <textarea
              ref={textareaRef}
              className="chat-input"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
            />
            <Button
              variant="green"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="chat-send-button"
            >
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
