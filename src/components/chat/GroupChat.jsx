import React, { useState, useEffect, useRef } from 'react';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import API from '../../api/api';
import { Message, ChatInput, MessageType } from './ChatComponents';
import OnlineUsers from './OnlineUsers';
import { Menu } from 'lucide-react';
import toast from 'react-hot-toast';

// Internal helper hooks and components...
const MessageList = ({ messages, currentUser, onReact, loadMore, hasMore }) => {
  const observerRef = useRef(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      )}
      {hasMore && <div ref={observerRef} className="h-4" />}
      <div className="flex flex-col-reverse">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            currentUser={currentUser}
            onReact={onReact}
          />
        ))}
      </div>
    </div>
  );
};

const GroupChat = ({ tripId }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { client, connected } = useStompClient();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState(null);

  useEffect(() => {
    if (!client || !connected) return;

    // Subscribe to trip messages
    const messageSubscription = client.subscribe(
      `/topic/trip/${tripId}`,
      (message) => {
        const receivedMessage = JSON.parse(message.body);
        setMessages(prev => [receivedMessage, ...prev]);
      }
    );

    // Subscribe to presence updates
    const presenceSubscription = client.subscribe(
      '/topic/presence',
      (message) => {
        const presenceUpdate = JSON.parse(message.body);
        if (Array.isArray(presenceUpdate)) {
          setOnlineUsers(presenceUpdate);
        } else {
          setOnlineUsers((prev) => {
            if (presenceUpdate.status === 'ONLINE') {
              if (!prev.find(u => u.username === presenceUpdate.username)) {
                return [...prev, presenceUpdate];
              }
            } else {
              return prev.filter(u => u.username !== presenceUpdate.username);
            }
            return prev;
          });
        }
      }
    );

    // Get initial online users
    client.publish({
      destination: '/app/presence.getOnlineUsers'
    });

    // Load initial messages
    loadMessages();

    return () => {
      messageSubscription.unsubscribe();
      presenceSubscription.unsubscribe();
    };
  }, [client, connected, tripId]);

  const loadMessages = async (beforeId) => {
    try {
      const response = await API.get(`/chat/messages/trip/${tripId}`, {
        params: { before: beforeId, limit: 20 }
      });
      
      if (response.data.length === 0) {
        setHasMore(false);
      } else {
        setMessages(prev => [...prev, ...response.data]);
        setOldestMessageId(response.data[response.data.length - 1].id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
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
          type: MessageType.TEXT,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileSelect = async (fileData) => {
    if (!client || !connected) {
      toast.error('Not connected to chat server');
      return;
    }

    try {
      client.publish({
        destination: `/app/chat.trip.${tripId}`,
        body: JSON.stringify({
          content: fileData.fileUrl,
          fileName: fileData.fileName,
          type: fileData.contentType.startsWith('image/')
            ? MessageType.IMAGE
            : MessageType.FILE,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error sending file:', error);
      toast.error('Failed to send file');
    }
  };

  const handleReaction = async (messageId, reactionType) => {
    try {
      const response = await API.post(`/api/chat/messages/${messageId}/reactions`, {
        reactionType
      });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, ...response.data } : msg
        )
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Group Chat</h2>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <MessageList
            messages={messages}
            currentUser={user}
            onReact={handleReaction}
            loadMore={() => loadMessages(oldestMessageId)}
            hasMore={hasMore}
          />
          <ChatInput
            onSend={handleSendMessage}
            onFileSelect={handleFileSelect}
          />
        </div>
      </div>

      {/* Online Users Sidebar - Desktop & Mobile */}
      <OnlineUsers
        isOpen={showSidebar || window.innerWidth >= 1024}
        onClose={() => setShowSidebar(false)}
        users={onlineUsers}
        className="lg:h-[calc(100vh-4rem)] lg:pt-16"
      />
    </div>
  );
};

export default GroupChat;