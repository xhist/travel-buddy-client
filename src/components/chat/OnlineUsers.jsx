import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  UserPlus, 
  Clock,
  Search,
  ArrowLeft,
  Users,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStompClient } from '../../hooks/useStompClient';
import { useChatContext } from '../contexts/ChatContext';
import API from '../../api/api';
import toast from 'react-hot-toast';

const OnlineUsers = ({ isOpen, onClose, tripId, className = "" }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendStatuses, setFriendStatuses] = useState({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const { user: currentUser } = useAuth();
  const { client, connected } = useStompClient();
  const { handleStartChat } = useChatContext();

  // Subscribe to room-specific presence (if tripId provided) or global presence
  useEffect(() => {
    if (!client || !connected) {
      console.log("STOMP client not connected");
      return;
    }

    console.log(`Subscribing to room presence for trip ${tripId}`);
    setIsLoadingUsers(true);

    // Clear users to avoid stale data
    setUsers([]);

    // Subscribe to room-specific presence updates for this trip
    if (tripId) {
      // Subscribe to user statuses for this room
      const roomSubscription = client.subscribe(
        `/topic/room/${tripId}/users`,
        (message) => {
          try {
            console.log("Received room users update:", message.body);
            const statusData = JSON.parse(message.body);
            
            if (Array.isArray(statusData)) {
              // Convert UserPresenceStatus objects to user objects
              const roomUsers = statusData
                .filter(status => status.username !== currentUser?.username) // Filter out current user
                .map(status => ({
                  id: status.userId || status.username, // Fallback to username if id is missing
                  username: status.username,
                  profilePicture: status.profilePicture,
                  lastSeen: status.lastSeen,
                  typing: status.typing
                }));
              
              setUsers(roomUsers);
              setIsLoadingUsers(false);
            }
          } catch (error) {
            console.error('Error parsing room users data:', error);
            setIsLoadingUsers(false);
          }
        }
      );
      
      // Join the room manually to trigger the server to send the current list of online users
      if (tripId) {
        setTimeout(() => {
          client.publish({ 
            destination: `/app/room.${tripId}.join`,
            body: JSON.stringify({})
          });
        }, 500);
      }
      
      return () => {
        roomSubscription.unsubscribe();
        // Leave the room when component unmounts
        if (client && connected) {
          client.publish({
            destination: `/app/room.${tripId}.leave`,
            body: JSON.stringify({})
          });
        }
      };
    } else {
      // For global presence (not in a specific trip chat)
      const globalSubscription = client.subscribe(
        '/topic/presence',
        (message) => {
          try {
            const presenceData = JSON.parse(message.body);
            
            if (Array.isArray(presenceData)) {
              // Full list of online users
              const otherUsers = presenceData.filter(u => 
                u.username !== currentUser?.username && 
                u.id !== currentUser?.id
              );
              setUsers(otherUsers);
              setIsLoadingUsers(false);
            } else if (presenceData.username && presenceData.status) {
              // Individual user status update
              setUsers(prev => {
                if (presenceData.status === 'ONLINE') {
                  if (!prev.some(u => u.username === presenceData.username || u.id === presenceData.id)) {
                    return [...prev, presenceData];
                  }
                  return prev;
                } else {
                  return prev.filter(u => u.username !== presenceData.username && u.id !== presenceData.id);
                }
              });
              setIsLoadingUsers(false);
            }
          } catch (error) {
            console.error('Error parsing presence data:', error);
            setIsLoadingUsers(false);
          }
        }
      );
      
      // Request current online users - different endpoint based on context
      client.publish({ 
        destination: '/app/presence.getOnlineUsers',
        body: JSON.stringify({})
      });
      
      return () => {
        globalSubscription.unsubscribe();
      };
    }
  }, [client, connected, currentUser?.id, currentUser?.username, tripId]);

  // Filter users based on search query
  useEffect(() => {
    setFilteredUsers(
      users.filter(u => 
        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
  }, [users, searchQuery]);

  // Load friend statuses for each user
  useEffect(() => {
    const loadFriendStatuses = async () => {
      const statuses = {};
      for (const user of users) {
        if (user.username && user.username !== currentUser?.username) {
          try {
            const response = await API.get(`/friends/status/${user.username}`);
            statuses[user.id || user.username] = response.data;
          } catch (err) {
            console.error(`Error loading friend status for ${user.username}:`, err);
          }
        }
      }
      setFriendStatuses(statuses);
    };

    if (users.length > 0 && currentUser) {
      loadFriendStatuses();
    }
  }, [users, currentUser]);

  const handleSendFriendRequest = async (userId) => {
    try {
      await API.post(`/friends/${currentUser.id}/request/${userId}`);
      setFriendStatuses(prev => ({
        ...prev,
        [userId]: { ...prev[userId], hasPendingRequest: true }
      }));
      toast.success('Friend request sent!');
    } catch (err) {
      console.error('Error sending friend request:', err);
      toast.error('Failed to send friend request');
    }
  };

  const handleProfileClick = (username) => {
    if (username) {
      window.location.href = `/profile/${username}`;
    }
  };

  const handleStartChatWithUser = (user) => {
    if (handleStartChat) {
      handleStartChat(user);
      if (onClose) onClose(); // Close the sidebar on mobile after starting a chat
    }
  };

  const UserCard = ({ user }) => {
    const friendStatus = friendStatuses[user.id || user.username] || {};
    const [isHovered, setIsHovered] = useState(false);
    const username = user.username || user.name;

    if (!username) return null;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-4">
          <motion.div className="relative">
            <img
              src={user.profilePicture || "/default-avatar.png"}
              alt={username}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-blue-500 cursor-pointer"
              onClick={() => handleProfileClick(username)}
            />
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.p 
              className="font-semibold text-gray-900 dark:text-gray-100 truncate cursor-pointer"
              onClick={() => handleProfileClick(username)}
            >
              {username}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              {user.typing ? 'Typing...' : 'Online now'}
            </motion.div>
          </div>

          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStartChatWithUser(user)}
                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </motion.button>

              {!friendStatus.status && !friendStatus.hasPendingRequest && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSendFriendRequest(user.id)}
                  className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                </motion.button>
              )}

              {friendStatus.hasPendingRequest && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="p-2 text-yellow-500"
                  title="Friend request pending"
                >
                  <Clock className="w-5 h-5" />
                </motion.div>
              )}

              {friendStatus.status && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="p-2 text-green-500"
                  title="Friend"
                >
                  <UserCheck className="w-5 h-5" />
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-[1000]"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed lg:hidden top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl flex flex-col z-[1001] ${className}`}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 z-10">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {tripId ? 'Room Members' : 'Online Users'}
                  </h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingUsers ? (
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <UserCard key={user.id || user.username} user={user} />
                      ))
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="text-center py-8"
                      >
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchQuery ? 'No users match your search' : 'No users online'}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col bg-white dark:bg-gray-800 ${className}`}>
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {tripId ? 'Room Members' : 'Online Users'}
          </h3>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingUsers ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <UserCard key={user.id || user.username} user={user} />
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="text-center py-8"
                >
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No users match your search' : 'No users online'}
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OnlineUsers;