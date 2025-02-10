import { useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import API from '../api/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        jwtDecode(token); // You can use decoded data if needed
        API.get('/users/me')
          .then((res) => setUser(res.data))
          .catch((err) => console.error(err));
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);
  
  return { user, setUser };
};
