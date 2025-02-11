import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { useAuth } from '../../hooks/useAuth';

const PersonalItinerary = ({ tripId }) => {
  const [itinerary, setItinerary] = useState([]);
  const [newActivity, setNewActivity] = useState({ 
    activityName: ''
  });
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItinerary = async () => {
      if (!tripId || !user?.id) return;
      
      try {
        setLoading(true);
        const res = await API.get(`/itineraries/${tripId}/${user.id}`);
        setItinerary(res.data);
      } catch (err) {
        console.error('Error fetching itinerary:', err);
        setError('Failed to load itinerary');
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [tripId, user?.id]);

  const addActivity = async () => {
    if (!tripId || !user?.id) return;
    
    if (newActivity.activityName.trim()) {
      try {
        const res = await API.post(`/itineraries/${tripId}/${user.id}`, newActivity);
        setItinerary([...itinerary, res.data]);
        setNewActivity({ 
          activityName: ''
        });
      } catch (err) {
        console.error('Error adding activity:', err);
        setError('Failed to add activity');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Personal Itinerary</h3>
      <div className="mb-4 space-y-3">
        <input 
          type="text" 
          placeholder="Activity Name" 
          value={newActivity.activityName} 
          onChange={(e) => setNewActivity({ ...newActivity, activityName: e.target.value })} 
          className="px-4 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={addActivity} 
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Add Activity
        </button>
      </div>

      {itinerary.length === 0 ? (
        <p className="text-gray-500 text-center">No activities added yet.</p>
      ) : (
        <ul className="space-y-4">
          {itinerary.map((activity) => (
            <li key={activity.id} className="border rounded-lg p-4 shadow-sm">
              <div className="font-bold text-lg">{activity.activityName}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PersonalItinerary;