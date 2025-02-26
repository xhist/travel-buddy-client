import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStompClient } from '../../hooks/useStompClient';
import PrivateChatPopup from '../chat/PrivateChatPopup';
import API from '../../api/api';
import toast from 'react-hot-toast';

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
  const [unreadMessages, setUnreadMessages] = useState({});
  const { user } = useAuth();
  const { client, connected } = useStompClient();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track window width for mobile responsive handling
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load unread messages on initial load
  useEffect(() => {
    if (user) {
      loadUnreadMessages();
    }
  }, [user]);

  // Open chats with unread messages when user connects
  useEffect(() => {
    if (user && connected) {
      restoreUnreadChats();
    }
  }, [user, connected]);

  const loadUnreadMessages = async () => {
    try {
      const response = await API.get('/chat/unread');
      const unreadData = {};
      
      // This API endpoint would return unread messages grouped by sender
      if (response.data) {
        response.data.forEach(item => {
          unreadData[item.sender] = item.count;
        });
        setUnreadMessages(unreadData);
      }
    } catch (error) {
      console.error('Error loading unread messages:', error);
    }
  };

  const restoreUnreadChats = () => {
    // Open chats for each sender with unread messages
    Object.keys(unreadMessages).forEach(username => {
      if (unreadMessages[username] > 0) {
        loadUserAndOpenChat(username);
      }
    });
  };

  const loadUserAndOpenChat = async (username) => {
    try {
      const response = await API.get(`/users/${username}`);
      handleStartChat(response.data);
    } catch (error) {
      console.error(`Error loading user ${username}:`, error);
    }
  };

  // Handle incoming private messages
  useEffect(() => {
    if (!client || !connected || !user) return;

    const subscription = client.subscribe(
      `/user/queue/private`,
      (message) => {
        try {
          const receivedMessage = JSON.parse(message.body);
          // Handle only messages where the current user is a participant
          if (receivedMessage.sender === user.username || receivedMessage.recipient === user.username) {
            const otherUser = receivedMessage.sender === user.username ? 
              receivedMessage.recipient : receivedMessage.sender;
            
            // Only handle messages from the other user
            if (receivedMessage.sender !== user.username) {
              // Auto-open chat window if not already open
              if (!activeChats.some(chat => chat.username === otherUser)) {
                loadUserAndOpenChat(otherUser);
              } else {
                // If chat is minimized, increment unread count
                const chatIndex = activeChats.findIndex(chat => chat.username === otherUser);
                if (chatIndex >= 0 && activeChats[chatIndex].minimized) {
                  setUnreadMessages(prev => ({
                    ...prev,
                    [otherUser]: (prev[otherUser] || 0) + 1
                  }));
                }
              }
              
              // Play notification sound if available
              try {
                const audio = new Audio('/message-notification.mp3');
                audio.play().catch(e => console.log('Audio play failed:', e));
              } catch (err) {
                console.log('Notification sound failed to play:', err);
              }
            }
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
    // If chat already exists, just make it active
    if (activeChats.some(chat => chat.username === recipient.username)) {
      // Update the active chat to be visible and not minimized
      setActiveChats(prev => prev.map(chat => 
        chat.username === recipient.username 
          ? { ...chat, minimized: false } 
          : chat
      ));
      
      // Clear unread messages for this chat
      setUnreadMessages(prev => ({
        ...prev,
        [recipient.username]: 0
      }));
      
      return;
    }
    
    // For mobile, limit to 1 open chat and replace it if needed
    if (windowWidth < 768) {
      setActiveChats([{
        ...recipient,
        minimized: false
      }]);
    } 
    // For tablet, limit to 2 chats
    else if (windowWidth < 1024 && activeChats.length >= 2) {
      const newChats = [...activeChats.slice(-1)]; // Keep only the most recent chat
      setActiveChats([...newChats, {
        ...recipient,
        minimized: false
      }]);
    } 
    // For desktop, add to existing chats
    else {
      setActiveChats(prev => [...prev, {
        ...recipient,
        minimized: false
      }]);
    }
    
    // Clear unread messages for this user
    setUnreadMessages(prev => ({
      ...prev,
      [recipient.username]: 0
    }));
    
    setIsSidebarOpen(false);
  };

  const handleCloseChat = (username) => {
    setActiveChats(prev => prev.filter(chat => chat.username !== username));
  };

  const handleMinimizeChat = (username, minimized) => {
    setActiveChats(prev => prev.map(chat => 
      chat.username === username ? { ...chat, minimized } : chat
    ));
  };

  const getUnreadCount = (username) => {
    return unreadMessages[username] || 0;
  };

  const markAsRead = (username) => {
    setUnreadMessages(prev => ({
      ...prev,
      [username]: 0
    }));
  };

  return (
    <ChatContext.Provider value={{ 
      activeChats, 
      handleStartChat,
      handleCloseChat,
      handleMinimizeChat, 
      isSidebarOpen, 
      setIsSidebarOpen,
      getUnreadCount,
      markAsRead
    }}>
      {children}
      <div className={`fixed bottom-4 right-4 z-40 flex ${windowWidth < 768 ? 'flex-col' : 'flex-row-reverse'} gap-4 flex-wrap sm:flex-nowrap`}>
        {activeChats.map((chat, index) => (
          <PrivateChatPopup
            key={chat.username}
            recipient={chat}
            onClose={() => handleCloseChat(chat.username)}
            onMinimize={(minimized) => handleMinimizeChat(chat.username, minimized)}
            position={index}
            unreadCount={getUnreadCount(chat.username)}
            onMarkAsRead={() => markAsRead(chat.username)}
            minimized={chat.minimized}
          />
        ))}
      </div>
    </ChatContext.Provider>
  );
};

export default ChatContext;