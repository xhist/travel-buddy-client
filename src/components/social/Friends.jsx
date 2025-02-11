import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Friends = () => {
  const {user} = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friends = await API.get(`/friends/${user.id}`);
        setFriends(friends.data);
        const pendingRequests = await API.get(`/friends/${user.id}/pending`);
        setPendingRequests(pendingRequests.data);
      } catch (err) {
        console.error('Error fetching friends:', err);
      }
    };
    fetchFriends();
  }, []);

  const acceptRequest = async (userId, requestId) => {
    try {
      const pendingRequests = await API.post(`/friends/${userId}/accept/${requestId}`);
      setPendingRequests(pendingRequests.data);
      const friends = await API.get(`/friends/${userId}`);
      setFriends(friends.data);
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  const declineRequest = async (userId, requestId) => {
    try {
      const pendingRequests = await API.post(`/friends/${userId}/decline/${requestId}`);
      setPendingRequests(pendingRequests.data);
    } catch (err) {
      console.error('Error declining friend request:', err);
    }
  };

  return (
    <div className="pt-20 pb-8 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">My Friends</h2>
      <div className="max-w-3xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {friends.map((friend) => (
            <div key={friend.id} className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 flex items-center space-x-4">
              <img
                src={friend.profilePicture || '/default-avatar.png'}
                alt={friend.username}
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{friend.username}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Status: {friend.status || 'Active'}</p>
              </div>
              <Link
                to={`/privatechat/${friend.id}`}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
              >
                Chat
              </Link>
            </div>
        ))}
      </div>
      {pendingRequests.length > 0 && (
        <div className="max-w-3xl mx-auto mt-8">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Pending Friend Requests</h3>
          <ul>
            {pendingRequests.map((req) => (
              <li key={req.id} className="border-b py-2 flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">{req.sender.username}</span>
                <div className="space-x-2">
                  <button onClick={() => acceptRequest(user.id, req.id)} className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition">
                    Accept
                  </button>
                  <button onClick={() => declineRequest(user.id, req.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition">
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Friends;
