import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Transition } from '@headlessui/react';
import { useAuth } from '../../hooks/useAuth';
import { Eye, UserPlus, X } from 'lucide-react';
import API from '../../api/api';
import toast from 'react-hot-toast';
import { Clock } from 'lucide-react';

const Modal = ({ isOpen, onClose, children }) => {
  return (
    <Transition show={isOpen} as={React.Fragment}>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center">
          {/* Backdrop */}
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div 
              className="fixed inset-0 bg-black/50" 
              onClick={onClose}
              aria-hidden="true"
            />
          </Transition.Child>

          {/* Modal */}
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
            className="relative w-full max-w-lg mx-4"
          >
            {children}
          </Transition.Child>
        </div>
      </div>
    </Transition>
  );
};

const JoinTripButton = ({ trip, onJoinRequest }) => {
  const [isJoining, setIsJoining] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkJoinStatus = async () => {
      try {
        const response = await API.get(`/trips/${trip.id}/joinStatus/${user.id}`);
        setHasPendingRequest(response.data.hasPendingRequest);
      } catch (error) {
        console.error('Error checking join status:', error);
      }
    };

    if (user) {
      checkJoinStatus();
    }
  }, [trip.id, user]);

  const handleJoinTrip = async (e) => {
    e.stopPropagation();
    try {
      setIsJoining(true);
      await API.post(`/trips/${trip.id}/join`);
      setHasPendingRequest(true);
      toast.success('Join request sent successfully!');
      if (onJoinRequest) {
        onJoinRequest();
      }
    } catch (error) {
      toast.error(error.response?.data || 'Failed to send join request');
      console.error('Error joining trip:', error);
    } finally {
      setIsJoining(false);
    }
  };

  if (hasPendingRequest) {
    return (
      <button
        disabled
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-600 rounded cursor-not-allowed"
      >
        <Clock className="w-5 h-5" />
        Pending
      </button>
    );
  }

  return (
    <button
      onClick={handleJoinTrip}
      disabled={isJoining}
      className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
        isJoining ? 'opacity-75 cursor-not-allowed' : ''
      }`}
    >
      <UserPlus className="w-5 h-5" />
      {isJoining ? 'Sending Request...' : 'Join Trip'}
    </button>
  );
};

const TripCard = ({ trip }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();
  const isMember = trip.members && user && trip.members.some(member => member.id === user.id);

  return (
    <div className="relative">
      {/* Trip Card */}
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden">
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => setModalOpen(true)}
            className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow hover:bg-white dark:hover:bg-gray-800 transition-all"
            title="View Details"
          >
            <Eye className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <img src={trip.image || '/default-trip.jpg'} alt={trip.title} className="w-full h-40 object-cover" />
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{trip.title}</h2>
          <p className="text-gray-600 dark:text-gray-300">{trip.destination}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl relative">
          <button 
            onClick={() => setModalOpen(false)} 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="p-6">
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
                  View Full Details
                </Link>
              ) : (
                <JoinTripButton trip={trip} />
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default TripCard;