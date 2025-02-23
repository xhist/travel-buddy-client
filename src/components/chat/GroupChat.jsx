import React, { useState, useEffect, useRef } from 'react';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import API from '../../api/api';
import { Message, MessageGroup } from './layouts/Message';
import ChatInput from './layouts/ChatInput';
import OnlineUsers from './OnlineUsers';
import { Menu, Users, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const GroupChat = ({ tripId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const observerRef = useRef(null);
  const { client, connected } = useStompClient();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!client || !connected) return;

    const subscription = client.subscribe(
      `/topic/trip/${tripId}`,
      (message) => {
        try {
          const receivedMessage = JSON.parse(message.body);
          setMessages(prev => {
            if (prev.some(msg => msg.id === receivedMessage.id)) {
              return prev;
            }
            return [receivedMessage, ...prev];
          });
          scrollToBottom();
        } catch (error) {
          console.error('Error handling message:', error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [client, connected, tripId]);

  useEffect(() => {
    loadInitialMessages();
  }, [tripId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          await loadMoreMessages();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, oldestMessageId]);

  const parseTimestamp = (timestamp) => {
    try {
      if (!timestamp) return null;

      // If it's already a Date object
      if (timestamp instanceof Date) {
        return timestamp;
      }

      // If it's a PostgreSQL timestamp format (2025-02-22 23:19:40.478380)
      if (typeof timestamp === 'string' && timestamp.includes('.')) {
        const parts = timestamp.split('.');
        return new Date(parts[0].replace(' ', 'T') + 'Z');
      }

      // Try to parse as regular date string
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date;
      }

      return null;
    } catch (e) {
      console.error('Error parsing timestamp:', timestamp, e);
      return null;
    }
  };

  const getDateKey = (timestamp) => {
    const date = parseTimestamp(timestamp);
    if (!date) return 'unknown';
    return date.toISOString().split('T')[0];
  };

  const getGroupKeyFromTimestamp = (timestamp) => {
    try {
      // Format: "2025-02-22 23:19:40.478380"
      if (typeof timestamp === 'string') {
        // Extract just the date part: "2025-02-22"
        return timestamp.split(' ')[0];
      }
      return new Date().toISOString().split('T')[0];
    } catch (e) {
      console.error('Error getting group key:', e);
      return new Date().toISOString().split('T')[0];
    }
  };

  const compareTimestamps = (a, b) => {
    try {
      // Extract datetime without milliseconds
      const getTime = (timestamp) => {
        if (typeof timestamp === 'string') {
          // Split at the decimal point if exists
          return timestamp.split('.')[0];
        }
        return timestamp;
      };

      const timeA = new Date(getTime(a.timestamp));
      const timeB = new Date(getTime(b.timestamp));
      
      if (isNaN(timeA.getTime()) || isNaN(timeB.getTime())) {
        return 0;
      }
      
      return timeB.getTime() - timeA.getTime();
    } catch (e) {
      console.error('Error comparing timestamps:', e);
      return 0;
    }
  };

  const groupMessagesByDate = (messages) => {
    if (!Array.isArray(messages) || messages.length === 0) return [];
    
    const groups = {};
    
    // Sort messages by timestamp in descending order
    const sortedMessages = [...messages].sort(compareTimestamps);

    // Group messages by date
    sortedMessages.forEach(message => {
      try {
        if (!message?.timestamp) return;

        const dateKey = getGroupKeyFromTimestamp(message.timestamp);
        
        if (!groups[dateKey]) {
          groups[dateKey] = {
            timestamp: message.timestamp,
            messages: [],
            lastMessageUser: message.sender ? {
              username: message.sender,
              profilePicture: message.senderProfilePic || '/default-avatar.png'
            } : null
          };
        }
        groups[dateKey].messages.push(message);
      } catch (e) {
        console.error('Error grouping message:', message, e);
      }
    });

    return Object.values(groups);
  };

  const loadInitialMessages = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/chat/messages/trip/${tripId}`, {
        params: { limit: 20 }
      });
      
      if (response.data.length < 20) {
        setHasMore(false);
      }
      
      if (response.data.length > 0) {
        setMessages(response.data);
        setOldestMessageId(response.data[response.data.length - 1].id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMore || !oldestMessageId) return;

    try {
      setLoadingMore(true);
      const response = await API.get(`/chat/messages/trip/${tripId}`, {
        params: {
          before: oldestMessageId,
          limit: 20
        }
      });

      if (response.data.length === 0) {
        setHasMore(false);
      } else {
        setMessages(prev => [...prev, ...response.data]);
        setOldestMessageId(response.data[response.data.length - 1].id);
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
        destination: `/app/chat.trip.${tripId}`,
        body: JSON.stringify({
          content,
          type: 'TEXT',
          timestamp: new Date().toISOString()
        })
      });
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
        destination: `/app/chat.trip.${tripId}`,
        body: JSON.stringify({
          content: response.data.fileUrl,
          fileName: response.data.fileName,
          type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleCreatePoll = async (pollData) => {
    try {
      const response = await API.post(`/trips/${tripId}/polls`, {
        question: pollData.question,
        options: pollData.options.map(opt => opt.text)
      });
      
      if (response && response.data) {
        client.publish({
          destination: `/app/chat.trip.${tripId}`,
          body: JSON.stringify({
            type: 'POLL',
            pollId: response.data.id || response.data,
            timestamp: new Date().toISOString()
          })
        });
  
        toast.success('Poll created successfully');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
      throw error;
    }
  };

  const handleVote = async (pollId, optionId) => {
    try {
      const response = await API.post(`/trips/${tripId}/polls/${pollId}/vote`, {
        optionId
      });

      setMessages(prev => 
        prev.map(msg => 
          msg.type === 'POLL' && msg.poll?.id === pollId
            ? { ...msg, poll: response.data }
            : msg
        )
      );
    } catch (error) {
      console.error('Error voting in poll:', error);
      toast.error('Failed to vote in poll');
    }
  };

  const handleReaction = async (messageId, reactionType) => {
    try {
      const response = await API.post(`/chat/messages/${messageId}/reactions`, {
        reactionType
      });
      
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, reactions: response.data.reactions } : msg
        )
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 p-4 
          flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Group Chat
          </h2>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Container */}
        <div className="flex flex-1 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingMore && (
              <div className="text-center py-4">
                <Loader className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
              </div>
            )}
            {hasMore && <div ref={observerRef} className="h-4" />}
            <div className="flex flex-col-reverse">
              {messageGroups.map((group, groupIndex) => (
                <div key={`${group.timestamp}-${groupIndex}`}>
                  <MessageGroup timestamp={group.timestamp} />
                  {group.messages.map((message, messageIndex) => (
                    <Message
                      key={message.id}
                      message={message}
                      currentUser={user}
                      onReact={handleReaction}
                      onVote={handleVote}
                      isLastInGroup={messageIndex === 0}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 border-l dark:border-gray-700">
            <div className="h-full overflow-y-auto">
              <OnlineUsers
                isOpen={true}
                onClose={() => {}}
                onUserChat={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <ChatInput
          onSend={handleSendMessage}
          onFileSelect={handleFileSelect}
          onCreatePoll={handleCreatePoll}
        />
      </div>

      {/* Mobile Sidebar */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 z-50">
          <OnlineUsers
            isOpen={true}
            onClose={() => setShowSidebar(false)}
            onUserChat={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export default GroupChat;