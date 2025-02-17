import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
import { PlusCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PersonalItinerary = ({ tripId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityName, setActivityName] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchItinerary();
  }, [tripId, user?.id]);

  const fetchItinerary = async () => {
    if (!tripId || !user?.id) return;

    try {
      setLoading(true);
      const response = await API.get(`/itineraries/${tripId}/${user.id}`);
      setItems(response.data || []);
    } catch (err) {
      console.error('Error fetching personal itinerary:', err);
      toast.error('Failed to load personal itinerary');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!activityName.trim()) {
      toast.error('Please enter an activity name');
      return;
    }

    try {
      const response = await API.post(`/itineraries/${tripId}/${user.id}`, {
        activityName: activityName.trim(),
        tripId,
        userId: user.id
      });

      if (response.data) {
        setItems(response.data);
        setActivityName('');
        toast.success('Activity added successfully');
      }
    } catch (err) {
      console.error('Error adding activity:', err);
      toast.error('Failed to add activity');
    }
  };

  const deleteItem = async (itemId) => {
    try {
      const response = await API.delete(`/itineraries/${itemId}`);
      if (response.status === 200) {
        setItems(items.filter(item => item.id !== itemId));
        toast.success('Activity deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting activity:', err);
      toast.error('Failed to delete activity');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addItem} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="Enter personal activity..."
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Add Activity
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="text-gray-500 text-center p-4">No personal activities planned yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-between items-center"
            >
              <span className="text-gray-800 dark:text-gray-200">
                {item.activityName}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="p-2 text-red-500 hover:text-red-700 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonalItinerary;