import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Transition } from '@headlessui/react';
import { useDarkMode } from '../../hooks/useDarkMode';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/trips', label: 'Trips' },
  { to: '/chat', label: 'Chat' },
  { to: '/friends', label: 'Friends' },
  { to: '/calendar', label: 'Calendar' },
];

const UserDropdown = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative ml-4">
      <button onClick={() => setOpen((prev) => !prev)}
        className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-600">
        <img className="h-8 w-8 rounded-full" src="/default-avatar.png" alt="User" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">My Account</span>
        <svg className="ml-1 h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <Transition
        show={open}
        enter="transition ease-out duration-200 transform"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-100 transform"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5">
          {['Profile', 'Settings', 'Logout'].map(item => (
            <Link key={item} to={`/${item.toLowerCase()}`} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">
              {item}
            </Link>
          ))}
        </div>
      </Transition>
    </div>
  );
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();
  
  return (
    <header className="fixed w-full z-50 bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">TravelBuddy</Link>
          <nav className="hidden md:flex ml-10 space-x-4">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 pb-1'
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="hidden md:block">
          <input type="text" placeholder="Search..."
            className="w-64 py-1 pl-10 pr-4 rounded-full border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition" />
        </div>
        <div className="flex items-center">
          <button onClick={toggleDarkMode} className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 mr-4">
            {isDark ? (
              <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a.75.75 0 01.75.75V4a.75.75 0 01-1.5 0V2.75A.75.75 0 0110 2zM4.22 4.22a.75.75 0 011.06 0L6 4.94a.75.75 0 11-1.06 1.06L4.22 5.28a.75.75 0 010-1.06zM2 10a.75.75 0 01.75-.75H4a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm2.22 5.78a.75.75 0 011.06 1.06L4.94 16a.75.75 0 11-1.06-1.06l.34.34zm5.78 1.22a.75.75 0 01.75-.75h1.25a.75.75 0 010 1.5H10.75a.75.75 0 01-.75-.75zm5.56-2.22a.75.75 0 010 1.06l-.34.34a.75.75 0 11-1.06-1.06l.34-.34a.75.75 0 011.06 0zM16 10a.75.75 0 01.75.75V12a.75.75 0 01-1.5 0v-1.25A.75.75 0 0116 10zm-2.22-5.78a.75.75 0 011.06-1.06l.34.34a.75.75 0 11-1.06 1.06l-.34-.34z" />
                <path d="M10 6a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 0010.586 10.586z" />
              </svg>
            )}
          </button>
          <div className="hidden md:block">
            <UserDropdown />
          </div>
        </div>
        <div className="md:hidden">
          <button onClick={() => setMobileOpen((prev) => !prev)} className="text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600">
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
      <Transition
        show={mobileOpen}
        enter="transition duration-300 ease-out transform"
        enterFrom="-translate-x-full"
        enterTo="translate-x-0"
        leave="transition duration-300 ease-in transform"
        leaveFrom="translate-x-0"
        leaveTo="-translate-x-full"
      >
        <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg">
          <nav className="px-4 pt-4 pb-6 space-y-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} onClick={() => setMobileOpen(false)} to={to} className="block text-gray-700 dark:text-gray-300 hover:text-blue-600">
                {label}
              </NavLink>
            ))}
            <NavLink onClick={() => setMobileOpen(false)} to="/profile" className="block text-gray-700 dark:text-gray-300 hover:text-blue-600">
              Profile
            </NavLink>
          </nav>
        </div>
      </Transition>
    </header>
  );
};

export default Navbar;
