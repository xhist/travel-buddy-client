import React, { useState, useEffect, useRef } from 'react';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import API from '../../api/api';
import Message from './layouts/Message';
import ChatInput from './layouts/ChatInput';
import OnlineUsers from './OnlineUsers';
import { Menu, Users, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
            // Prevent duplicate messages
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

  return (
    <div className="flex h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 p-4 
          flex items-center justify-between sticky top-0 z-10">
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingMore && (
            <div className="text-center py-4">
              <Loader className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
            </div>
          )}
          {hasMore && <div ref={observerRef} className="h-4" />}
          <div className="flex flex-col-reverse">
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                currentUser={user}
                onReact={handleReaction}
              />
            ))}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <ChatInput
          onSend={handleSendMessage}
          onFileSelect={handleFileSelect}
          onImageSelect={handleFileSelect}
        />
      </div>

      {/* Online Users Sidebar */}
      <OnlineUsers
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onUserChat={() => {}}
        className="lg:h-[calc(100vh-4rem)] lg:top-16"
      />
    </div>
  );
};

export default GroupChat;