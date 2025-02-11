import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Transition } from '@headlessui/react';
import { useAuth } from '../../hooks/useAuth';

const TripCard = ({ trip }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();
  const isMember = trip.members && user && trip.members.some(member => member.id === user.id);

  return (
    <div className="relative">
      {/* Trip Card */}
      <div
        className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition duration-300 cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        <img src={trip.image || '/default-trip.jpg'} alt={trip.title} className="w-full h-40 object-cover" />
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{trip.title}</h2>
          <p className="text-gray-600 dark:text-gray-300">{trip.destination}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Modal Portal */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center ${!modalOpen && 'pointer-events-none'}`}
        aria-modal="true"
        role="dialog"
      >
        {/* Backdrop */}
        <Transition
          show={modalOpen}
          enter="transition ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setModalOpen(false)}
        />

        {/* Modal Content */}
        <Transition
          show={modalOpen}
          enter="transition ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
          className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg mx-4 w-full z-10 transform"
        >
          <button 
            onClick={() => setModalOpen(false)} 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <img src={trip.image || '/default-trip.jpg'} alt={trip.title} className="w-full h-48 object-cover rounded" />
          <h2 className="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-200">{trip.title}</h2>
          <p className="text-gray-600 dark:text-gray-300">{trip.destination}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
          </p>
          <p className="mt-4 text-gray-700 dark:text-gray-300">{trip.description}</p>
          <div className="mt-6 text-right">
            {isMember ? (
              <Link
                to={`/trips/${trip.id}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                View Details
              </Link>
            ) : (
              <p className="text-sm text-gray-500">Join the trip to see full details</p>
            )}
          </div>
        </Transition>
      </div>
    </div>
  );
};

export default TripCard;