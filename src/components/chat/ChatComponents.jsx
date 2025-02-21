import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import { useChatContext } from '../contexts/ChatContext';
import API from '../../api/api';
import { PollMessage } from '../voting/Voting';
import { 
  Send, 
  Image, 
  Smile, 
  Users,
  FileText,
  MenuIcon,
  X,
  ChevronRight,
  ChevronLeft,
  Heart,
  MessageCircle
} from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import toast from 'react-hot-toast';

// Message Types
const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  POLL: 'POLL'
};

// Available Reactions
const REACTIONS = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😂',
  SURPRISED: '😮',
  SAD: '😢',
  ANGRY: '😠'
};

// Reusable Message Component
const Message = ({ message, currentUser, onReact, showReactions = true }) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const isOwnMessage = message.sender === currentUser?.username;

  const handleReaction = (reaction) => {
    onReact(message.id, reaction);
    setShowReactionPicker(false);
  };

  const renderContent = () => {
    switch (message.type) {
      case MessageType.IMAGE:
        return (
          <img
            src={message.fileUrl}
            alt="Shared image"
            className="max-w-sm max-h-64 rounded-lg object-contain"
          />
        );
      case MessageType.FILE:
        return (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>{message.fileName}</span>
          </a>
        );
      case MessageType.POLL:
        return (
          <PollMessage
            poll={message.poll}
            onVote={message.onVote}
            currentUser={currentUser}
            onFinalize={message.onFinalize}
            isOrganizer={message.sender === currentUser?.username}
            onEdit={message.onEdit}
          />
        );
      default:
        return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className="flex items-end gap-2">
        {!isOwnMessage && (
          <img
            src={message.senderProfilePic || '/default-avatar.png'}
            alt={message.sender}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {!isOwnMessage && (
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2 mb-1">
              {message.sender}
            </span>
          )}
          <div
            className={`relative group max-w-md ${
              isOwnMessage
                ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-r-lg rounded-tl-lg'
            } p-3 shadow-sm`}
            onDoubleClick={() => showReactions && setShowReactionPicker(true)}
          >
            {renderContent()}
            <div className="text-xs mt-1 opacity-75">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>

            {showReactions && (
              <>
                {/* Reaction Picker */}
                <AnimatePresence>
                  {showReactionPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`absolute ${
                        isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'
                      } top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg p-1 flex items-center gap-1 z-10`}
                    >
                      {Object.entries(REACTIONS).map(([key, emoji]) => (
                        <button
                          key={key}
                          onClick={() => handleReaction(key)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Display Reactions */}
                {message.reactions?.length > 0 && (
                  <div className="absolute -bottom-6 left-0 bg-white dark:bg-gray-800 rounded-full shadow-md px-2 py-1 flex items-center gap-1">
                    {Object.entries(
                      message.reactions.reduce((acc, reaction) => {
                        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <span key={type} className="flex items-center gap-1">
                        {REACTIONS[type]} {count}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Chat Input Component
const ChatInput = ({ onSend, onFileSelect }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage('');
    setShowEmojiPicker(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await API.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onFileSelect(response.data);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/*"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Image className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Smile className="w-5 h-5" />
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2">
              <Picker
                data={data}
                onEmojiSelect={(emoji) => {
                  setMessage((prev) => prev + emoji.native);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </div>
        <button
          type="submit"
          className="p-2 text-blue-500 hover:text-blue-600"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};

// Message List Component with Infinite Scroll
const MessageList = ({ messages, currentUser, onReact, loadMore, hasMore }) => {
  const observerRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true);
          await loadMore();
          setLoading(false);
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      )}
      {hasMore && <div ref={observerRef} className="h-4" />}
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          currentUser={currentUser}
          onReact={onReact}
        />
      ))}
    </div>
  );
};

// Base Chat Layout Component
const ChatLayout = ({
  title,
  showSidebar = true,
  onToggleSidebar,
  sidebarContent,
  children,
}) => {
  return (
    <div className="flex h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          {showSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          )}
        </div>
        {children}
      </div>
      {showSidebar && (
        <div className="hidden lg:block w-80 border-l dark:border-gray-700 bg-white dark:bg-gray-800">
          {sidebarContent}
        </div>
      )}
    </div>
  );
};

// Hook for managing chat messages with pagination
const useChatMessages = (initialMessages = [], fetchMore) => {
  const [messages, setMessages] = useState(initialMessages);
  const [hasMore, setHasMore] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState(null);

  const loadMore = async () => {
    if (!hasMore) return;

    try {
      const olderMessages = await fetchMore(oldestMessageId);
      if (olderMessages.length === 0) {
        setHasMore(false);
      } else {
        setMessages((prev) => [...prev, ...olderMessages]);
        setOldestMessageId(olderMessages[olderMessages.length - 1].id);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Failed to load more messages');
    }
  };

  const addMessage = (newMessage) => {
    setMessages((prev) => [newMessage, ...prev]);
  };

  const updateMessage = (messageId, updates) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  };

  return { messages, hasMore, loadMore, addMessage, updateMessage };
};

export {
  Message,
  ChatInput,
  MessageList,
  ChatLayout,
  useChatMessages,
  MessageType,
  REACTIONS
};