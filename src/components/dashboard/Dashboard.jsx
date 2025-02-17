import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/api';
import TripCard from './TripCard';
import { PlusCircle, Search, MapPin, Loader } from 'lucide-react';

const Dashboard = () => {
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/trips');
        setTrips(data);
      } catch (err) {
        console.error('Error fetching trips:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const filteredTrips = trips?.filter(trip =>
    trip.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="pt-20 pb-8 px-4 md:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <MapPin className="w-8 h-8 text-blue-600" />
            Explore Trips
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Discover and join amazing adventures
          </p>
        </div>

        {/* Create Trip Button */}
        <Link
          to="/trips/create"
          className="group relative overflow-hidden rounded-lg bg-blue-600 px-4 py-2 text-white shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl active:scale-95"
        >
          <div className="relative flex items-center gap-2">
            <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90" />
            <span>Create Trip</span>
          </div>
          <div className="absolute inset-0 h-full w-full scale-0 rounded-lg transition-all duration-300 group-hover:scale-100 group-hover:bg-white/10"></div>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto mb-6 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search trips by title..."
            className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 transition dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredTrips?.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            No trips found. Create a new one to get started!
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;