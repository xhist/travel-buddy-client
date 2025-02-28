import React, { useState, useEffect, useRef } from 'react';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import API from '../../api/api';
import { MessageList } from './layouts/MessageList';
import ChatInput from './layouts/ChatInput';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const MESSAGE_LIMIT = 20;

const PrivateChatPopup = ({ 
  recipient, 
  onClose, 
  position, 
  unreadCount = 0, 
  onMarkAsRead,
  onMinimize,
  minimized = false 
}) => {
  const { client, connected } = useStompClient();
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const buttonPosition = useRef({ x: 0, y: 0 });

  // Track window width for responsive adjustments
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    // Get position of chat button for animation
    const chatButton = document.querySelector('.chat-toggle-button');
    if (chatButton) {
      const rect = chatButton.getBoundingClientRect();
      buttonPosition.current = {
        x: rect.right - 30,
        y: rect.top + rect.height / 2
      };
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mark messages as read when chat is opened/focused
  useEffect(() => {
    if (!minimized && onMarkAsRead) {
      onMarkAsRead();
    }
  }, [minimized, onMarkAsRead]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!recipient?.username) return;
      
      try {
        setLoading(true);
        const response = await API.get(`/chat/messages/private/${recipient.username}`, {
          params: { limit: MESSAGE_LIMIT }
        });
        
        if (response.data.length > 0) {
          setMessages(response.data);
          setOldestMessageId(response.data[0].id);
          
          if (response.data.length < MESSAGE_LIMIT) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    if (recipient?.username) {
      fetchMessages();
    }
  }, [recipient?.username]);

  // Subscribe to private messages and typing indicators
  useEffect(() => {
    if (!client || !connected || !recipient?.username) return;

    const subscriptions = [];

    const messageSubscription = client.subscribe(
      `/user/queue/private`,
      (message) => {
        try {
          const receivedMessage = JSON.parse(message.body);
          
          // Only handle messages for this chat
          if ((receivedMessage.sender === recipient.username && receivedMessage.recipient === user.username) ||
              (receivedMessage.sender === user.username && receivedMessage.recipient === recipient.username)) {
            // Add the message to our state
            setMessages(prev => {
              // Check if message already exists
              if (prev.some(msg => msg.id === receivedMessage.id)) {
                return prev;
              }
              return [...prev, receivedMessage];
            });
            
            // Mark as read if chat is open
            if (!minimized && onMarkAsRead) {
              onMarkAsRead();
            }
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      }
    );
    
    subscriptions.push(messageSubscription);

    const typingSubscription = client.subscribe(
      `/user/queue/typing`,
      (message) => {
        try {
          const typingData = JSON.parse(message.body);
          if (typingData.sender === recipient.username) {
            setIsTyping(typingData.typing);
          }
        } catch (error) {
          console.error('Error handling typing indicator:', error);
        }
      }
    );
    
    subscriptions.push(typingSubscription);

    return () => {
      subscriptions.forEach(subscription => {
        if (subscription) subscription.unsubscribe();
      });
    };
  }, [client, connected, recipient?.username, user?.username, minimized, onMarkAsRead]);

  // Load more messages (infinite scroll)
  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore || !oldestMessageId || !recipient?.username) return;
    
    try {
      setLoadingMore(true);
      const response = await API.get(`/chat/messages/private/${recipient.username}`, {
        params: {
          before: oldestMessageId,
          limit: MESSAGE_LIMIT
        }
      });
      
      if (response.data.length === 0) {
        setHasMore(false);
      } else {
        setMessages(prev => [...response.data, ...prev]);
        setOldestMessageId(response.data[0].id);
        
        if (response.data.length < MESSAGE_LIMIT) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Failed to load more messages');
    } finally {
      setLoadingMore(false);
    }
  };

  // Send a text message
  const handleSendMessage = (content) => {
    if (!client || !connected) {
      toast.error('Not connected to chat server');
      return;
    }

    try {
      const messagePayload = {
        content: {
          type: 'TEXT',
          text: content
        },
        recipient: recipient.username,
        type: 'TEXT',
        timestamp: new Date().toISOString()
      };
      
      client.publish({
        destination: '/app/chat.private',
        body: JSON.stringify(messagePayload)
      });

      // Optimistically add message to local state
      const optimisticMessage = {
        id: Date.now(), // Temporary ID
        sender: user.username,
        recipient: recipient.username,
        content: { text: content, type: 'TEXT' },
        type: 'TEXT',
        timestamp: new Date().toISOString(),
        reactions: []
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear typing indicator
      sendTypingIndicator(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Upload and send a file
  const handleFileSelect = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await API.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (!client || !connected) {
        toast.error('Not connected to chat server');
        return;
      }
      
      const msgType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      
      client.publish({
        destination: '/app/chat.private',
        body: JSON.stringify({
          content: msgType === 'IMAGE' ? {
            type: 'IMAGE',
            imageUrl: response.data.fileUrl
          } : {
            type: 'FILE',
            fileUrl: response.data.fileUrl,
            fileName: response.data.fileName,
            fileType: file.type,
            fileSize: file.size
          },
          fileName: response.data.fileName,
          recipient: recipient.username,
          type: msgType,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  // Add a reaction to a message
  const handleReaction = async (messageId, reactionType) => {
    try {
      const response = await API.post(`/chat/messages/${messageId}/reactions`, {
        reactionType
      });
      
      // Update local message with new reactions
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? { ...msg, reactions: response.data.reactions } : msg)
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  // Send typing status update
  const sendTypingIndicator = (typing) => {
    if (!client || !connected || !recipient?.username) return;
    
    try {
      client.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({
          recipient: recipient.username,
          typing
        })
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  // Define genie animation variants for mobile - improved macOS style
  const getMobilePosition = () => {
    const isMobile = windowWidth < 768;
    
    if (isMobile) {
      // When minimized on mobile, prepare for animation toward button
      if (minimized) {
        return { 
          position: 'fixed',
          right: '1rem', 
          bottom: '1rem',
          width: 'calc(100% - 2rem)',
          zIndex: 50 - position,
          opacity: 1
        };
      }
      // When maximized on mobile
      return { 
        position: 'fixed',
        right: '1rem', 
        bottom: '1rem',
        width: 'calc(100% - 2rem)',
        zIndex: 50 - position,
        opacity: 1
      };
    }
    
    // Desktop position
    return {
      position: 'fixed',
      right: `${4 + position * 20}rem`,
      bottom: '1rem',
      width: '18rem',
      maxHeight: '24rem',
      zIndex: 50 - position
    };
  };
  
  // Enhanced genie animation with better movement
  const getButtonTarget = () => {
    const targetX = buttonPosition.current.x || window.innerWidth - 40;
    const targetY = buttonPosition.current.y || window.innerHeight - 140;
    
    return {
      x: windowWidth < 768 ? (targetX - 100) : 0,
      y: windowWidth < 768 ? (targetY - 100) : 0,
    };
  };
  
  const genieAnimationVariants = {
    maximized: {
      height: windowWidth < 768 ? 'calc(80vh - 6rem)' : '24rem',
      scale: 1,
      opacity: 1,
      x: 0,
      y: 0,
      originX: 0.5,
      originY: 0.5
    },
    minimized: windowWidth < 768 ? {
      height: '2.5rem',
      scale: 0.05,
      opacity: 0,
      ...getButtonTarget(),
      originX: 1,
      originY: 1,
      transition: {
        type: "spring",
        stiffness: 250,
        damping: 25,
        opacity: { 
          duration: 0.3,
          delay: 0.1
        },
        scale: {
          duration: 0.4
        }
      }
    } : {
      height: '2.5rem',
      scale: 1,
      opacity: 1,
      x: 0,
      y: 0
    }
  };

  if (!recipient) return null;

  return (
    <motion.div 
      className="fixed rounded-t-lg shadow-lg flex flex-col overflow-hidden"
      style={getMobilePosition()}
      animate={minimized ? "minimized" : "maximized"}
      variants={genieAnimationVariants}
      transition={{
        type: "spring",
        stiffness: 330,
        damping: 30,
        duration: 0.5
      }}
    >
      {/* Chat Header */}
      <div 
        className="flex items-center justify-between p-2 bg-blue-600 text-white rounded-t-lg cursor-pointer"
        onClick={() => onMinimize && onMinimize(!minimized)}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={recipient.profilePicture || "/default-avatar.png"}
              alt={recipient.username}
              className="w-8 h-8 rounded-full"
            />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium truncate max-w-[120px]">{recipient.username}</span>
            {isTyping && !minimized && (
              <span className="text-xs text-white/80">typing...</span>
            )}
          </div>
          {unreadCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize && onMinimize(!minimized);
            }}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronDown 
              className={`w-4 h-4 transform transition-transform ${
                minimized ? 'rotate-180' : ''
              }`}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden"
          >
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <MessageList
                  messages={messages}
                  currentUser={user}
                  onReact={handleReaction}
                  loadMore={loadMoreMessages}
                  hasMore={hasMore}
                  initialLoad={loadingMore}
                />
              </div>
            )}
            <ChatInput
              onSend={handleSendMessage}
              onFileSelect={handleFileSelect}
              onInputChange={(isTyping) => sendTypingIndicator(isTyping)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PrivateChatPopup;