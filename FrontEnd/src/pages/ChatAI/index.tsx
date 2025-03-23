import React, { useState, useRef, useEffect } from 'react';
import './ChatAI.css';
import Markdown from 'react-markdown';  
import rehypeSanitize from 'rehype-sanitize';
import { sendMessage, ChatMessage, MessageRole } from '../../services/chatService';

const ChatAI = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { text: "Hello! I'm your healthcare assistant. How can I help you today?", role: 'model' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (input.trim() === '') return;

        // Add user message to chat
        const userMessage = input.trim();
        setMessages(prev => [...prev, { text: userMessage, role: 'user', timestamp: new Date().toISOString() }]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            // Use the chat service to send message and get response
            const response = await sendMessage(userMessage, 'user123', messages);
            
            if (response.success) {
                // Add AI response to chat
                setMessages(prev => [...prev, {
                    text: response.messageData.content,
                    role: response.messageData.role,
                    timestamp: response.messageData.timestamp
                }]);
            } else {
                throw new Error(response.error || 'Unknown error occurred');
            }
        } catch (err: any) {
            console.error('Error fetching AI response:', err);

            setError(err.message);
            setMessages(prev => [...prev, {
                text: "Sorry, I'm having trouble responding right now. Please try again later.",
                role: 'model',
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handler for "Enter" key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading && input.trim() !== '') {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Component to display markdown
    const MarkdownRenderer = ({ children }: { children: string }) => {
        try {
            // @ts-ignore - Temporarily ignore TypeScript error
            return <Markdown rehypePlugins={[rehypeSanitize]}>{children}</Markdown>;
        } catch (err) {
            console.error("Failed to render markdown:", err);
            return <div style={{ whiteSpace: 'pre-wrap' }}>{children}</div>;
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h1>Healthcare Assistant AI</h1>
            </div>

            <div className="messages-container">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.role}-message`}>
                        {message.role === 'model' ? (
                            <div className="markdown-content">
                                <MarkdownRenderer>{message.text}</MarkdownRenderer>
                            </div>
                        ) : (
                            <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="message ai-message loading-message">
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                {error && <div className="error-message">{error}</div>}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your health question here..."
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isLoading || input.trim() === ''}
                    className={isLoading ? 'disabled' : ''}
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatAI;
