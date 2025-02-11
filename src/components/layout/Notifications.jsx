import React, { useState, useEffect, useRef } from 'react';
import { Transition } from '@headlessui/react';
import API from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
import { Bell } from 'lucide-react';

const NotificationDetails = ({ notification, onBack }) => {
  return (
    <div className="p-4">
      <button 
        onClick={onBack} 
        className="mb-2 text-blue-600 dark:text-blue-400 hover:underline"
      >
        &larr; Back
      </button>
      <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">{notification.title}</h4>
      <p className="text-gray-700 dark:text-gray-300">{notification.message}</p>
    </div>
  );
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    if (user) {
      API.get('/notifications')
        .then((res) => {
          if (res.data) {
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.read).length);
          }
        })
        .catch((err) => console.error('Error fetching notifications:', err));
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setVisible(false);
        setSelectedNotification(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notification Bell Button */}
      <button 
        onClick={() => setVisible(!visible)}
        className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <Transition
        show={visible}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div 
          ref={panelRef}
          className="absolute bottom-16 right-0 w-80 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          {!selectedNotification ? (
            <>
              <div className="p-4 border-b dark:border-gray-700">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">
                  Notifications
                </h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 p-4 text-center">
                    No notifications
                  </p>
                ) : (
                  notifications.map((note) => (
                    <div 
                      key={note.id} 
                      onClick={() => setSelectedNotification(note)}
                      className="border-b dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-gray-700 dark:text-gray-300">{note.title}</p>
                        {!note.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <NotificationDetails 
              notification={selectedNotification} 
              onBack={() => setSelectedNotification(null)} 
            />
          )}
        </div>
      </Transition>
    </div>
  );
};

export default Notifications;