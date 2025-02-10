import React, { useEffect, useState } from 'react';
import API from '../../api/api';

const AdminTrips = () => {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    API.get('/trips')
      .then((res) => setTrips(res.data))
      .catch((err) => console.error(err));
  }, []);

  const deleteTrip = async (tripId) => {
    try {
      await API.delete(`/trips/${tripId}`);
      setTrips(trips.filter(trip => trip.id !== tripId));
    } catch (err) {
      console.error('Error deleting trip:', err);
    }
  };

  return (
    <div className="pt-20 pb-8 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">Manage Trips</h1>
      <table className="min-w-full bg-white dark:bg-gray-700">
        <thead>
          <tr>
            <th className="py-2 px-4 border">ID</th>
            <th className="py-2 px-4 border">Title</th>
            <th className="py-2 px-4 border">Destination</th>
            <th className="py-2 px-4 border">Status</th>
            <th className="py-2 px-4 border">Organizer</th>
            <th className="py-2 px-4 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <tr key={trip.id} className="text-center">
              <td className="py-2 px-4 border">{trip.id}</td>
              <td className="py-2 px-4 border">{trip.title}</td>
              <td className="py-2 px-4 border">{trip.destination}</td>
              <td className="py-2 px-4 border">{trip.status}</td>
              <td className="py-2 px-4 border">{trip.organizer.username}</td>
              <td className="py-2 px-4 border">
                <button onClick={() => deleteTrip(trip.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTrips;
