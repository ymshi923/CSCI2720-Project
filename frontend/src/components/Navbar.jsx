import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import '../styles/components.css';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleRandomEvent = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getRandom();
      const event = response.data;
      
      if (event && event.locationId) {
        navigate(`/locations/${event.locationId._id || event.locationId}`);
      } else {
        alert('No random event found');
      }
    } catch (error) {
      alert('Failed to pick random event');
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/locations">🎭 Cultural Events</Link>
      </div>

      <ul className="navbar-menu">
        <li><Link to="/locations">Venues</Link></li>
        <li><Link to="/map">Map</Link></li>
        <li><Link to="/favorites">❤️ Favorites</Link></li>
        <li><Link to="/random">🎲 Random</Link></li>
        <li>
          <Link to="/admin" className={user.role !== 'admin' ? 'hidden' : ''}>
            ⚙️ Admin
          </Link>
        </li>
      </ul>


      <div className="navbar-user">
        <span>👤 {user.username}</span>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;

