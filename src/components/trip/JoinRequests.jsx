import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const JoinRequests = ({ tripId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [tripId]); // Add tripId as dependency

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/trips/${tripId}/pendingRequests`);
      setRequests(response.data || []);
    } catch (err) {
      console.error('Error fetching join requests:', err);
      setError('Failed to load join requests');
      toast.error('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await API.post(`/trips/${tripId}/approve/${userId}`); // Fixed API endpoint
      toast.success('Request approved successfully');
      // Refresh the requests list
      await fetchRequests();
    } catch (err) {
      console.error('Error approving join request:', err);
      toast.error('Failed to approve request');
    }
  };

  const handleDecline = async (userId) => {
    try {
      await API.post(`/trips/${tripId}/decline/${userId}`); // Fixed API endpoint
      toast.success('Request declined');
      // Refresh the requests list
      await fetchRequests();
    } catch (err) {
      console.error('Error declining join request:', err);
      toast.error('Failed to decline request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 text-center">
        {error}
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-600 dark:text-gray-300">No pending join requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        Pending Join Requests ({requests.length})
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {requests.map((req) => (
          <div 
            key={req.id} 
            className="flex items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <img
              src={req.profilePicture || '/default-avatar.png'}
              alt={req.username}
              className="w-12 h-12 rounded-full mr-4 object-cover"
            />
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {req.username}
              </p>
              {req.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {req.bio}
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleApprove(req.id)}
                className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                title="Approve Request"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDecline(req.id)}
                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="Decline Request"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinRequests;