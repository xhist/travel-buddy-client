import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div className="pt-20 pb-8 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">Admin Dashboard</h1>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/admin/users" className="block bg-white dark:bg-gray-700 rounded-lg shadow p-6 hover:shadow-xl transition">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Manage Users</h2>
          <p className="text-gray-600 dark:text-gray-300">View, edit, and delete users.</p>
        </Link>
        <Link to="/admin/trips" className="block bg-white dark:bg-gray-700 rounded-lg shadow p-6 hover:shadow-xl transition">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Manage Trips</h2>
          <p className="text-gray-600 dark:text-gray-300">Review and manage all trips.</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
