import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Notifications from './components/layout/Notifications';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
import Dashboard from './components/dashboard/Dashboard';
import TripDetails from './components/dashboard/TripDetails';
import GroupChat from './components/chat/GroupChat';
import PrivateChat from './components/chat/PrivateChat';
import Friends from './components/social/Friends';
import CalendarSync from './components/trip/CalendarSync';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminTrips from './components/admin/AdminTrips';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <Notifications />
          <main className="flex-1 pt-16">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/trip/:id" element={<TripDetails />} />
              <Route path="/chat" element={<GroupChat />} />
              <Route path="/privatechat/:recipientId" element={<PrivateChat />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/calendar" element={<CalendarSync tripId={1} />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/trips" element={<AdminTrips />} />
              {/* Additional routes can be added here */}
            </Routes>
          </main>
          <Footer />
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
