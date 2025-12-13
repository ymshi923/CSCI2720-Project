import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { locationsAPI } from '../services/api';
import FilterPanel from '../components/FilterPanel';
import '../styles/pages.css';

function Locations() {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('name');
  const [userLat, setUserLat] = useState(22.3);
  const [userLng, setUserLng] = useState(114.2);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLat(position.coords.latitude);
            setUserLng(position.coords.longitude);
            setLocationLoading(false);
            fetchLocations();
          },
          (error) => {
            console.error("Failed to get location:", error);
            setLocationLoading(false);
            fetchLocations();
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        console.log("Geolocation not supported by browser");
        fetchLocations();
      }
    };
    
    getUserLocation();
  }, [sort]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await locationsAPI.getAll(sort, {
        lat: userLat,
        lng: userLng
      });
      setLocations(response.data);
      setFilteredLocations(response.data);
    } catch (err) {
      setError('Failed to load locations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filtered) => {
    setFilteredLocations(filtered);
  };

  const calculateDistance = (lat, lng) => {
    const R = 6371; 
    const dLat = (lat - userLat) * Math.PI / 180;
    const dLon = (lng - userLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(2); 
  };

  if (loading || locationLoading) return <div className="loading">Loading locations...</div>;

  return (
    <div className="page">
      <h1>📍 Cultural Venues</h1>

      <div className="locations-container">
        <FilterPanel 
          locations={locations}
          onFilter={handleFilter}
          userLat={userLat}
          userLng={userLng}
          onUserLocationChange={(lat, lng) => {
            setUserLat(lat);
            setUserLng(lng);
          }}
        />

        <div className="locations-view">
          <div className="view-controls">
            <div className="sort-control">
              <label>Sort by: </label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="name">Location Name</option>
                <option value="distance">Distance (km)</option>
                <option value="events">Number of Events</option>
              </select>
            </div>
            <p className="results-count">{filteredLocations.length} venues found</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>LOCATION</th>
                  <th>DISTANCE (KM)</th>
                  <th>NUMBER OF EVENTS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map(location => (
                  <tr key={location._id}>
                    <td>{location.venueId}</td>
                    <td>
                      <Link to={`/location/${location._id}`} className="table-link">
                        {location.name}
                      </Link>
                    </td>
                    <td>{calculateDistance(location.latitude, location.longitude)} km</td>
                    <td>{location.eventCount}</td>
                    <td>
                      <Link to={`/location/${location._id}`} className="btn-view">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLocations.length === 0 && (
              <div className="empty-state">
                <p>No venues found matching your criteria.</p>
              </div>
            )}

            <div className="last-updated">
              <p>Last updated time: {new Date().toLocaleDateString('en-GB')}, {new Date().toLocaleTimeString('en-GB')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Locations;
