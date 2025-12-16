import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoritesAPI } from '../services/api';
import '../styles/pages.css';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoritesAPI.getAll();
      
      const favoritesData = response.data?.favorites || 
                           response.data?.locations || 
                           response.data || 
                           [];
      
      const validFavorites = Array.isArray(favoritesData) 
        ? favoritesData.filter(item => item && (item._id || item.location?._id || item.id))
        : [];
      
      setFavorites(validFavorites);
    } catch (err) {
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (locationId) => {
    try {
      await favoritesAPI.remove(locationId);
      setFavorites(favorites.filter(fav => {
        if (!fav) return false;
        const loc = fav.location || fav;
        return loc._id !== locationId && loc.id !== locationId;
      }));
    } catch (err) {
      setError('Failed to remove favorite');
    }
  };

  if (loading) return <div className="loading">Loading favorites...</div>;

  return (
    <div className="page">
      <h1>❤️ My Favorite Venues</h1>

      {error && <div className="error-message">{error}</div>}

      {favorites.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>LOCATION</th>
                <th>NUMBER OF EVENTS</th>
                <th>REMOVE</th>
              </tr>
            </thead>
            <tbody>
              {favorites.map((fav, index) => {
                if (!fav) return null;
                
                const location = fav.location || fav;
                if (!location) return null;
                
                const locationId = location._id || location.id || index;
                const locationName = location.name || 'Unknown Venue';
                
                return (
                  <tr key={locationId}>
                    <td>
                      <Link 
                        to={`/location/${locationId}`}
                        style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none', fontSize: '18px'}}
                      >
                        {locationName}
                      </Link>
                    </td>
                    <td style={{fontSize: '16px' }}>
                      {location.eventCount || 0}
                    </td>
                    <td>
                      <button
                        onClick={() => handleRemove(locationId)}
                        className = 'btn-remove'
                      >
                        Remove ❤️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ fontSize: '18px', marginBottom: '20px', color: '#666' }}>
            You haven't added any favorite venues yet.
          </p>
          <Link 
            to="/locations" 
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Explore Venues
          </Link>
        </div>
      )}
    </div>
  );
}

export default Favorites;
