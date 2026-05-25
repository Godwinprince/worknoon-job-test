import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Inbox from './pages/Inbox';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

interface User {
  role?: string;
  id?: string;
  name?: string;
  email?: string;
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    if (token) {
      const userStr = localStorage.getItem('user');
      setUser(userStr ? JSON.parse(userStr) : null);
    } else {
      setUser(null);
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/inbox" /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={<Auth setToken={setToken} />} />
        <Route path="/inbox" element={token ? <Inbox user={user} token={token} /> : <Navigate to="/auth" />} />
        <Route path="/chat/:conversationId" element={token ? <Chat user={user} token={token} /> : <Navigate to="/auth" />} />
        <Route path="/profile" element={token ? <Profile user={user} token={token} /> : <Navigate to="/auth" />} />
        <Route path="/admin" element={token && user?.role === 'admin' ? <AdminDashboard token={token} /> : <Navigate to="/inbox" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;