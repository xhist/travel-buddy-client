import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStompClient } from '../../hooks/useStompClient';
import PrivateChatPopup from '../chat/PrivateChatPopup';

const ChatContext = createContext(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [activeChats, setActiveChats] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { client, connected } = useStompClient();

  // Handle incoming private messages
  useEffect(() => {
    if (!client || !connected || !user) return;

    const subscription = client.subscribe(
      `/user/queue/private`,
      (message) => {
        try {
          const receivedMessage = JSON.parse(message.body);
          const otherUser = receivedMessage.sender === user.username ? 
            receivedMessage.recipient : receivedMessage.sender;

          // Auto-open chat window if not already open
          if (!activeChats.some(chat => chat.username === otherUser)) {
            const newUser = {
              username: otherUser,
              status: 'ONLINE'
            };
            setActiveChats(prev => [...prev, newUser]);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [client, connected, user, activeChats]);

  const handleStartChat = (recipient) => {
    if (!activeChats.some(chat => chat.username === recipient.username)) {
      // Limit number of active chats on mobile
      if (window.innerWidth < 768 && activeChats.length >= 2) {
        const newChats = [...activeChats];
        newChats.shift(); // Remove oldest chat
        setActiveChats([...newChats, recipient]);
      } else {
        setActiveChats(prev => [...prev, recipient]);
      }
    }
    setIsSidebarOpen(false);
  };

  const handleCloseChat = (username) => {
    setActiveChats(prev => prev.filter(chat => chat.username !== username));
  };

  return (
    <ChatContext.Provider value={{ 
      activeChats, 
      handleStartChat, 
      isSidebarOpen, 
      setIsSidebarOpen 
    }}>
      {children}
      <div className="fixed bottom-4 right-4 z-40 flex flex-row-reverse gap-4 flex-wrap sm:flex-nowrap">
        {activeChats.map((chat, index) => (
          <PrivateChatPopup
            key={chat.username}
            recipient={chat}
            onClose={() => handleCloseChat(chat.username)}
            position={index}
          />
        ))}
      </div>
    </ChatContext.Provider>
  );
};

export default ChatContext;