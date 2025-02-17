import React, { useState, useEffect, useRef } from 'react';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import { X, Send, Minimize2, Maximize2 } from 'lucide-react';

const PrivateChatPopup = ({ recipient, onClose, position }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { client, connected } = useStompClient('http://localhost:8080/ws');
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!client || !connected) return;

    const subscription = client.subscribe(
      `/user/queue/private`,
      (message) => {
        try {
          const receivedMessage = JSON.parse(message.body);
          if (receivedMessage.sender === recipient.username || 
              (receivedMessage.sender === user.username && 
               receivedMessage.recipient === recipient.username)) {
            setMessages(prev => [...prev, receivedMessage]);
            if (minimized || !document.hasFocus()) {
              setUnreadCount(prev => prev + 1);
              // Trigger notification
              if (Notification.permission === 'granted' && receivedMessage.sender !== user.username) {
                new Notification(`Message from ${receivedMessage.sender}`, {
                  body: receivedMessage.content
                });
              }
            }
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      }
    );

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => subscription.unsubscribe();
  }, [client, connected, recipient.username, user.username, minimized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!minimized) {
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [minimized]);

  const sendMessage = () => {
    if (!input.trim() || !client || !connected) return;

    try {
      client.publish({
        destination: '/app/private.sendMessage',
        body: JSON.stringify({
          content: input,
          recipient: recipient.username,
          sender: user.username,
          timestamp: new Date().toISOString()
        })
      });
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  return (
    <div 
      className={`fixed bottom-0 w-80 sm:w-96 bg-white dark:bg-gray-800 
        rounded-t-lg shadow-lg flex flex-col transition-all duration-200 ease-in-out
        ${minimized ? 'h-12' : 'h-96'}`}
      style={{ right: `${(position * 320) + 80}px` }}
    >
      <div 
        className="flex items-center justify-between p-3 bg-blue-600 text-white rounded-t-lg cursor-pointer"
        onClick={toggleMinimize}
      >
        <div className="flex items-center space-x-2">
          <div className="relative">
            <img
              src={recipient.profilePicture || "/default-avatar.png"}
              alt={recipient.username}
              className="w-8 h-8 rounded-full"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex items-center">
            <h3 className="font-medium">{recipient.username}</h3>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {minimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 flex ${msg.sender === user.username ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.sender === user.username
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div>{msg.content}</div>
                  <div className="text-xs opacity-75">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 
                  dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PrivateChatPopup;