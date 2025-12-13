import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import '../styles/pages.css';

function Admin() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.stats();
      setStats(response.data);
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  return (
    <div className="page">
      <h1>⚙️ Admin Dashboard</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-container">
        <Link to="/admin/users" className="admin-card">
          <h3>👥 Users</h3>
          <p className="stat-number">{stats?.users || 0}</p>
          <p>Manage user accounts</p>
        </Link>

        <Link to="/admin/locations" className="admin-card">
          <h3>📍 Venues</h3>
          <p className="stat-number">{stats?.locations || 0}</p>
          <p>Manage venues and locations</p>
        </Link>

        <Link to="/admin/events" className="admin-card">
          <h3>🎭 Events</h3>
          <p className="stat-number">{stats?.events || 0}</p>
          <p>Manage cultural events</p>
        </Link>
      </div>

      <div className="admin-stats">
        <h2>System Statistics</h2>
        <div className="stats-grid">
          <div className="stat-box">
            <h4>Total Users</h4>
            <p>{stats?.users || 0}</p>
          </div>
          <div className="stat-box">
            <h4>Total Venues</h4>
            <p>{stats?.locations || 0}</p>
          </div>
          <div className="stat-box">
            <h4>Total Events</h4>
            <p>{stats?.events || 0}</p>
          </div>
          <div className="stat-box">
            <h4>Last Updated</h4>
            <p>{new Date(stats?.lastUpdated).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
