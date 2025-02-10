import React, { useState, useEffect } from 'react';
import API from '../../api/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    API.get('/notifications')
      .then(res => setNotifications(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="fixed top-16 right-4 w-80 bg-white dark:bg-gray-800 shadow-lg rounded p-4 z-50">
      <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Notifications</h4>
      {notifications.length ? (
        <ul>
          {notifications.map((note) => (
            <li key={note.id} className="border-b py-2 text-gray-700 dark:text-gray-300">
              {note.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No notifications.</p>
      )}
    </div>
  );
};

export default Notifications;
