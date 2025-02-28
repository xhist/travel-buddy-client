import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import MessageReactions from './MessageReactions';

// Message content type handlers - allows for easy extension of new message types
const MESSAGE_TYPE_HANDLERS = {
  TEXT: {
    extract: (content) => content.text,
    render: (content, message) => (
      <p className="whitespace-pre-wrap break-words">
        {content}
      </p>
    )
  },
  IMAGE: {
    extract: (content) => content.imageUrl,
    render: (content) => (
      <img src={content} alt="Shared" className="max-w-full h-auto rounded-lg object-contain" />
    )
  },
  FILE: {
    extract: (content) => content.fileUrl,
    render: (content, message) => (
      <a 
        href={content} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors group"
      >
        <FileText className="w-5 h-5" />
        <span>{message.fileName || "File"}</span>
        <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    )
  },
  POLL: {
    extract: (content) => content.question,
    render: (content, message, { onVote, currentUser }) => {
      if (!message.content) return null;
      
      const totalVotes = message.content.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
      
      return (
        <div className="mt-2 space-y-3 min-w-[200px]">
          <h4 className="font-semibold text-lg mb-3">{message.content.question}</h4>
          {message.content.options.map((option) => {
            const votesCount = option.votes?.length || 0;
            const hasVoted = option.votes?.some(vote => vote.id === currentUser?.id);
            const percentage = totalVotes > 0 ? (votesCount / totalVotes) * 100 : 0;
            
            return (
              <div key={option.id} className="relative mb-3">
                <button 
                  onClick={() => onVote && onVote(message.content.id, option.id)} 
                  className={`
                    w-full text-left p-3 rounded-lg relative overflow-hidden transition-all
                    ${hasVoted 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}
                  `}
                  disabled={message.content.finalized || !onVote}
                >
                  <div className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                    hasVoted ? 'bg-blue-200 dark:bg-blue-800/50' : 'bg-gray-200 dark:bg-gray-600'
                  }`} style={{ width: `${percentage}%` }} />
                  
                  <div className="relative z-10 flex justify-between items-center">
                    <span className="font-medium">{option.text}</span>
                    <span className="text-sm font-semibold ml-2 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full">
                      {votesCount} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </button>
                
                {option.votes?.length > 0 && (
                  <div className="mt-1 ml-2 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-1">
                    {option.votes.slice(0, 3).map((vote, idx) => (
                      <span key={vote.id || idx} className="flex items-center">
                        {vote.username}
                        {idx < Math.min(option.votes.length, 3) - 1 && ", "}
                      </span>
                    ))}
                    {option.votes.length > 3 && (
                      <span>and {option.votes.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {message.content.finalized && (
            <div className="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              This poll has been finalized
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Total votes: {totalVotes}
          </div>
        </div>
      );
    }
  }
};

// Parse timestamps in various formats
const parseTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (Array.isArray(timestamp)) {
    const [year, month, day, hour, minute, second, nanosecond] = timestamp;
    const ms = Math.floor((nanosecond || 0) / 1e6);
    return new Date(year, month - 1, day, hour, minute, second, ms);
  }
  if (typeof timestamp === 'string') {
    const cleaned = timestamp.split('.')[0].replace(' ', 'T');
    const date = new Date(cleaned);
    return isNaN(date.getTime()) ? null : date;
  }
  if (timestamp instanceof Date) return timestamp;
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
};

const formatTime = (timestamp) => {
  const date = parseTimestamp(timestamp);
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Extract content from message based on type
const extractMessageContent = (message) => {
  if (!message.content) return '';
  
  // Handle simple string content
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  // Handle complex MessageContent object from the backend
  if (typeof message.content === 'object') {
    // Determine message type
    let messageType = message.type || 'TEXT';
    
    // Use the appropriate handler to extract content
    if (messageType && MESSAGE_TYPE_HANDLERS[messageType]) {
      return MESSAGE_TYPE_HANDLERS[messageType].extract(message.content);
    }
    
    // Fallback for unrecognized message types
    console.warn('Unrecognized message content format:', message.content);
    return '[Message content could not be displayed]';
  }
  
  return '[Empty message]';
};

// MessageGroup now receives a computed groupKey prop
const MessageGroup = ({ groupKey }) => {
  return (
    <div className="flex items-center justify-center my-4 relative">
      <div className="absolute w-full border-t border-gray-200 dark:border-gray-700"></div>
      <div className="relative px-4 bg-gray-50 dark:bg-gray-900">
        <div className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {groupKey || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
};

const Message = ({ message, currentUser, onReact, onVote, isLastInGroup }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const isOwnMessage = message.sender === currentUser?.username;

  // Extract the actual content to display
  const displayContent = extractMessageContent(message);

  const handleProfileClick = () => {
    window.location.href = `/profile/${message.sender}`;
  };

  const renderMessageContent = () => {
    // Determine message type
    let messageType = message.type || 'TEXT';
    
    // Use the appropriate handler to render content
    if (MESSAGE_TYPE_HANDLERS[messageType]) {
      return MESSAGE_TYPE_HANDLERS[messageType].render(displayContent, message, { onVote, currentUser });
    }
    
    // Fallback for unrecognized message types
    return <p className="text-red-500">Unknown message type: {messageType}</p>;
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-9 relative min-h-[40px]`}>
      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="w-8 relative">
          {isLastInGroup && (
            <div className="relative">
              <div 
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <img
                  src={message.senderProfilePic || '/default-avatar.png'}
                  alt={message.sender}
                  className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleProfileClick}
                />
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
                    {message.sender}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div 
          className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative group`}
        >
          <div 
            className="relative"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            <div className={`relative max-w-full ${isOwnMessage ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-r-lg rounded-tl-lg'} p-3 shadow-sm hover:shadow-md transition-shadow`}>
              {renderMessageContent()}
              <div className={`text-xs mt-1 opacity-75 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                {formatTime(message.timestamp) || 'No time'}
              </div>
            </div>
            
            <MessageReactions 
              message={message} 
              onReact={onReact} 
              isOwnMessage={isOwnMessage}
              showReactions={showReactions}
              onReactionSelect={() => setShowReactions(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { Message, MessageGroup };