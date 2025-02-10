import React, { useState, useEffect } from 'react';
import API from '../../api/api';

const PersonalItinerary = () => {
  const [itinerary, setItinerary] = useState([]);
  const [newActivity, setNewActivity] = useState({ activityName: '', date: '', time: '', location: '', notes: '' });

  useEffect(() => {
    API.get('/itinerary/personal')
      .then((res) => setItinerary(res.data))
      .catch((err) => console.error(err));
  }, []);

  const addActivity = async () => {
    if (newActivity.activityName.trim()) {
      const res = await API.post('/itinerary/personal', newActivity);
      setItinerary([...itinerary, res.data]);
      setNewActivity({ activityName: '', date: '', time: '', location: '', notes: '' });
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Personal Itinerary</h3>
      <div className="mb-4">
        <input type="text" placeholder="Activity Name" value={newActivity.activityName} onChange={(e) => setNewActivity({ ...newActivity, activityName: e.target.value })} className="px-4 py-2 border rounded w-full mb-2" />
        <input type="date" value={newActivity.date} onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })} className="px-4 py-2 border rounded w-full mb-2" />
        <input type="time" value={newActivity.time} onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })} className="px-4 py-2 border rounded w-full mb-2" />
        <input type="text" placeholder="Location" value={newActivity.location} onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })} className="px-4 py-2 border rounded w-full mb-2" />
        <textarea placeholder="Notes" value={newActivity.notes} onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })} className="px-4 py-2 border rounded w-full mb-2"></textarea>
        <button onClick={addActivity} className="bg-blue-600 text-white px-4 py-2 rounded">Add Activity</button>
      </div>
      <ul>
        {itinerary.map((activity) => (
          <li key={activity.id} className="border-b py-2">
            <strong>{activity.activityName}</strong> on {new Date(activity.date).toLocaleDateString()} at {activity.time} in {activity.location}
            <p>{activity.notes}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PersonalItinerary;
