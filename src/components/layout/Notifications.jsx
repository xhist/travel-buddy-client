import React, { useState, useEffect, useRef } from 'react';
import { Transition } from '@headlessui/react';
import API from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
import { useStompClient } from '../../hooks/useStompClient';
import toast from 'react-hot-toast';

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
      <div className="text-sm text-gray-500 mt-2">
        {new Date(notification.timestamp).toLocaleString()}
      </div>
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
  const { client, connected } = useStompClient('http://localhost:8080/ws');

  // Fetch existing notifications
  useEffect(() => {
    if (user) {
      API.get('/notifications')
        .then((res) => {
          setNotifications(res.data);
          setUnreadCount(res.data.filter(n => !n.read).length);
        })
        .catch((err) => console.error('Error fetching notifications:', err));
    }
  }, [user]);

  // Subscribe to WebSocket notifications
  useEffect(() => {
    if (!client || !connected || !user) return;

    const subscription = client.subscribe('/user/queue/notifications', (message) => {
      try {
        const notification = JSON.parse(message.body);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast(notification.title, {
          icon: '🔔',
          position: 'top-right',
          duration: 3000
        });
      } catch (err) {
        console.error('Error handling notification:', err);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [client, connected, user]);

  // Handle click outside
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

  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => prev - 1);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  if (!user) return null;

  return (
    <>
      <button 
        onClick={() => setVisible(!visible)}
        className="fixed bottom-4 right-4 z-50 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center focus:outline-none hover:bg-blue-700 transition-colors relative"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {visible && (
        <div 
          ref={panelRef}
          className="fixed bottom-24 right-4 z-40 w-full sm:w-80 max-w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden"
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
                      className={`border-b dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !note.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => {
                        setSelectedNotification(note);
                        if (!note.read) {
                          markAsRead(note.id);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-800 dark:text-gray-200">
                            {note.title}
                          </h5>
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                            {note.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(note.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!note.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
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
      )}
    </>
  );
};

export default Notifications;