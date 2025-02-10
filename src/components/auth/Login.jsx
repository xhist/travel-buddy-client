import React, { useState } from 'react';
import API from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { Transition } from '@headlessui/react';

const Login = () => {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onChange = (e) => setCreds({ ...creds, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await API.post('/auth/login', creds);
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl p-8 max-w-md w-full transform transition duration-500 hover:scale-105">
        <h2 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400 mb-6">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Username</label>
            <input type="text" name="username" value={creds.username} onChange={onChange}
              className="mt-1 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition" required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300">Password</label>
            <input type="password" name="password" value={creds.password} onChange={onChange}
              className="mt-1 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 rounded hover:bg-blue-700 transition">
            Login
          </button>
        </form>
        <Transition
          show={!!error}
          enter="transition-opacity duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="transition-opacity duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          {error && <p className="mt-4 text-center text-red-600">{error}</p>}
        </Transition>
      </div>
    </div>
  );
};

export default Login;
