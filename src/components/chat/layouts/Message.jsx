import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import MessageReactions from './MessageReactions';

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
  const [showAvatarTooltip, setShowAvatarTooltip] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const isOwnMessage = message.sender === currentUser?.username;

  const handleProfileClick = () => {
    window.location.href = `/profile/${message.sender}`;
  };

  const renderPoll = () => {
    if (!message.poll) return null;
    const totalVotes = message.poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
    return (
      <div className="mt-2 space-y-2 min-w-[200px]">
        <h4 className="font-medium mb-3">{message.poll.question}</h4>
        {message.poll.options.map((option) => {
          const votesCount = option.votes?.length || 0;
          const hasVoted = option.votes?.some(vote => vote.userId === currentUser?.id);
          const percentage = totalVotes > 0 ? (votesCount / totalVotes) * 100 : 0;
          return (
            <div key={option.id} className="relative mb-2">
              <button onClick={() => onVote(message.poll.id, option.id)} className="w-full text-left">
                <div className={`
                    p-2 rounded-lg relative overflow-hidden
                    ${hasVoted ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}
                  `}>
                  <div className="absolute left-0 top-0 h-full bg-blue-200 dark:bg-blue-800/50 transition-all duration-300" style={{ width: `${percentage}%` }} />
                  <div className="relative z-10 flex justify-between items-center">
                    <span>{option.text}</span>
                    <span className="text-sm ml-2">
                      {votesCount} ({percentage.toFixed(1)}%)
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
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 relative min-h-[40px]`}>
      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="w-8 relative">
          {isLastInGroup && (
            <div className="relative">
              <img
                src={message.senderProfilePic || '/default-avatar.png'}
                alt={message.sender}
                className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleProfileClick}
                onMouseEnter={() => setShowAvatarTooltip(true)}
                onMouseLeave={() => setShowAvatarTooltip(false)}
              />
              {showAvatarTooltip && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-50 whitespace-nowrap">
                  {message.sender}
                </div>
              )}
            </div>
          )}
        </div>
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <div className="relative" onMouseEnter={() => setShowReactions(true)} onMouseLeave={() => setShowReactions(false)}>
            <div className={`max-w-full ${isOwnMessage ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-r-lg rounded-tl-lg'} p-3 shadow-sm hover:shadow-md transition-shadow`}>
              {message.type === 'IMAGE' ? (
                <img src={message.content} alt="Shared" className="max-w-full h-auto rounded-lg object-contain" />
              ) : message.type === 'FILE' ? (
                <a href={message.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors group">
                  <FileText className="w-5 h-5" />
                  <span>{message.fileName}</span>
                  <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ) : message.type === 'POLL' ? (
                renderPoll()
              ) : (
                <p className={`whitespace-pre-wrap break-words ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                  {message.content}
                </p>
              )}
              <div className={`text-xs mt-1 opacity-75 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                {formatTime(message.timestamp) || 'No time'}
              </div>
            </div>
            <MessageReactions message={message} onReact={onReact} isOwnMessage={isOwnMessage} showReactions={showReactions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export { Message, MessageGroup };
