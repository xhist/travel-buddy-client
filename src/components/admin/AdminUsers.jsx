import React, { useEffect, useState } from 'react';
import API from '../../api/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    API.get('/users')
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  }, []);

  const deleteUser = async (userId) => {
    try {
      await API.delete(`/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div className="pt-20 pb-8 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">Manage Users</h1>
      <table className="min-w-full bg-white dark:bg-gray-700">
        <thead>
          <tr>
            <th className="py-2 px-4 border">ID</th>
            <th className="py-2 px-4 border">Username</th>
            <th className="py-2 px-4 border">Email</th>
            <th className="py-2 px-4 border">Role</th>
            <th className="py-2 px-4 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="text-center">
              <td className="py-2 px-4 border">{user.id}</td>
              <td className="py-2 px-4 border">{user.username}</td>
              <td className="py-2 px-4 border">{user.email}</td>
              <td className="py-2 px-4 border">{user.role}</td>
              <td className="py-2 px-4 border">
                <button onClick={() => deleteUser(user.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;
