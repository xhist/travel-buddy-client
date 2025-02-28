import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import API from '../../api/api';
import { Message, MessageGroup } from './layouts/Message';
import ChatInput from './layouts/ChatInput';
import OnlineUsers from './OnlineUsers';
import { Menu, Users, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const GroupChat = ({ tripId: propTripId }) => {
  const { id: paramTripId } = useParams();
  const resolvedTripId = propTripId || paramTripId;
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

  // Subscribe to room-specific presence
  useEffect(() => {
    if (!client || !connected || !resolvedTripId) return;

    // Join the chat room
    client.publish({
      destination: `/app/room.${resolvedTripId}.join`,
      body: JSON.stringify({})
    });

    // Clean up function to leave the room
    return () => {
      if (client && connected) {
        client.publish({
          destination: `/app/room.${resolvedTripId}.leave`,
          body: JSON.stringify({})
        });
      }
    };
  }, [client, connected, resolvedTripId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!client || !connected || !resolvedTripId) return;

    const subscription = client.subscribe(
      `/topic/trip/${resolvedTripId}`,
      (message) => {
        try {
          const receivedMessage = JSON.parse(message.body);
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === receivedMessage.id)) return prev;
            return [...prev, receivedMessage];
          });
          scrollToBottom();
        } catch (error) {
          console.error('Error handling message:', error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [client, connected, resolvedTripId]);

  // Subscribe to poll updates
  useEffect(() => {
    if (!client || !connected || !resolvedTripId) return;

    const subscription = client.subscribe(
      `/topic/trip/${resolvedTripId}/polls`,
      (message) => {
        try {
          const updatedPoll = JSON.parse(message.body);
          
          // Update existing poll message or add new one
          setMessages(prev => {
            const pollMessageIndex = prev.findIndex(msg => 
              msg.type === 'POLL' && msg.poll?.id === updatedPoll.id
            );
            
            if (pollMessageIndex >= 0) {
              // Update existing poll message
              const updatedMessages = [...prev];
              updatedMessages[pollMessageIndex] = {
                ...updatedMessages[pollMessageIndex],
                poll: updatedPoll
              };
              return updatedMessages;
            }
            
            // If not found, it might be a new poll (shouldn't happen here, but just in case)
            return prev;
          });
        } catch (error) {
          console.error('Error handling poll update:', error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [client, connected, resolvedTripId]);

  // Load initial messages
  useEffect(() => {
    if (resolvedTripId) {
      loadInitialMessages();
    }
  }, [resolvedTripId, client, connected]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && client && connected) {
          await loadMoreMessages();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, oldestMessageId, client, connected]);

  // --------------------
  // Parsing & Grouping
  // --------------------
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

  const getGroupKeyFromTimestamp = (timestamp) => {
    const date = parseTimestamp(timestamp);
    if (!date) return 'Unknown';
    const now = new Date();
    const isToday = date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const isCurrentYear = date.getFullYear() === now.getFullYear();
    if (isCurrentYear) {
      const day = date.getDate();
      const monthName = date.toLocaleString('en', { month: 'short' }).toUpperCase();
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${monthName} at ${hour}:${minute}`;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} at ${hour}:${minute}`;
  };

  // Sort ascending (oldest first)
  const compareTimestamps = (a, b) => {
    const tA = parseTimestamp(a.timestamp)?.getTime() || 0;
    const tB = parseTimestamp(b.timestamp)?.getTime() || 0;
    return tA - tB;
  };

  const groupMessagesByDateTime = (msgs) => {
    if (!Array.isArray(msgs) || msgs.length === 0) return [];
    const sorted = [...msgs].sort(compareTimestamps);
    const groups = {};
    let currentGroup = null;
    let currentSender = null;
    sorted.forEach((msg, index) => {
      const groupKey = getGroupKeyFromTimestamp(msg.timestamp);
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          timestamp: msg.timestamp,
          messages: [],
          lastMessageUser: null
        };
      }
      const isNewSender = currentSender !== msg.sender;
      const isNewGroup = currentGroup !== groupKey;
      if (isNewSender || isNewGroup) {
        currentSender = msg.sender;
        msg.isFirstInSequence = true;
      }
      currentGroup = groupKey;
      groups[groupKey].messages.push(msg);
      if (msg.sender && (!groups[groupKey].lastMessageUser || index === sorted.length - 1)) {
        groups[groupKey].lastMessageUser = {
          username: msg.sender,
          profilePicture: msg.senderProfilePic || '/default-avatar.png'
        };
      }
    });
    return Object.values(groups);
  };

  // --------------------
  // Data Fetching
  // --------------------
  const loadInitialMessages = async () => {
    if (!resolvedTripId) return;
    try {
      setLoading(true);
      const response = await API.get(`/chat/messages/trip/${resolvedTripId}`, { params: { limit: 20 } });
      if (response.data.length < 20) setHasMore(false);
      if (response.data.length > 0) {
        // For each message of type POLL, fetch the poll details
        const enrichedMessages = await Promise.all(response.data.map(async (message) => {
          if (message.type === 'POLL' && message.pollId) {
            try {
              const pollResponse = await API.get(`/trips/${resolvedTripId}/polls/${message.pollId}`);
              return { ...message, poll: pollResponse.data };
            } catch (err) {
              console.error('Error fetching poll details:', err);
              return message;
            }
          }
          return message;
        }));
        
        setMessages(enrichedMessages);
        setOldestMessageId(response.data[0].id);
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
    if (!hasMore || !oldestMessageId || !resolvedTripId) return;
    try {
      setLoadingMore(true);
      const response = await API.get(`/chat/messages/trip/${resolvedTripId}`, {
        params: {
          before: oldestMessageId,
          limit: 20
        }
      });
      if (response.data.length === 0) {
        setHasMore(false);
      } else {
        // For each message of type POLL, fetch the poll details
        const enrichedMessages = await Promise.all(response.data.map(async (message) => {
          if (message.type === 'POLL' && message.pollId) {
            try {
              const pollResponse = await API.get(`/trips/${resolvedTripId}/polls/${message.pollId}`);
              return { ...message, poll: pollResponse.data };
            } catch (err) {
              console.error('Error fetching poll details:', err);
              return message;
            }
          }
          return message;
        }));
        
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

  // --------------------
  // Message Actions
  // --------------------
  const handleSendMessage = (text) => {
    if (!client || !connected || !resolvedTripId) {
      toast.error('Not connected to chat server');
      return;
    }
    // Construct the message payload with content and type
    const messagePayload = {
      content: {
        type: 'TEXT',
        text: text,
        senderId: user.id,
        senderUsername: user.username
      },
      type: 'TEXT',
      timestamp: new Date().toISOString()
    };
    client.publish({
      destination: `/app/chat.trip.${resolvedTripId}`,
      body: JSON.stringify(messagePayload)
    });
  };

  // Handling file uploads (image or other files)
  const handleFileSelect = async (file) => {
    try {
      // Upload file to server to get a URL
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await API.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (!client || !connected || !resolvedTripId) {
        toast.error('Not connected to chat server');
        return;
      }
      // Determine message type based on file type (image vs generic file)
      const msgType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      // Build content object with appropriate fields
      let contentObj;
      if (msgType === 'IMAGE') {
        contentObj = {
          type: 'IMAGE',
          imageUrl: uploadRes.data.fileUrl,
          senderId: user.id,
          senderUsername: user.username
        };
      } else {
        contentObj = {
          type: 'FILE',
          fileUrl: uploadRes.data.fileUrl,
          fileName: uploadRes.data.fileName,
          fileType: file.type,
          fileSize: file.size,
          senderId: user.id,
          senderUsername: user.username
        };
      }
      // Publish the message with content and top-level type
      const fileMessagePayload = {
        content: contentObj,
        type: msgType,
        fileName: uploadRes.data.fileName,   // include fileName at top-level for convenience
        timestamp: new Date().toISOString()
      };
      client.publish({
        destination: `/app/chat.trip.${resolvedTripId}`,
        body: JSON.stringify(fileMessagePayload)
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  // Handling poll creation
  const handleCreatePoll = async (pollData) => {
    if (!resolvedTripId) {
      toast.error('Trip ID is missing');
      return;
    }
    try {
      // Create the poll via REST API to get a poll ID
      const response = await API.post(`/trips/${resolvedTripId}/polls`, {
        question: pollData.question,
        options: pollData.options.map(opt => opt.text)  // ensure options are List<String>
      });
      const newPoll = response.data;
      if (newPoll) {
        // Build poll content message
        const pollContent = {
          type: 'POLL',
          question: pollData.question,
          options: pollData.options,  // List of strings
          finalized: pollData.finalized,
          senderId: user.id,
          senderUsername: user.username
        };
        const pollMessagePayload = {
          content: pollContent,
          type: 'POLL',              // include poll ID for reference
          timestamp: new Date().toISOString()
        };
        client.publish({
          destination: `/app/chat.trip.${resolvedTripId}`,
          body: JSON.stringify(pollMessagePayload)
        });
        toast.success('Poll created successfully');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
    }
  };


  const handleVote = async (pollId, optionId) => {
    if (!resolvedTripId) {
      toast.error('Trip ID is missing');
      return;
    }

    try {
      const response = await API.post(`/trips/${resolvedTripId}/polls/${pollId}/vote`, { optionId });
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
      const response = await API.post(`/chat/messages/${messageId}/reactions`, { reactionType });
      // Update the message's reactions using the API response
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

  // --------------------
  // Render
  // --------------------
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

  if (!resolvedTripId) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg text-center">
          Trip ID is missing. Please ensure you're viewing this page correctly.
        </div>
      </div>
    );
  }

  const grouped = groupMessagesByDateTime(messages);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        <div className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Group Chat
          </h2>
          <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingMore && (
              <div className="text-center py-4">
                <Loader className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
              </div>
            )}
            {hasMore && <div ref={observerRef} className="h-4" />}
            <div className="flex flex-col">
              {grouped.map((group, index) => (
                <div key={`${group.key}-${index}`}>
                  <MessageGroup groupKey={group.key} lastMessageUser={group.lastMessageUser} />
                  {group.messages.map((message, msgIdx) => (
                    <Message
                      key={message.id}
                      message={message}
                      currentUser={user}
                      onReact={handleReaction}
                      onVote={handleVote}
                      isLastInGroup={msgIdx === group.messages.length - 1}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </div>
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex flex-col w-80 border-l dark:border-gray-700 bg-white dark:bg-gray-800 h-full">
            <OnlineUsers isOpen={true} onClose={() => {}} tripId={resolvedTripId} className="flex-1" />
          </div>
        </div>
        <ChatInput 
          onSend={handleSendMessage} 
          onFileSelect={handleFileSelect} 
          onCreatePoll={handleCreatePoll} 
        />
      </div>
      {/* Mobile Sidebar */}
      <OnlineUsers isOpen={showSidebar} onClose={() => setShowSidebar(false)} tripId={resolvedTripId} className="lg:hidden" />
    </div>
  );
};

export default GroupChat;