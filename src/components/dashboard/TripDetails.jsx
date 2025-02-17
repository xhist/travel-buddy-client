import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/api';
import { Tab } from '@headlessui/react';
import { useTripAccess } from '../../hooks/useTripAccess';
import { useAuth } from '../../hooks/useAuth';
import Itinerary from '../trip/Itinerary';
import PackingChecklist from '../trip/PackingChecklist';
import Expenses from '../trip/Expenses';
import GroupChat from '../chat/GroupChat';
import Voting from '../voting/Voting';
import Weather from '../layout/Weather';
import PersonalItinerary from '../trip/PersonalItinerary';
import JoinRequests from '../trip/JoinRequests.jsx';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Protected tabs – each receives tripId and other props
const protectedTabs = [
  { label: 'Group Itinerary', content: <Itinerary tripId={null} /> },
  { label: 'Personal Itinerary', content: <PersonalItinerary tripId={null} /> },
  { label: 'Packing Checklist', content: <PackingChecklist tripId={null} /> },
  { label: 'Expenses', content: <Expenses tripId={null} isOrganizer={null} /> },
  { label: 'Group Chat', content: <GroupChat tripId={null} /> }
];

const publicContent = <p className="text-gray-700 dark:text-gray-300">Public trip details. Join the trip to view full details.</p>;

const TripDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const isMember = useTripAccess(trip);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get(`/trips/${id}`);
        setTrip(data);
        setIsOrganizer(data.organizer === (user.id || 0));
      } catch (err) {
        console.error('Error fetching trip details:', err);
      }
    })();
  }, [id]);

  if (!trip) return <div className="pt-20 text-center"><p>Loading...</p></div>;

  // Extend tabs with required props
  const extendedTabs = protectedTabs.map((tab) => ({
    label: tab.label,
    content: React.cloneElement(tab.content, { tripId: trip.id, userId: user.id, isOrganizer: isOrganizer })
  }));

  if (isOrganizer) {
    extendedTabs.push({
      label: 'Join Requests',
      content: <JoinRequests tripId={trip.id} />
    });
  }

  return (
    <div className="pt-20 pb-8 px-4 md:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <img src={trip.image || '/default-trip.jpg'} alt={trip.title} className="w-full h-64 object-cover" />
        <div className="p-6">
          <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-gray-200">{trip.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{trip.destination}</p>
          <Weather destination={trip.destination} />
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
