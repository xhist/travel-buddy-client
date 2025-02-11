import React, { useState, useEffect } from 'react';
import API from '../../api/api';

const JoinRequests = ({ tripId, initialRequests }) => {
  const [requests, setRequests] = useState(initialRequests || []);

  useEffect(() => {
    setRequests(initialRequests || []);
  }, [initialRequests]);

  const handleApprove = async (userId) => {
    try {
      await API.post(`/api/trips/approve/${tripId}/${userId}`);
      setRequests(requests.filter(req => req.id !== userId));
    } catch (err) {
      console.error('Error approving join request:', err);
    }
  };

  const handleDecline = async (userId) => {
    try {
      await API.post(`/api/trips/decline/${tripId}/${userId}`);
      setRequests(requests.filter(req => req.id !== userId));
    } catch (err) {
      console.error('Error declining join request:', err);
    }
  };

  if (!requests || requests.length === 0) {
    return <p className="text-gray-600 dark:text-gray-300">No pending join requests.</p>;
  }

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Pending Join Requests</h3>
      <div className="grid grid-cols-1 gap-4">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md">
            <img
              src={req.profilePicture || '/default-avatar.png'}
              alt={req.username}
              className="w-12 h-12 rounded-full mr-4"
            />
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{req.username}</p>
              {req.bio && <p className="text-sm text-gray-600 dark:text-gray-300">{req.bio}</p>}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleApprove(req.id)}
                className="text-green-500 hover:text-green-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => handleDecline(req.id)}
                className="text-red-500 hover:text-red-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinRequests;
