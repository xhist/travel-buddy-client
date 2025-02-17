import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import API from '../../api/api';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const onChange = (e) => {
    setCreds({ ...creds, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '', form: '' });
  };

  const validateField = (name, value) => {
    let message = '';
    if (!value.trim()) {
      message = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }
    setErrors((prev) => ({ ...prev, [name]: message }));
    return message === '';
  };

  const onBlur = (e) => {
    validateField(e.target.name, e.target.value);
  };

  const validate = () => {
    const usernameValid = validateField('username', creds.username);
    const passwordValid = validateField('password', creds.password);
    return usernameValid && passwordValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const response = await API.post('/auth/login', creds);
      const { token, userDto } = response.data;
      console.log('User logged in:', userDto);
      
      // Store token and user data
      localStorage.setItem('token', token);
      login({ token, user: userDto });
      
      navigate('/');
    } catch (err) {
      setErrors({ form: 'Login failed. Please try again.' });
      console.log('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl p-8 max-w-md w-full transform transition duration-500 hover:scale-105">
        <h2 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400 mb-6">Login</h2>
        
        {errors.form && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">Username</label>
            <input
              type="text"
              name="username"
              value={creds.username}
              onChange={onChange}
              onBlur={onBlur}
              disabled={isLoading}
              className="mt-1 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
            {errors.username && (
              <p className="text-red-600 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              name="password"
              value={creds.password}
              onChange={onChange}
              onBlur={onBlur}
              disabled={isLoading}
              className="mt-1 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 dark:bg-blue-500 text-white py-2 rounded hover:bg-blue-700 transition ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;