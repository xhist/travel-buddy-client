import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Notifications from './components/layout/Notifications';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/common/ProtectedRoute';
import Profile from './components/auth/Profile';
import Dashboard from './components/dashboard/Dashboard';
import TripDetails from './components/dashboard/TripDetails';
import GroupChat from './components/chat/GroupChat';
import PrivateChat from './components/chat/PrivateChat';
import Friends from './components/social/Friends';
import CalendarSync from './components/trip/CalendarSync';
import CreateTrip from './components/trip/CreateTrip';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminTrips from './components/admin/AdminTrips';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import { ChatProvider } from './components/contexts/ChatContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 pt-16">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route 
                    path="/*" 
                    element={
                      <ProtectedRoute>
                        <ChatProvider>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/profile/:username" element={<Profile />} />
                            <Route path="/trips/create" element={<CreateTrip /> } />
                            <Route path="/trips/:id" element={<TripDetails />} />
                            <Route path="/trips/:id/chat" element={<GroupChat />} />
                            <Route path="/friends/:friendId/chat" element={<PrivateChat />} />
                            <Route path="/friends" element={<Friends />} />
                            <Route path="/calendar" element={<CalendarSync tripId={1} />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/admin/users" element={<AdminUsers />} />
                            <Route path="/admin/trips" element={<AdminTrips />} />
                          </Routes>
                          <Notifications />
                        </ChatProvider>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
              <Toaster position="bottom-left" />
              <Footer />
            </div>
        </ErrorBoundary>
      </AuthProvider>
    </Router> 
  );
}

export default App;
