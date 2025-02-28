import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStompClient } from '../../hooks/useStompClient';
import PrivateChatPopup from '../chat/PrivateChatPopup';
import API from '../../api/api';
import toast from 'react-hot-toast';
import { MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
  const [minimizedChats, setMinimizedChats] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [showMobileChatList, setShowMobileChatList] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { user } = useAuth();
  const { client, connected } = useStompClient();

  // Track window width for mobile responsive handling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load unread messages on initial load and restore chats
  useEffect(() => {
    if (user && connected) {
      loadUnreadMessages();
    }
  }, [user, connected]);

  // Fetch unread messages from the server
  const loadUnreadMessages = async () => {
    try {
      const response = await API.get('/chat/unread');
      const unreadData = {};
      
      // This API endpoint would return unread messages grouped by sender
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(item => {
          unreadData[item.sender] = item.count;
        });
        setUnreadMessages(unreadData);
        
        // Automatically open chats with unread messages
        restoreUnreadChats(unreadData);
      }
    } catch (error) {
      console.error('Error loading unread messages:', error);
    }
  };

  // Restore chats with unread messages
  const restoreUnreadChats = useCallback((unreadData) => {
    Object.keys(unreadData || {}).forEach(username => {
      if (unreadData[username] > 0) {
        loadUserAndOpenChat(username);
      }
    });
  }, []);

  // Load user details and open a chat
  const loadUserAndOpenChat = async (username) => {
    try {
      const response = await API.get(`/users/${username}`);
      handleStartChat(response.data, false); // Don't minimize when auto-opening
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
          
          // Handle only messages where this user is a participant
          if (receivedMessage.recipient === user.username || receivedMessage.sender === user.username) {
            const otherUser = receivedMessage.sender === user.username ? 
              receivedMessage.recipient : receivedMessage.sender;
            
            // Only handle messages from the other user (not own messages)
            if (receivedMessage.sender !== user.username) {
              // Find if there's an existing chat
              const existingChatIndex = activeChats.findIndex(chat => chat.username === otherUser);
              
              if (existingChatIndex === -1) {
                // No existing chat - load user and open a new one
                loadUserAndOpenChat(otherUser);
              } else {
                // Chat exists - increment unread if minimized
                if (minimizedChats[otherUser]) {
                  setUnreadMessages(prev => ({
                    ...prev,
                    [otherUser]: (prev[otherUser] || 0) + 1
                  }));
                }
              }
              
              // Play notification sound
              playNotificationSound();
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
  }, [client, connected, user, activeChats, minimizedChats]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/message-notification.mp3');
      audio.volume = 0.5; // Reduced volume
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (err) {
      console.log('Notification sound failed to play:', err);
    }
  };

  // Start a chat with a user
  const handleStartChat = (recipient, shouldMinimize = false) => {
    if (!recipient || !recipient.username) {
      console.error('Invalid recipient:', recipient);
      return;
    }
    
    // Check if chat already exists
    const existingChatIndex = activeChats.findIndex(chat => chat.username === recipient.username);
    
    if (existingChatIndex !== -1) {
      // Update existing chat
      setActiveChats(prev => {
        const updatedChats = [...prev];
        updatedChats[existingChatIndex] = recipient;
        return updatedChats;
      });
      
      // Set minimized state if requested
      if (shouldMinimize) {
        setMinimizedChats(prev => ({
          ...prev,
          [recipient.username]: shouldMinimize
        }));
      } else {
        // If not minimizing, ensure it's maximized and clear unread
        setMinimizedChats(prev => ({
          ...prev,
          [recipient.username]: false
        }));
        clearUnreadMessages(recipient.username);
      }
    } else {
      // For mobile, add to minimized state but don't show until user clicks
      if (windowWidth < 768) {
        setActiveChats(prev => [...prev, recipient]);
        setMinimizedChats(prev => ({
          ...prev,
          [recipient.username]: true // Always start minimized on mobile
        }));
        // Show mobile chat list to inform user about new chat
        setShowMobileChatList(true);
      } 
      // For tablet, limit to 2 chats
      else if (windowWidth < 1024 && activeChats.length >= 2) {
        const newChats = [...activeChats.slice(-1)];
        setActiveChats([...newChats, recipient]);
        setMinimizedChats(prev => ({
          ...prev,
          [recipient.username]: shouldMinimize
        }));
      } 
      // For desktop, add to existing chats
      else {
        setActiveChats(prev => [...prev, recipient]);
        setMinimizedChats(prev => ({
          ...prev,
          [recipient.username]: shouldMinimize
        }));
      }
    }
    
    // Clear unread messages if not minimizing
    if (!shouldMinimize) {
      clearUnreadMessages(recipient.username);
    }
    
    // Close sidebar
    setIsSidebarOpen(false);
  };

  // Close a chat
  const handleCloseChat = (username) => {
    setActiveChats(prev => prev.filter(chat => chat.username !== username));
    setMinimizedChats(prev => {
      const updated = { ...prev };
      delete updated[username];
      return updated;
    });
    clearUnreadMessages(username);
  };

  // Toggle minimize state for a chat
  const handleMinimizeChat = (username, minimized) => {
    setMinimizedChats(prev => ({
      ...prev,
      [username]: minimized
    }));
    
    // Clear unread messages when maximizing
    if (!minimized) {
      clearUnreadMessages(username);
    }
  };

  // Clear unread messages for a user
  const clearUnreadMessages = (username) => {
    setUnreadMessages(prev => {
      if (!prev[username]) return prev;
      
      const updated = { ...prev };
      delete updated[username];
      return updated;
    });
    
    // Send a server request to mark messages as read
    try {
      API.post(`/chat/markAsRead/${username}`);
    } catch (error) {
      console.error(`Error marking messages as read for ${username}:`, error);
    }
  };

  // Get unread count for a chat
  const getUnreadCount = (username) => {
    return unreadMessages[username] || 0;
  };

  // Get total unread count across all chats
  const getTotalUnreadCount = () => {
    return Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
  };

  // Toggle mobile chat list
  const toggleMobileChatList = () => {
    setShowMobileChatList(prev => !prev);
  };

  // Toggle minimized state for all chats
  const toggleAllChats = () => {
    if (activeChats.length === 0) return;
    
    // Check if all chats are currently minimized
    const allMinimized = activeChats.every(chat => minimizedChats[chat.username]);
    
    // Toggle all chats to opposite state
    const updatedMinimizedState = {};
    activeChats.forEach(chat => {
      updatedMinimizedState[chat.username] = !allMinimized;
    });
    
    setMinimizedChats(updatedMinimizedState);
    
    // Clear unread counts if maximizing
    if (allMinimized) {
      activeChats.forEach(chat => clearUnreadMessages(chat.username));
    }
  };

  // Genie effect animation variants for mobile - more authentic macOS dock effect
  const mobileButtonVariants = {
    hidden: { scale: 0.5, opacity: 0, y: 50 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        bounce: 0.25
      } 
    },
    tap: {
      scale: 0.9,
      transition: { duration: 0.1 }
    }
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
      clearUnreadMessages,
      getTotalUnreadCount
    }}>
      {children}
      
      {/* Render private chat popups */}
      <div className={`fixed z-40 ${windowWidth < 768 ? 'bottom-4 right-4' : 'bottom-4 right-4 flex flex-row-reverse flex-wrap gap-4'}`}>
        {activeChats.map((chat, index) => (
          <PrivateChatPopup
            key={chat.username}
            recipient={chat}
            onClose={() => handleCloseChat(chat.username)}
            onMinimize={(minimized) => handleMinimizeChat(chat.username, minimized)}
            position={index}
            unreadCount={getUnreadCount(chat.username)}
            onMarkAsRead={() => clearUnreadMessages(chat.username)}
            minimized={minimizedChats[chat.username] || false}
          />
        ))}
      </div>
      
      {/* Mobile Chat Toggle Button - shows total unread count */}
      {windowWidth < 768 && (
        <motion.button
          initial="hidden"
          animate="visible"
          variants={mobileButtonVariants}
          whileHover={{ scale: 1.1 }}
          whileTap="tap"
          onClick={toggleMobileChatList}
          className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
          {getTotalUnreadCount() > 0 && (
            <motion.span 
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 20
              }}
            >
              {getTotalUnreadCount()}
            </motion.span>
          )}
        </motion.button>
      )}

      {/* Mobile Chat List Modal */}
      <AnimatePresence>
        {showMobileChatList && windowWidth < 768 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowMobileChatList(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 40,
                opacity: { duration: 0.2 }
              }}
              className="bg-white dark:bg-gray-800 w-full max-h-[70vh] rounded-t-xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Active Conversations</h3>
                <button 
                  onClick={() => setShowMobileChatList(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 max-h-[calc(70vh-60px)] overflow-y-auto">
                {activeChats.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No active conversations</p>
                ) : (
                  <div className="space-y-2">
                    {activeChats.map(chat => (
                      <button
                        key={chat.username}
                        onClick={() => {
                          handleMinimizeChat(chat.username, false);
                          setShowMobileChatList(false);
                        }}
                        className="w-full flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <img
                          src={chat.profilePicture || "/default-avatar.png"}
                          alt={chat.username}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-800 dark:text-gray-200">{chat.username}</p>
                        </div>
                        {getUnreadCount(chat.username) > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1.5">
                            {getUnreadCount(chat.username)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ChatContext.Provider>
  );
};

export default ChatContext;