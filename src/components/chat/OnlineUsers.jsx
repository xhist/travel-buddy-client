import React, { useState, useEffect } from 'react';
import { useStompClient } from '../../hooks/useStompClient';
import { useAuth } from '../../hooks/useAuth';
import { MessageCircle, X } from 'lucide-react';
import { useChatContext } from '../contexts/ChatContext';
import { Transition } from '@headlessui/react';

const OnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { client, connected } = useStompClient('http://localhost:8080/ws');
  const { user } = useAuth();
  const { handleStartChat, isMobileUsersOpen, setIsMobileUsersOpen } = useChatContext();

  useEffect(() => {
    if (!client || !connected) return;

    const presenceSubscription = client.subscribe('/topic/presence', (message) => {
      try {
        const presenceUpdate = JSON.parse(message.body);
        console.log('Presence update:', presenceUpdate);
        
        setOnlineUsers(current => {
          const updatedUsers = [...current];
          if (Array.isArray(presenceUpdate)) {
            // Handle initial user list
            return presenceUpdate.filter(user => user.status === 'ONLINE');
          } else {
            // Handle individual updates
            const index = updatedUsers.findIndex(u => u.username === presenceUpdate.username);
            if (presenceUpdate.status === 'ONLINE') {
              if (index === -1) {
                updatedUsers.push(presenceUpdate);
              }
            } else {
              if (index !== -1) {
                updatedUsers.splice(index, 1);
              }
            }
            return updatedUsers;
          }
        });
      } catch (error) {
        console.error('Error processing presence update:', error);
      }
    });

    client.publish({
      destination: '/app/presence.getOnlineUsers'
    });

    return () => presenceSubscription.unsubscribe();
  }, [client, connected]);

  const OnlineUsersList = () => (
    <div className="divide-y dark:divide-gray-700">
      {onlineUsers.map((onlineUser) => (
        <div
          key={onlineUser.username}
          className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={onlineUser.profilePicture || "/default-avatar.png"}
                alt={onlineUser.username}
                className="w-10 h-10 rounded-full"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {onlineUser.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active now
              </p>
            </div>
          </div>
          <button
            onClick={() => handleStartChat(onlineUser)}
            className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      ))}
      {onlineUsers.length === 0 && (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          No users online
        </div>
      )}
    </div>
  );

  if (!connected) {
    return (
      <div className="p-4 text-gray-500">
        Connecting...
      </div>
    );
  }

  return (
    <>
      {/* Desktop view */}
      <div className="w-80 p-4 hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Online Users ({onlineUsers.length})
            </h2>
          </div>
          <OnlineUsersList />
        </div>
      </div>

      {/* Mobile button */}
      <button
        onClick={() => setIsMobileUsersOpen(true)}
        className="fixed bottom-4 left-4 lg:hidden z-50 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Mobile drawer */}
      <Transition show={isMobileUsersOpen}>
        <div className="fixed inset-0 z-50 lg:hidden">
          <Transition.Child
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setIsMobileUsersOpen(false)}
            />
          </Transition.Child>

          <Transition.Child
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setIsMobileUsersOpen(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 h-0 overflow-y-auto">
                <div className="p-4 border-b dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Online Users ({onlineUsers.length})
                  </h2>
                </div>
                <OnlineUsersList />
              </div>
            </div>
          </Transition.Child>
        </div>
      </Transition>
    </>
  );
};

export default OnlineUsers;