import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useAuth } from '../../hooks/useAuth';
import { Transition } from '@headlessui/react';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/friends', label: 'Friends' },
  { to: '/calendar', label: 'Calendar' },
];

// NavLinks renders appropriate links based on authentication status.
const NavLinks = ({ user, onClick }) => {
  if (user) {
    return (
      <>
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
              isActive
                ? 'block text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1'
                : 'block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 pb-1'
            }
          >
            {label}
          </NavLink>
        ))}
      </>
    );
  }
  return (
    <>
      <Link
        to="/login"
        onClick={onClick}
        className="block text-gray-700 dark:text-gray-300 hover:text-blue-600"
      >
        Login
      </Link>
      <Link
        to="/register"
        onClick={onClick}
        className="block text-gray-700 dark:text-gray-300 hover:text-blue-600"
      >
        Register
      </Link>
    </>
  );
};

const UserDropdown = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  const menuItems = [
    { label: 'Profile', path: '/profile' },
    { label: 'Logout', onClick: handleLogout }
  ];

  return (
    <div className="relative ml-4" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-lg p-1 transition-all duration-200"
      >
        <img 
          className="h-8 w-8 rounded-full" 
          src={user?.profilePicture || "/default-avatar.png"} 
          alt="User" 
        />
        <span className="ml-2 text-gray-700 dark:text-gray-300">
          {user?.username || 'My Account'}
        </span>
        <svg 
          className={`ml-1 h-4 w-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Transition
        show={open}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div 
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5"
        >
          <div className="py-1">
            {menuItems.map((item) => (
              item.path ? (
                <Link
                  key={item.label}
                  to={item.path}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150"
                >
                  {item.label}
                </button>
              )
            ))}
          </div>
        </div>
      </Transition>
    </div>
  );
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();
  const { user } = useAuth();

  return (
    <header className="fixed w-full z-50 bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
          TravelBuddy
        </Link>
        {/* Desktop Navigation: aligned to right */}
        <nav className="hidden md:flex flex-1 justify-end items-center space-x-6">
          <NavLinks user={user} />
          {user && <UserDropdown />}
        </nav>
        {/* Mobile Navigation Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile Navigation Container: Always rendered; animation applied via transform */}
      <div
        className={`fixed left-0 z-50 bg-white dark:bg-gray-800 shadow-lg w-64 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ top: '4rem', height: 'calc(100vh - 4rem)' }}
      >
        <nav className="flex flex-col space-y-4 p-4">
          <NavLinks user={user} onClick={() => setMobileOpen(false)} />
          {user && <UserDropdown />}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
