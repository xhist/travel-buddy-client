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

  // Subscribe to new messages
  useEffect(() => {
    if (!client || !connected) return;

    const subscription = client.subscribe(
      `/topic/trip/${tripId}`,
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
  }, [client, connected, tripId]);

  // Load initial messages
  useEffect(() => {
    loadInitialMessages();
  }, [tripId, client, connected]);

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

  /**
   * getGroupKeyFromTimestamp:
   * - If the message is from today, returns "HH:mm"
   * - If from the current year (but not today), returns "DD MMM at HH:mm" (e.g. "22 FEB at 13:50")
   * - If older than the current year, returns "DD/MM/YYYY at HH:mm" (e.g. "22/03/2020 at 13:50")
   */
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
    if (!client || !connected) return;
    try {
      setLoading(true);
      const response = await API.get(`/chat/messages/trip/${tripId}`, { params: { limit: 20 } });
      if (response.data.length < 20) setHasMore(false);
      if (response.data.length > 0) {
        setMessages(response.data);
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
      const response = await API.post(`/trips/${tripId}/polls/${pollId}/vote`, { optionId });
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
      // Update the message's reactions using the API response so the UI updates immediately
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
            <OnlineUsers isOpen={true} onClose={() => {}} onUserChat={() => {}} className="flex-1" />
          </div>
        </div>
        <ChatInput onSend={handleSendMessage} onFileSelect={handleFileSelect} onCreatePoll={handleCreatePoll} />
      </div>
      <OnlineUsers isOpen={showSidebar} onClose={() => setShowSidebar(false)} onUserChat={() => {}} className="lg:hidden" />
    </div>
  );
};

export default GroupChat;
