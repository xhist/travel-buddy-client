import { useState, useEffect, useCallback } from 'react';
import { useStompClient } from './useStompClient';
import { useAuth } from './useAuth';
import API from '../api/api';
import toast from 'react-hot-toast';

export const useChatMessages = (
  chatType, // 'group' or 'private'
  chatId, // tripId for group chat, userId for private chat
  pageSize = 20
) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState(null);
  const { client, connected } = useStompClient();
  const { user } = useAuth();

  // Fetch initial messages
  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        setLoading(true);
        const endpoint = chatType === 'group' 
          ? `/chat/messages/trip/${chatId}`
          : `/chat/messages/private/${chatId}`;
        
        const response = await API.get(endpoint, {
          params: { limit: pageSize }
        });
        
        if (response.data.length > 0) {
          setMessages(response.data);
          setOldestMessageId(response.data[response.data.length - 1].id);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchInitialMessages();
    }
  }, [chatId, chatType, pageSize]);

  // Subscribe to messages
  useEffect(() => {
    if (!client || !connected || !chatId) return;

    const topic = chatType === 'group' 
      ? `/topic/trip/${chatId}`
      : `/user/queue/private`;

    const subscription = client.subscribe(topic, (message) => {
      try {
        const receivedMessage = JSON.parse(message.body);
        // For private chat, only handle messages for this chat
        if (chatType === 'private' && 
            receivedMessage.sender !== user.username && 
            receivedMessage.recipient !== user.username) {
          return;
        }
        setMessages(prev => [receivedMessage, ...prev]);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    return () => subscription.unsubscribe();
  }, [client, connected, chatId, chatType, user]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !oldestMessageId) return;

    try {
      setLoading(true);
      const endpoint = chatType === 'group'
        ? `/chat/messages/trip/${chatId}`
        : `/chat/messages/private/${chatId}`;

      const response = await API.get(endpoint, {
        params: {
          before: oldestMessageId,
          limit: pageSize
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
      setLoading(false);
    }
  }, [chatId, chatType, hasMore, loading, oldestMessageId, pageSize]);

  const sendMessage = useCallback((content, type = 'TEXT', fileData = null) => {
    if (!client || !connected) {
      toast.error('Not connected to chat server');
      return;
    }

    try {
      const destination = chatType === 'group'
        ? `/app/chat.trip.${chatId}`
        : '/app/chat.private';

      const message = {
        content,
        type,
        timestamp: new Date().toISOString(),
        ...(chatType === 'private' && { recipient: chatId }),
        ...(fileData && { fileName: fileData.fileName, fileUrl: fileData.fileUrl })
      };

      client.publish({
        destination,
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }, [client, connected, chatId, chatType]);

  const addReaction = useCallback(async (messageId, reactionType) => {
    try {
      const response = await API.post(`/api/chat/messages/${messageId}/reactions`, {
        reactionType
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? response.data : msg
      ));
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  }, []);

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    sendMessage,
    addReaction
  };
};