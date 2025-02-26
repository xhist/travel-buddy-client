import React, { useState, useEffect, useRef } from 'react';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import API from '../../api/api';
import { Message } from './layouts/Message';
import ChatInput from './layouts/ChatInput';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, MinusCircle, MoreHorizontal, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const PrivateChatPopup = ({ 
  recipient, 
  onClose, 
  position, 
  unreadCount = 0, 
  onMarkAsRead,
  onMinimize,
  minimized = false 
}) => {
  const messageListRef = useRef(null);
  const { client, connected } = useStompClient();
  const { user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track window width for responsive adjustments
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (messageListRef.current && !minimized) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, minimized]);

  // Mark messages as read when chat is opened
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
        const response = await API.get(`/chat/messages/private/${recipient.username}`);
        
        if (response.data.length > 0) {
          setMessages(response.data);
          setOldestMessageId(response.data[0].id);
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

    const messageSubscription = client.subscribe(
      `/user/queue/private`,
      (message) => {
        try {
          const receivedMessage = JSON.parse(message.body);
          
          // Only handle messages for this chat
          if ((receivedMessage.sender === recipient.username && receivedMessage.recipient === user.username) ||
              (receivedMessage.sender === user.username && receivedMessage.recipient === recipient.username)) {
            // Add the message to our state
            setMessages(prev => [...prev, receivedMessage]);
            
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

    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  }, [client, connected, recipient?.username, user?.username, minimized, onMarkAsRead]);

  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore || !oldestMessageId || !recipient?.username) return;
    
    try {
      setLoadingMore(true);
      const response = await API.get(`/chat/messages/private/${recipient.username}`, {
        params: {
          before: oldestMessageId,
          limit: 20
        }
      });
      
      if (response.data.length === 0) {
        setHasMore(false);
      } else {
        setMessages(prev => [...response.data, ...prev]);
        setOldestMessageId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Failed to load more messages');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSendMessage = (content) => {
    if (!client || !connected) {
      toast.error('Not connected to chat server');
      return;
    }

    try {
      client.publish({
        destination: '/app/chat.private',
        body: JSON.stringify({
          content,
          recipient: recipient.username,
          type: 'TEXT',
          timestamp: new Date().toISOString()
        })
      });
      
      // Clear typing indicator
      sendTypingIndicator(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

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
      
      client.publish({
        destination: '/app/chat.private',
        body: JSON.stringify({
          content: response.data.fileUrl,
          fileName: response.data.fileName,
          recipient: recipient.username,
          type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

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

  const handleInputChange = (text) => {
    // Send typing indicator
    if (text.length > 0) {
      sendTypingIndicator(true);
      
      // Clear previous timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing indicator after 3 seconds
      const timeout = setTimeout(() => {
        sendTypingIndicator(false);
      }, 3000);
      
      setTypingTimeout(timeout);
    } else {
      sendTypingIndicator(false);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

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

  // Calculate position based on screen size and chat index
  const getPosition = () => {
    const isMobile = windowWidth < 768;
    
    if (isMobile) {
      return { 
        right: '1rem', 
        bottom: `${4 + position * (minimized ? 3 : 24)}rem`, 
        width: 'calc(100% - 2rem)',
        zIndex: 50 - position // Higher positions (more recent chats) get higher z-index
      };
    }
    
    return {
      right: `${4 + position * 20}rem`,
      bottom: '1rem',
      width: '18rem'
    };
  };

  if (!recipient) return null;

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ease-in-out rounded-t-lg shadow-lg flex flex-col`}
      style={{
        ...getPosition(),
        height: minimized ? '2.5rem' : '24rem'
      }}
    >
      {/* Chat Header */}
      <div 
        className={`flex items-center justify-between p-2 bg-blue-600 text-white rounded-t-lg cursor-pointer`}
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
            <span className="font-medium truncate">{recipient.username}</span>
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
            className="flex-1 flex flex-col bg-white dark:bg-gray-800"
          >
            <div 
              ref={messageListRef}
              className="flex-1 overflow-y-auto p-3"
            >
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Start a conversation with {recipient.username}
                </div>
              ) : (
                <div className="flex flex-col-reverse">
                  {messages.map((message, index) => (
                    <Message
                      key={message.id}
                      message={message}
                      currentUser={user}
                      onReact={handleReaction}
                      isLastInGroup={index === 0 || messages[index - 1].sender !== message.sender}
                    />
                  ))}
                  {loadingMore && (
                    <div className="text-center py-4">
                      <Loader className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                    </div>
                  )}
                  {hasMore && (
                    <button
                      onClick={loadMoreMessages}
                      className="mx-auto my-2 px-4 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                    >
                      Load older messages
                    </button>
                  )}
                </div>
              )}
            </div>
            <ChatInput
              onSend={handleSendMessage}
              onFileSelect={handleFileSelect}
              onInputChange={handleInputChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrivateChatPopup;