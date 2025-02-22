import React, { useState, useEffect } from 'react';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import API from '../../api/api';
import { useChatMessages } from '../../hooks/useChatMessages';
import { MessageList } from './layouts/MessageList';
import Message from './layouts/Message';
import ChatInput from './layouts/ChatInput';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PrivateChatPopup = ({ recipient, onClose, position }) => {
  const [minimized, setMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { client, connected } = useStompClient();
  const { user } = useAuth();

  // Initialize chat messages with pagination
  const {
    messages,
    hasMore,
    loadMore,
    addMessage,
    updateMessage
  } = useChatMessages([], async (beforeId) => {
    const response = await API.get(`/chat/messages/private/${recipient.id}`, {
      params: { before: beforeId, limit: 20 }
    });
    return response.data;
  });

  useEffect(() => {
    if (!client || !connected) return;

    const subscription = client.subscribe(
      `/user/queue/private`,
      (message) => {
        const receivedMessage = JSON.parse(message.body);
        
        // Only handle messages from this recipient
        if (receivedMessage.sender === recipient.username ||
            receivedMessage.recipient === recipient.username) {
          addMessage(receivedMessage);
          
          // Increment unread count if minimized
          if (minimized && receivedMessage.sender === recipient.username) {
            setUnreadCount(prev => prev + 1);
            
            // Show browser notification
            if (Notification.permission === 'granted' && document.hidden) {
              new Notification(`Message from ${receivedMessage.sender}`, {
                body: receivedMessage.content,
                icon: recipient.profilePicture || '/default-avatar.png'
              });
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [client, connected, recipient.username, minimized]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Reset unread count when maximizing
  useEffect(() => {
    if (!minimized) {
      setUnreadCount(0);
    }
  }, [minimized]);

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
          recipient: recipient.id,
          type: 'TEXT',
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileSelect = async (fileData) => {
    if (!client || !connected) {
      toast.error('Not connected to chat server');
      return;
    }

    try {
      client.publish({
        destination: '/app/chat.private',
        body: JSON.stringify({
          content: fileData.fileUrl,
          fileName: fileData.fileName,
          recipient: recipient.username,
          type: fileData.contentType.startsWith('image/')
            ? 'IMAGE'
            : 'FILE',
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error sending file:', error);
      toast.error('Failed to send file');
    }
  };

  const handleReaction = async (messageId, reactionType) => {
    try {
      const response = await API.post(`/chat/messages/${messageId}/reactions`, {
        reactionType
      });
      updateMessage(messageId, response.data);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  return (
    <div 
      className={`fixed bottom-0 z-50 transition-all duration-300 ease-in-out
        ${minimized ? 'h-12' : 'h-96'}
        ${position === 0 ? 'right-4' : `right-${80 + (position * 320)}px`}
        w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-t-lg shadow-lg flex flex-col`}
    >
      {/* Chat Header */}
      <div 
        className="flex items-center justify-between p-3 bg-blue-600 text-white rounded-t-lg cursor-pointer"
        onClick={() => setMinimized(!minimized)}
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
          <div className="flex items-center gap-2">
            <span className="font-medium">{recipient.username}</span>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(!minimized);
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <MessageList
              messages={messages}
              currentUser={user}
              onReact={handleReaction}
              loadMore={loadMore}
              hasMore={hasMore}
            />
            <ChatInput
              onSend={handleSendMessage}
              onFileSelect={handleFileSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrivateChatPopup;