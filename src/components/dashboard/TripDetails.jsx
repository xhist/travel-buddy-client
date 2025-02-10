import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/api';
import { Tab } from '@headlessui/react';
import { useTripAccess } from '../../hooks/useTripAccess';
import Itinerary from '../trip/Itinerary';
import PackingChecklist from '../trip/PackingChecklist';
import Expenses from '../trip/Expenses';
import Reviews from '../social/Reviews';
import Voting from '../voting/Voting';
import Weather from '../layout/Weather';
import PersonalItinerary from '../trip/PersonalItinerary';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Protected tabs – each receives tripId and other props
const protectedTabs = [
  { label: 'Group Itinerary', content: <Itinerary tripId={null} /> },
  { label: 'Personal Itinerary', content: <PersonalItinerary /> },
  { label: 'Packing Checklist', content: <PackingChecklist tripId={null} /> },
  { label: 'Expenses', content: <Expenses tripId={null} /> },
  { label: 'Reviews', content: <Reviews tripId={null} revieweeId={null} /> },
  { label: 'Voting', content: <Voting options={[
    { value: 'itinerary', label: 'Itinerary Vote', votes: 0 },
    { value: 'checklist', label: 'Checklist Vote', votes: 0 }
  ]} onVote={(v) => { console.log('Voted:', v); }} currentVote={null} /> },
];

const publicContent = <p className="text-gray-700 dark:text-gray-300">Public trip details. Join the trip to view full details.</p>;

const TripDetails = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const isMember = useTripAccess(trip);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get(`/trips/${id}`);
        setTrip(data);
        // Check if the current user is the organizer
        const currentUser = JSON.parse(localStorage.getItem('token')) && data.organizer; // Simplified check; use useAuth hook for full implementation
        setIsOrganizer(data.organizer.id === (data.currentUserId || 0));
      } catch (err) {
        console.error('Error fetching trip details:', err);
      }
    })();
  }, [id]);

  if (!trip) return <div className="pt-20 text-center"><p>Loading...</p></div>;

  // Extend tabs with required props
  const extendedTabs = protectedTabs.map((tab) => ({
    label: tab.label,
    content: React.cloneElement(tab.content, { tripId: trip.id, revieweeId: trip.organizer.id })
  }));

  return (
    <div className="pt-20 pb-8 px-4 md:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <img src={trip.image || '/default-trip.jpg'} alt={trip.title} className="w-full h-64 object-cover" />
        <div className="p-6">
          <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-gray-200">{trip.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{trip.destination}</p>
          <Weather destination={trip.destination} />
          {isOrganizer && (
            <div className="mb-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                Edit Trip
              </button>
            </div>
          )}
          {isMember ? (
            <Tab.Group>
              <Tab.List className="flex space-x-1 border-b">
                {extendedTabs.map((tab) => (
                  <Tab key={tab.label} className={({ selected }) =>
                    classNames(
                      'w-full py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400',
                      selected ? 'border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-300 hover:text-blue-600'
                    )
                  }>
                    {tab.label}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels className="mt-4">
                {extendedTabs.map((tab) => (
                  <Tab.Panel key={tab.label}>
                    {tab.content}
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>
          ) : (
            publicContent
          )}
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
