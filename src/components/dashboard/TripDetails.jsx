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
import Weather from '../layout/Weather';
import PersonalItinerary from '../trip/PersonalItinerary';
import JoinRequests from '../trip/JoinRequests';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Menu } from 'lucide-react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const TripDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isMember = useTripAccess(trip);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/trips/${id}`);
        setTrip(data);
        setIsOrganizer(data.organizer === user.id);
      } catch (err) {
        console.error('Error fetching trip details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTripDetails();
    }
  }, [id, user.id]);

  const tabs = [
    { name: 'Group Itinerary', component: <Itinerary tripId={id} /> },
    { name: 'Personal Itinerary', component: <PersonalItinerary tripId={id} /> },
    { name: 'Packing List', component: <PackingChecklist tripId={id} /> },
    { name: 'Expenses', component: <Expenses tripId={id} isOrganizer={isOrganizer} /> },
    { name: 'Group Chat', component: <GroupChat tripId={id} /> }
  ];

  if (isOrganizer) {
    tabs.push({ name: 'Join Requests', component: <JoinRequests tripId={id} /> });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trip Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="relative h-48 sm:h-64">
            <img 
              src={trip?.image || '/default-trip.jpg'} 
              alt={trip?.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white">
                <h1 className="text-2xl sm:text-4xl font-bold mb-2">{trip?.title}</h1>
                <p className="text-lg opacity-90">{trip?.destination}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <Weather destination={trip?.destination} />
          </div>
        </div>

        {/* Mobile Tab Menu Toggle */}
        {isMobile && (
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {/* Mobile Tab Menu */}
        <AnimatePresence>
          {isMobile && showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64"
            >
              <div className="space-y-2">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.name}
                    onClick={() => {
                      setSelectedTab(index);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedTab === index
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        {isMember ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
              <Tab.List className="flex space-x-1 p-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      classNames(
                        'flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                        'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60',
                        selected
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      )
                    }
                  >
                    {tab.name}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels className="p-4">
                {tabs.map((tab, idx) => (
                  <Tab.Panel
                    key={idx}
                    className={classNames(
                      'rounded-xl focus:outline-none'
                    )}
                  >
                    {tab.component}
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Join this trip to view full details and participate in activities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetails;