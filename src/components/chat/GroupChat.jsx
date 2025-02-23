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
            // Avoid duplicates if the same message ID arrives again
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, client, connected]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && client && connected) {
          await loadMoreMessages();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, oldestMessageId, client, connected]);

  const getGroupKeyFromTimestamp = (timestamp) => {
    try {
      if (typeof timestamp === 'string') {
        // e.g. "2025-02-22 23:19:40.478380" => get date portion
        return timestamp.split(' ')[0];
      }
      return new Date(timestamp).toISOString().split('T')[0];
    } catch (e) {
      console.error('Error getting group key:', e);
      return new Date().toISOString().split('T')[0];
    }
  };

  const compareTimestamps = (a, b) => {
    try {
      const getTime = (ts) => {
        if (typeof ts === 'string') {
          return ts.split('.')[0]; // remove microseconds if any
        }
        return ts;
      };
      const timeA = new Date(getTime(a.timestamp));
      const timeB = new Date(getTime(b.timestamp));
      if (isNaN(timeA.getTime()) || isNaN(timeB.getTime())) {
        return 0;
      }
      // Sort descending by timestamp (newest first)
      return timeB.getTime() - timeA.getTime();
    } catch (e) {
      console.error('Error comparing timestamps:', e);
      return 0;
    }
  };

  const groupMessagesByDate = (messages) => {
    if (!Array.isArray(messages) || messages.length === 0) return [];

    const groups = {};
    const sortedMessages = [...messages].sort(compareTimestamps);

    let currentGroup = null;
    let currentSender = null;

    sortedMessages.forEach((msg, index) => {
      if (!msg?.timestamp) return;
      const dateKey = getGroupKeyFromTimestamp(msg.timestamp);

      if (!groups[dateKey]) {
        groups[dateKey] = {
          timestamp: msg.timestamp,
          messages: [],
          lastMessageUser: null
        };
      }

      const isNewSender = currentSender !== msg.sender;
      const isNewGroup = currentGroup !== dateKey;

      if (isNewSender || isNewGroup) {
        currentSender = msg.sender;
        msg.isFirstInSequence = true;
      }

      currentGroup = dateKey;
      groups[dateKey].messages.push(msg);

      // Update last message user for the group
      if (msg.sender && (!groups[dateKey].lastMessageUser || index === messages.length - 1)) {
        groups[dateKey].lastMessageUser = {
          username: msg.sender,
          profilePicture: msg.senderProfilePic || '/default-avatar.png'
        };
      }
    });

    return Object.values(groups);
  };

  const loadInitialMessages = async () => {
    if (!client || !connected) return;
    try {
      setLoading(true);
      const response = await API.get(`/chat/messages/trip/${tripId}`, { params: { limit: 20 } });
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
    if (!hasMore || !oldestMessageId || !client || !connected) return;
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
      // Update the local messages array so the UI shows the new poll data
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
      // Replace the message's reactions with updated data from server
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
        <div className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 
          p-4 flex items-center justify-between z-10">
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
                  <MessageGroup 
                    timestamp={group.timestamp}
                    lastMessageUser={group.lastMessageUser}
                  />
                  {group.messages.map((message, messageIndex) => (
                    <Message
                      key={message.id}
                      message={message}
                      currentUser={user}
                      onReact={handleReaction}
                      onVote={handleVote}
                      isLastInGroup={messageIndex === group.messages.length - 1}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 border-l dark:border-gray-700 bg-white dark:bg-gray-800">
            <OnlineUsers
              isOpen={true}
              onClose={() => {}}
              onUserChat={() => {}}
              className="h-full"
            />
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
      <OnlineUsers
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onUserChat={() => {}}
        className="lg:hidden"
      />
    </div>
  );
};

export default GroupChat;
