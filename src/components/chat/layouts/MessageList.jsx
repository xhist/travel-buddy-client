import React, { useEffect, useRef, useState } from 'react';
import { Message, MessageGroup } from './Message';

export const MessageList = ({ messages, currentUser, onReact, onVote, loadMore, hasMore }) => {
  const observerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [loadedGroups, setLoadedGroups] = useState([]);

  // Group messages by datetime for better display
  useEffect(() => {
    if (!messages || messages.length === 0) {
      setLoadedGroups([]);
      return;
    }

    // Sort messages by timestamp in ascending order (oldest first)
    const sortedMessages = [...messages].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });

    // Group messages by date (simplified)
    const groups = [];
    let currentDate = null;
    let currentGroup = null;

    sortedMessages.forEach(message => {
      const messageDate = new Date(message.timestamp);
      const dateStr = messageDate.toLocaleDateString();
      
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        currentGroup = {
          date: dateStr,
          displayDate: formatGroupDate(messageDate),
          messages: []
        };
        groups.push(currentGroup);
      }
      
      currentGroup.messages.push(message);
    });

    setLoadedGroups(groups);
  }, [messages]);

  // Format the date for display in message groups
  const formatGroupDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Handle infinite scroll for loading more messages
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loadedGroups]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      )}
      
      {hasMore && <div ref={observerRef} className="h-4" />}
      
      <div className="flex flex-col space-y-4">
        {loadedGroups.map((group, groupIndex) => (
          <div key={group.date} className="space-y-2">
            <MessageGroup groupKey={group.displayDate} />
            {group.messages.map((message, messageIndex) => (
              <Message
                key={message.id || `${group.date}-${messageIndex}`}
                message={message}
                currentUser={currentUser}
                onReact={onReact}
                onVote={onVote}
                isLastInGroup={messageIndex === group.messages.length - 1 || 
                              group.messages[messageIndex + 1]?.sender !== message.sender}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;