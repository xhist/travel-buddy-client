// src/hooks/useChatRoom.js
import { useState, useEffect, useCallback } from 'react';
import { useStompClient } from './useStompClient';
import { useAuth } from './useAuth';

export const useChatRoom = (roomId) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const { client, connected } = useStompClient();
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    const cleanup = () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      setSubscriptions([]);
    };

    if (!client || !connected || !roomId) {
      cleanup();
      return;
    }

    // Subscribe to room presence
    const presenceSub = client.subscribe(
      `/topic/room/${roomId}/presence`,
      (message) => {
        const data = JSON.parse(message.body);
        setOnlineUsers(prev => {
          if (data.online) {
            return [...new Set([...prev, data.username])];
          } else {
            return prev.filter(username => username !== data.username);
          }
        });
      }
    );

    // Subscribe to typing status
    const typingSub = client.subscribe(
      `/topic/room/${roomId}/typing`,
      (message) => {
        const data = JSON.parse(message.body);
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.typing) {
            newSet.add(data.username);
          } else {
            newSet.delete(data.username);
          }
          return newSet;
        });
      }
    );

    // Get initial online users
    const usersSub = client.subscribe(
      `/app/room/${roomId}/users`,
      (message) => {
        const statuses = JSON.parse(message.body);
        setOnlineUsers(statuses.map(status => status.username));
        setTypingUsers(new Set(
          statuses
            .filter(status => status.typing)
            .map(status => status.username)
        ));
      }
    );

    // Join the room
    client.publish({
      destination: `/app/room.${roomId}.join`,
      headers: { 'content-type': 'application/json' }
    });

    setSubscriptions([presenceSub, typingSub, usersSub]);

    // Cleanup on unmount or roomId change
    return () => {
      if (client && connected) {
        client.publish({
          destination: `/app/room.${roomId}.leave`,
          headers: { 'content-type': 'application/json' }
        });
      }
      cleanup();
    };
  }, [client, connected, roomId]);

  const setTyping = useCallback((typing) => {
    if (client && connected && roomId) {
      client.publish({
        destination: `/app/room.${roomId}.typing`,
        body: JSON.stringify(typing),
        headers: { 'content-type': 'application/json' }
      });
    }
  }, [client, connected, roomId]);

  // Debounced version of setTyping
  const debouncedSetTyping = useCallback(
    debounce((typing) => setTyping(typing), 300),
    [setTyping]
  );

  return {
    onlineUsers,
    typingUsers,
    setTyping: debouncedSetTyping
  };
};

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}