import React, { useEffect, useState } from 'react';
import API from '../../api/api';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get('/friends');
        setFriends(res.data.friends);
        setRequests(res.data.pending);
      } catch (err) {
        console.error('Error fetching friends:', err);
      }
    })();
  }, []);

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-20 pb-8 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">My Friends</h2>
      <input
        type="text"
        placeholder="Search friends..."
        className="max-w-md mx-auto block w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-w-3xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFriends.map((friend) => (
          <div key={friend.id} className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 flex items-center space-x-4">
            <img src={friend.profilePicture || '/default-avatar.png'} alt={friend.username} className="w-16 h-16 rounded-full" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{friend.username}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Status: {friend.status || 'Active'}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Render pending friend requests if needed */}
      {requests.length > 0 && (
        <div className="max-w-3xl mx-auto mt-8">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Pending Requests</h3>
          <ul>
            {requests.map((req) => (
              <li key={req.id} className="border-b py-2 flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">{req.username}</span>
                <div className="space-x-2">
                  <button className="bg-green-500 text-white px-2 py-1 rounded">Accept</button>
                  <button className="bg-red-500 text-white px-2 py-1 rounded">Decline</button>
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
