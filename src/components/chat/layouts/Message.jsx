import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import MessageReactions from './MessageReactions';

const parseTimestamp = (timestamp) => {
  try {
    // For PostgreSQL timestamp format: "2025-02-22 23:19:40.478380"
    if (typeof timestamp === 'string' && timestamp.includes(' ')) {
      return new Date(timestamp.replace(' ', 'T'));
    }
    return new Date(timestamp);
  } catch (e) {
    console.error('Error parsing timestamp:', e);
    return new Date();
  }
};

const formatTime = (timestamp) => {
  try {
    if (!timestamp) return '';

    // For PostgreSQL timestamp format: "2025-02-22 23:19:40.478380"
    if (typeof timestamp === 'string') {
      // Split at decimal point and space to get just the time part
      const timePart = timestamp.split(' ')[1].split('.')[0];
      // Extract hours and minutes
      return timePart.substring(0, 5);
    }

    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: false 
    });
  } catch (e) {
    console.error('Error formatting time:', e);
    return '';
  }
};

const formatDate = (timestamp) => {
  try {
    if (!timestamp) return '';

    // For PostgreSQL timestamp format: "2025-02-22 23:19:40.478380"
    if (typeof timestamp === 'string') {
      const datePart = timestamp.split(' ')[0];
      const date = new Date(datePart);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString([], { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }

    return new Date(timestamp).toLocaleDateString([], { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};

const MessageGroup = ({ timestamp, lastMessageUser }) => (
  <div className="flex items-center justify-center my-6 relative">
    <div className="absolute w-full border-t border-gray-200 dark:border-gray-700"></div>
    <div className="relative px-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-full 
        shadow-sm border border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {formatDate(timestamp)}
        </span>
        {lastMessageUser && (
          <>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
            <div className="relative">
              <img
                src={lastMessageUser.profilePicture || '/default-avatar.png'}
                alt={lastMessageUser.username}
                className="w-6 h-6 rounded-full"
              />
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);

const Message = ({ message, currentUser, onReact, onVote, isLastInGroup }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const isOwnMessage = message.sender === currentUser?.username;

  const handleProfileClick = () => {
    window.location.href = `/profile/${message.sender}`;
  };

  const renderPoll = () => {
    if (!message.poll) return null;
    const totalVotes = message.poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

    return (
      <div className="mt-2 space-y-2">
        <h4 className="font-medium mb-3">{message.poll.question}</h4>
        {message.poll.options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes?.length || 0) / totalVotes * 100 : 0;
          const hasVoted = option.votes?.some(vote => vote.userId === currentUser?.id);
          
          return (
            <div key={option.id} className="relative mb-2">
              <button 
                onClick={() => onVote(message.poll.id, option.id)}
                className="w-full text-left relative overflow-hidden"
              >
                <div className={`p-2 rounded-lg relative z-10 ${
                  hasVoted ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <div className="absolute left-0 top-0 h-full bg-blue-200 dark:bg-blue-800/50 
                    transition-all duration-300" 
                    style={{ width: `${percentage}%` }} 
                  />
                  <div className="relative z-10 flex justify-between items-center">
                    <span>{option.text}</span>
                    <span className="text-sm ml-2">
                      {option.votes?.length || 0} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </button>
              
              {option.votes?.length > 0 && (
                <div className="mt-1 ml-2 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-1">
                  {option.votes.map((vote, idx) => (
                    <span key={vote.userId || idx} className="flex items-center">
                      {vote.username}
                      {idx < option.votes.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Total votes: {totalVotes}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 relative group min-h-[40px]`}>
      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
        {!isOwnMessage && (
          <>
            {!isLastInGroup && (
              <img
                src={message.senderProfilePic || '/default-avatar.png'}
                alt={message.sender}
                className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleProfileClick}
              />
            )}
            {isLastInGroup && (
              <div className="w-8" />
            )}
          </>
        )}
        
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {!isOwnMessage && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2 mb-1">
              {message.sender}
            </span>
          )}
          
          <div
            className={`relative group max-w-full ${
              isOwnMessage
                ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-r-lg rounded-tl-lg'
            } p-3 shadow-sm hover:shadow-md transition-shadow`}
          >
            {message.type === 'IMAGE' ? (
              <img
                src={message.content}
                alt="Shared"
                className="max-w-full h-auto rounded-lg object-contain"
              />
            ) : message.type === 'FILE' ? (
              <a
                href={message.content}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-600 rounded hover:bg-gray-100 
                  dark:hover:bg-gray-500 transition-colors group"
              >
                <FileText className="w-5 h-5" />
                <span>{message.fileName}</span>
                <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ) : message.type === 'POLL' ? (
              renderPoll()
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
            
            <div className="text-xs mt-1 opacity-75">
              {formatTime(message.timestamp)}
            </div>

            <MessageReactions
              message={message}
              onReact={onReact}
              isOwnMessage={isOwnMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { Message, MessageGroup };