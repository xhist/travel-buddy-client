import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
import { useChatContext } from '../contexts/ChatContext';
import { 
  Users, 
  UserPlus, 
  X, 
  Check, 
  MessageCircle, 
  Search,
  Clock,
  ChevronRight,
  UserMinus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const FriendCard = ({ friend, onRemove, onChat }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between"
    >
      <Link to={`/profile/${friend.username}`} className="flex items-center gap-4 flex-1">
        <img
          src={friend.profilePicture || '/default-avatar.png'}
          alt={friend.username}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            {friend.username}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {friend.bio?.substring(0, 60) || 'No bio available'}
            {friend.bio?.length > 60 ? '...' : ''}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChat(friend)}
          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
          title="Chat"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        <button
          onClick={() => onRemove(friend)}
          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
          title="Remove Friend"
        >
          <UserMinus className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

const FriendRequest = ({ request, onAccept, onDecline }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
    >
      <div className="flex items-center justify-between">
        <Link to={`/profile/${request.sender.username}`} className="flex items-center gap-4">
          <img
            src={request.sender.profilePicture || '/default-avatar.png'}
            alt={request.sender.username}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              {request.sender.username}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sent you a friend request
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAccept(request)}
            className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDecline(request)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Friends = () => {
  const { user } = useAuth();
  const { handleStartChat } = useChatContext();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'

  useEffect(() => {
    fetchFriends();
  }, [user?.id]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const [friendsRes, requestsRes] = await Promise.all([
        API.get(`/friends/${user.id}`),
        API.get(`/friends/${user.id}/pending`)
      ]);
      setFriends(friendsRes.data);
      setPendingRequests(requestsRes.data);
    } catch (err) {
      console.error('Error fetching friends data:', err);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (request) => {
    try {
      const response = await API.post(`/friends/${user.id}/accept/${request.id}`);
      setPendingRequests(response.data);
      fetchFriends(); // Refresh friends list
      toast.success(`Accepted ${request.sender.username}'s friend request`);
    } catch (err) {
      console.error('Error accepting friend request:', err);
      toast.error('Failed to accept request');
    }
  };

  const declineRequest = async (request) => {
    try {
      const response = await API.post(`/friends/${user.id}/decline/${request.id}`);
      setPendingRequests(response.data);
      toast.success(`Declined ${request.sender.username}'s friend request`);
    } catch (err) {
      console.error('Error declining friend request:', err);
      toast.error('Failed to decline request');
    }
  };

  const removeFriend = async (friend) => {
    try {
      const response = await API.delete(`/friends/user/${user.id}/friends/${friend.id}`);
      setFriends(response.data);
      toast.success(`Removed ${friend.username} from friends`);
    } catch (err) {
      console.error('Error removing friend:', err);
      toast.error('Failed to remove friend');
    }
  };

  const startChat = (friend) => {
    // Use the ChatContext to start a new chat
    if (handleStartChat) {
      handleStartChat(friend);
      toast.success(`Starting chat with ${friend.username}`);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            Friends
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your connections
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => setActiveTab('friends')}
              className={`w-full px-4 py-3 flex items-center justify-between ${
                activeTab === 'friends'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span>Friends</span>
              </div>
              <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-sm">
                {friends.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`w-full px-4 py-3 flex items-center justify-between ${
                activeTab === 'requests'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5" />
                <span>Requests</span>
              </div>
              {pendingRequests.length > 0 && (
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'friends' ? (
              <motion.div
                key="friends"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {filteredFriends.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      No friends found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery
                        ? 'No friends match your search'
                        : 'Start adding friends to see them here'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredFriends.map((friend) => (
                      <FriendCard
                        key={friend.id}
                        friend={friend}
                        onRemove={removeFriend}
                        onChat={startChat}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="requests"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {pendingRequests.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      No pending requests
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You have no pending friend requests
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingRequests.map((request) => (
                      <FriendRequest
                        key={request.id}
                        request={request}
                        onAccept={acceptRequest}
                        onDecline={declineRequest}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Friends;