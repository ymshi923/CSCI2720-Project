import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/Login';
import Locations from './pages/Locations';
import LocationDetail from './pages/LocationDetail';
import Map from './pages/Map';
import Favorites from './pages/Favorites';
import RandomEventPage from './pages/RandomEventPage';
import Admin from './pages/Admin';
import AdminUsers from './pages/AdminUsers';
import AdminLocations from './pages/AdminLocations';
import AdminEvents from './pages/AdminEvents';


// Components
import Navbar from './components/Navbar';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app" data-theme={theme}>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <Routes>
          <Route path="/" element={user ? <Navigate to="/locations" /> : <Login onLogin={handleLogin} />} />
          <Route path="/login" element={user ? <Navigate to="/locations" /> : <Login onLogin={handleLogin} />} />
          
          {user ? (
            <>
              <Route path="/locations" element={<Locations />} />
              <Route path="/location/:id" element={<LocationDetail />} />
              <Route path="/map" element={<Map />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/random" element={<RandomEventPage />} />
              
              {user.role === 'admin' && (
                <>
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/locations" element={<AdminLocations />} />
                  <Route path="/admin/events" element={<AdminEvents />} />

                </>
              )}
            </>
          ) : null}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

