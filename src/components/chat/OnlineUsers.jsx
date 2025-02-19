import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import { useChatContext } from '../contexts/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/api';
import { 
  MessageCircle, 
  User, 
  Users, 
  Circle,
  UserPlus,
  Mail,
  Link as LinkIcon,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserCard = ({ user, currentUser, onChat, onInvite, onAddFriend }) => {
  const [showActions, setShowActions] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);

  useEffect(() => {
    const checkFriendStatus = async () => {
      try {
        const response = await API.get(`/friends/status/${user.username}`);
        setIsFriend(response.data.status);
        setPendingRequest(response.data.hasPendingRequest);
      } catch (err) {
        console.error('Error checking friend status:', err);
      }
    };

    if (currentUser && user.username !== currentUser.username) {
      checkFriendStatus();
    }
  }, [user.id, currentUser]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={user.profilePicture || "/default-avatar.png"}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <Link 
            to={`/profile/${user.username}`}
            className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {user.username}
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.status || 'Active now'}
          </p>
        </div>

        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-1"
            >
              <button
                onClick={() => onChat(user)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                title="Send message"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              {!isFriend && !pendingRequest && user.id !== currentUser?.id && (
                <button
                  onClick={() => onAddFriend(user.id)}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                  title="Add friend"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              )}
              {pendingRequest && (
                <span className="text-sm text-yellow-500">
                  Request Pending
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const OnlineUsers = ({ tripId }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { client, connected } = useStompClient('http://localhost:8080/ws');
  const { user: currentUser } = useAuth();
  const { handleStartChat } = useChatContext();

  useEffect(() => {
    if (!client || !connected) return;

    const presenceSubscription = client.subscribe('/topic/presence', (message) => {
      try {
        const presenceUpdate = JSON.parse(message.body);
        setOnlineUsers(current => {
          if (Array.isArray(presenceUpdate)) {
            return presenceUpdate;
          } else {
            const updatedUsers = [...current];
            const index = updatedUsers.findIndex(u => u.username === presenceUpdate.username);
            
            if (presenceUpdate.status === 'ONLINE') {
              if (index === -1) {
                updatedUsers.push(presenceUpdate);
              }
            } else {
              if (index !== -1) {
                updatedUsers.splice(index, 1);
              }
            }
            return updatedUsers;
          }
        });
      } catch (error) {
        console.error('Error processing presence update:', error);
      }
    });

    client.publish({
      destination: '/app/presence.getOnlineUsers'
    });

    return () => presenceSubscription.unsubscribe();
  }, [client, connected]);

  const startChat = (user) => {
    handleStartChat(user);
  };

  const sendFriendRequest = async (userId) => {
    try {
      await API.post(`/friends/request/${userId}`);
      toast.success('Friend request sent');
    } catch (err) {
      console.error('Error sending friend request:', err);
      toast.error('Failed to send friend request');
    }
  };

  const filteredUsers = onlineUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Online Users
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {filteredUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? 'No users match your search'
                  : 'No users are currently online'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  onChat={startChat}
                  onAddFriend={sendFriendRequest}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnlineUsers;