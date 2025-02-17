import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStompClient } from '../../hooks/useStompClient';
import PrivateChatPopup from '../chat/PrivateChatPopup';

export const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [activeChats, setActiveChats] = useState([]);
  const [isMobileUsersOpen, setIsMobileUsersOpen] = useState(false);
  const { user } = useAuth();
  const { client, connected } = useStompClient('http://localhost:8080/ws');

  useEffect(() => {
    if (!client || !connected || !user) return;

    const subscription = client.subscribe(
      `/user/queue/private`,
      (message) => {
        try {
          const receivedMessage = JSON.parse(message.body);
          const otherUser = receivedMessage.sender === user.username ? 
            receivedMessage.recipient : receivedMessage.sender;

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
      setActiveChats(prev => [...prev, recipient]);
    }
    setIsMobileUsersOpen(false);
  };

  const handleCloseChat = (username) => {
    setActiveChats(prev => prev.filter(chat => chat.username !== username));
  };

  return (
    <ChatContext.Provider value={{ 
      activeChats, 
      handleStartChat, 
      isMobileUsersOpen, 
      setIsMobileUsersOpen 
    }}>
      {children}
      <div className="fixed bottom-4 right-20 z-40 flex flex-row-reverse gap-2 flex-wrap sm:flex-nowrap">
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