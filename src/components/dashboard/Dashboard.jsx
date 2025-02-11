// src/components/dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/api';
import TripCard from './TripCard';

const Dashboard = () => {
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/trips');
        setTrips(data);
      } catch (err) {
        console.error('Error fetching trips:', err);
      }
    })();
  }, []);

  const filteredTrips = trips?.filter(trip =>
    trip.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="pt-20 pb-8 px-4 md:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Your Trips</h1>
        {/* Create Trip Button */}
        <Link
          to="/trips/create"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Create New Trip
        </Link>
      </div>
      <div className="max-w-3xl mx-auto mb-6">
        <input
          type="text"
          placeholder="Filter trips by title..."
          className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.map(trip => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
