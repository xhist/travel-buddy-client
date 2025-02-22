import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download } from 'lucide-react';

const REACTIONS = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😂',
  SURPRISED: '😮',
  SAD: '😢',
  ANGRY: '😠'
};

const formatTime = (timestamp) => {
  try {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  } catch (e) {
    return '';
  }
};

const Message = ({ message, currentUser, onReact }) => {
  const [showReactions, setShowReactions] = useState(false);
  const isOwnMessage = message.sender === currentUser?.username;

  const handleReactionClick = (reactionType) => {
    onReact(message.id, reactionType);
    setShowReactions(false);
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'IMAGE':
        return (
          <img
            src={message.content}
            alt="Shared image"
            className="max-w-sm max-h-64 rounded-lg object-contain hover:opacity-90 transition-opacity cursor-pointer"
            onClick={() => window.open(message.content, '_blank')}
          />
        );
      case 'FILE':
        return (
          <a
            href={message.content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg 
              hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
          >
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="flex-1 truncate">{message.fileName}</span>
            <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        );
      case 'POLL':
        return message.pollComponent;
      default:
        return (
          <p className="whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  const renderReactions = () => {
    if (!message.reactions?.length) return null;

    const reactionCounts = message.reactions.reduce((acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    }, {});

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute -bottom-6 bg-white dark:bg-gray-800 rounded-full shadow-md 
          px-2 py-1 flex items-center gap-1 text-sm border dark:border-gray-700"
      >
        {Object.entries(reactionCounts).map(([type, count]) => (
          <span key={type} className="flex items-center gap-1" title={`${count} reaction${count > 1 ? 's' : ''}`}>
            {REACTIONS[type]}
            <span className="text-xs text-gray-500">{count}</span>
          </span>
        ))}
      </motion.div>
    );
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className="flex items-end gap-2 group">
        {!isOwnMessage && (
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={message.senderProfilePic || '/default-avatar.png'}
            alt={message.sender}
            className="w-8 h-8 rounded-full object-cover"
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
                ? 'bg-blue-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-lg rounded-tr-lg rounded-br-lg'
            } p-3 shadow-sm hover:shadow-md transition-shadow`}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            {renderMessageContent()}
            
            <div className="text-xs mt-1 opacity-75">
              {formatTime(message.timestamp)}
            </div>

            {/* Reaction Picker */}
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute ${
                    isOwnMessage ? 'right-0' : 'left-0'
                  } -top-10 bg-white dark:bg-gray-800 rounded-full shadow-lg 
                    p-1 flex items-center gap-1 z-10 border dark:border-gray-700`}
                >
                  {Object.entries(REACTIONS).map(([key, emoji]) => (
                    <button
                      key={key}
                      onClick={() => handleReactionClick(key)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full 
                        transition-colors transform hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reactions Display */}
            {renderReactions()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;