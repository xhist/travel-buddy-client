import React, { useState } from 'react';
import API from '../../api/api';

const CalendarSync = ({ tripId }) => {
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState('');

  const syncCalendar = async () => {
    try {
      await API.post(`/calendar/sync/${tripId}`);
      setSynced(true);
      setTimeout(() => setSynced(false), 3000);
    } catch (err) {
      console.error('Calendar sync error:', err);
      setError('Calendar sync failed.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="p-4 border rounded shadow mb-4">
      <h3 className="text-xl font-bold mb-2">Calendar Integration</h3>
      <button onClick={syncCalendar} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
        Sync with Google Calendar
      </button>
      {synced && <p className="mt-2 text-green-600">Calendar synced successfully!</p>}
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
};

export default CalendarSync;
