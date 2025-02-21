import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MessageCircle, 
  UserPlus, 
  Clock,
  Check
} from 'lucide-react';
import API from '../../api/api';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const OnlineUsers = ({ users, isOpen, onClose, className = "" }) => {
  const { handleStartChat } = useChatContext();
  const { user: currentUser } = useAuth();
  const [friendStatuses, setFriendStatuses] = useState({});

  useEffect(() => {
    // Load friend statuses for each online user
    const loadFriendStatuses = async () => {
      const statuses = {};
      for (const user of users) {
        if (user.id !== currentUser?.id) {
          try {
            const response = await API.get(`/friends/status/${user.username}`);
            statuses[user.id] = response.data;
          } catch (err) {
            console.error('Error loading friend status:', err);
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
      toast.success('Friend request sent');
    } catch (err) {
      console.error('Error sending friend request:', err);
      toast.error('Failed to send friend request');
    }
  };

  const handleStartPrivateChat = (user) => {
    handleStartChat(user);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className={`fixed lg:relative inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-lg z-40 lg:shadow-none ${className}`}
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Online Users</h3>
                <button
                  onClick={onClose}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {users.map(user => {
                  if (user.id === currentUser?.id) return null;
                  
                  const friendStatus = friendStatuses[user.id] || {};
                  const isFriend = friendStatus.status;
                  const hasPendingRequest = friendStatus.hasPendingRequest;

                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <div className="relative">
                        <img
                          src={user.profilePicture || "/default-avatar.png"}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {user.username}
                        </p>
                        <p className="text-sm text-green-500">Online</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartPrivateChat(user)}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                          title="Send message"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        {!isFriend && !hasPendingRequest && (
                          <button
                            onClick={() => handleSendFriendRequest(user.id)}
                            className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                            title="Add friend"
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                        )}
                        {hasPendingRequest && (
                          <div 
                            className="p-2 text-yellow-500" 
                            title="Friend request pending"
                          >
                            <Clock className="w-5 h-5" />
                          </div>
                        )}
                        {isFriend && (
                          <div 
                            className="p-2 text-green-500" 
                            title="Friend"
                          >
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No users are currently online
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnlineUsers;