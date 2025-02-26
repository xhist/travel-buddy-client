import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
import { PlusCircle, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const Itinerary = ({ tripId: propTripId }) => {
  const params = useParams();
  const resolvedTripId = propTripId || params.id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityName, setActivityName] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (resolvedTripId) {
      fetchItinerary();
    } else {
      console.error("No tripId provided to Itinerary component");
      setLoading(false);
    }
  }, [resolvedTripId]);

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/itineraries/${resolvedTripId}`);
      setItems(response.data || []);
    } catch (err) {
      console.error('Error fetching itinerary:', err);
      toast.error('Failed to load itinerary');
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

    if (!resolvedTripId) {
      toast.error('Trip ID is missing');
      return;
    }

    try {
      const response = await API.post(`/itineraries/${resolvedTripId}`, {
        activityName: activityName.trim(),
        tripId: resolvedTripId
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

  const exportPdf = async () => {
    if (!resolvedTripId) {
      toast.error('Trip ID is missing');
      return;
    }

    try {
      const response = await API.get(`/itineraries/export/${resolvedTripId}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `itinerary-${resolvedTripId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Itinerary exported successfully');
    } catch (err) {
      console.error('Error exporting itinerary:', err);
      toast.error('Failed to export itinerary');
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
      <div className="flex justify-between items-center">
        <form onSubmit={addItem} className="flex-1 mr-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="Enter activity name..."
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
              disabled={!resolvedTripId}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Add Activity</span>
            </button>
          </div>
        </form>
        
        <button
          onClick={exportPdf}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
          disabled={!resolvedTripId}
        >
          <Download className="w-5 h-5" />
          <span className="hidden sm:inline">Export PDF</span>
        </button>
      </div>

      {!resolvedTripId ? (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg text-center">
          Trip ID is missing. Please ensure you're viewing this page correctly.
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-center p-4">No activities planned yet.</p>
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

export default Itinerary;