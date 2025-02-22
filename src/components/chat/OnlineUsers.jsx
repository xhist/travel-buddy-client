import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  UserPlus, 
  X, 
  Clock,
  CheckCircle,
  Search 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStompClient } from '../../hooks/useStompClient';
import API from '../../api/api';
import toast from 'react-hot-toast';

const OnlineUsers = ({ isOpen, onClose, onUserChat, className = "" }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendStatuses, setFriendStatuses] = useState({});
  const { user: currentUser } = useAuth();
  const { client, connected } = useStompClient();

  useEffect(() => {
    if (!client || !connected) return;

    const subscription = client.subscribe('/topic/presence', (message) => {
      const presenceData = JSON.parse(message.body);
      if (Array.isArray(presenceData)) {
        const otherUsers = presenceData.filter(u => u.id !== currentUser?.id);
        setUsers(otherUsers);
      }
    });

    client.publish({
      destination: '/app/presence.getOnlineUsers'
    });

    return () => subscription.unsubscribe();
  }, [client, connected, currentUser?.id]);

  useEffect(() => {
    setFilteredUsers(
      users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [users, searchQuery]);

  useEffect(() => {
    const loadFriendStatuses = async () => {
      const statuses = {};
      for (const user of users) {
        try {
          const response = await API.get(`/friends/status/${user.username}`);
          statuses[user.id] = response.data;
        } catch (err) {
          console.error(`Error loading friend status for ${user.username}:`, err);
        }
      }
      setFriendStatuses(statuses);
    };

    if (users.length > 0) {
      loadFriendStatuses();
    }
  }, [users]);

  const handleSendFriendRequest = async (userId) => {
    try {
      await API.post(`/friends/${currentUser.id}/request/${userId}`);
      setFriendStatuses(prev => ({
        ...prev,
        [userId]: { ...prev[userId], hasPendingRequest: true }
      }));
      toast.success('Friend request sent!', {
        icon: '👋',
        duration: 2000
      });
    } catch (err) {
      console.error('Error sending friend request:', err);
      toast.error('Failed to send friend request');
    }
  };

  const UserCard = ({ user }) => {
    const friendStatus = friendStatuses[user.id] || {};
    const [isHovered, setIsHovered] = useState(false);

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
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.1 }}
          >
            <img
              src={user.profilePicture || "/default-avatar.png"}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-blue-500"
            />
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"
            />
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.p 
              className="font-semibold text-gray-900 dark:text-gray-100 truncate"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
            >
              {user.username}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              Online now
            </motion.div>
          </div>

          <AnimatePresence>
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
                  onClick={() => onUserChat(user)}
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
                    <CheckCircle className="w-5 h-5" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50"
            style={{ zIndex: 1001 }}
            onClick={onClose}
          />

          {/* Sidebar Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, zIndex: 999 }}
            className={`fixed lg:relative inset-y-0 right-0 w-80 bg-gray-50 dark:bg-gray-800 shadow-lg 
              flex flex-col ${className}`}
            style={{ zIndex: 999, top: window.innerWidth >= 1024 ? undefined : 0 }}
          >
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="top-0 bg-gray-50 dark:bg-gray-800 p-4 border-b dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  Online Users
                </h3>
                <button
                  onClick={onClose}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 
                    dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                    transition-all"
                />
              </div>
            </motion.div>

            {/* User List */}
            <motion.div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <UserCard key={user.id} user={user} />
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
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnlineUsers;