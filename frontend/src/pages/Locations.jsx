import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { locationsAPI, favoritesAPI } from '../services/api';
import FilterPanel from '../components/FilterPanel';
import '../styles/pages.css';

function Locations() {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [userLat, setUserLat] = useState(22.3);
  const [userLng, setUserLng] = useState(114.2);
  const [locationLoading, setLocationLoading] = useState(false);
  const [likeStatus, setLikeStatus] = useState({});

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
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await locationsAPI.getAll('name', {
        lat: userLat,
        lng: userLng
      });
      const locationsData = response.data;
      setLocations(locationsData);
      
      const statusObj = {};
      for (const location of locationsData) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/likes/check/${location._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            statusObj[location._id] = data.isLiked;
          } else {
            statusObj[location._id] = false;
          }
        } catch {
          statusObj[location._id] = false;
        }
      }
      setLikeStatus(statusObj);
      const sorted = locationsData.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      setFilteredLocations(sorted);
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
    const toRad = (value) => value * Math.PI / 180;
    
    const R = 6371;
    
    const dLat = toRad(lat - userLat);
    const dLng = toRad(lng - userLng);
    
    const lat1 = toRad(userLat);
    const lat2 = toRad(lat);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1) * Math.cos(lat2) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return parseFloat(distance.toFixed(2));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
  };

  const sortLocations = (field, direction) => {
    const sorted = [...filteredLocations].sort((a, b) => {
      let aValue, bValue;

      switch(field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'venueId':
          aValue = a.venueId;
          bValue = b.venueId;
          break;
        case 'distance':
          aValue = calculateDistance(a.latitude, a.longitude);
          bValue = calculateDistance(b.latitude, b.longitude);
          break;
        case 'eventCount':
          aValue = a.eventCount;
          bValue = b.eventCount;
          break;
        case 'favoriteCount':
          aValue = a.favoriteCount || 0;
          bValue = b.favoriteCount || 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredLocations(sorted);
  };

  const handleToggleLike = async (locationId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const isLiked = likeStatus[locationId];
      const token = localStorage.getItem('token');
      
      const url = `/api/likes/${locationId}`;
      const method = isLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setLikeStatus(prev => ({
        ...prev,
        [locationId]: !isLiked
      }));
      
      setFilteredLocations(prevLocations => 
        prevLocations.map(location => 
          location._id === locationId 
          ? { ...location, favoriteCount: data.favoriteCount }
          : location
        )
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };
  useEffect(() => {
    if (filteredLocations.length > 0) {
      sortLocations(sortField, sortDirection);
    }
  }, [sortField, sortDirection]);

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
            <p className="results-count">{filteredLocations.length} venues found</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('venueId')}>
                    ID {renderSortIcon('venueId')}
                  </th>
                  <th onClick={() => handleSort('name')}>
                    LOCATION {renderSortIcon('name')}
                  </th>
                  <th onClick={() => handleSort('distance')}>
                    DISTANCE (KM) {renderSortIcon('distance')}
                  </th>
                  <th onClick={() => handleSort('eventCount')}>
                    EVENTS {renderSortIcon('eventCount')}
                  </th>
                  <th onClick={() => handleSort('favoriteCount')}>
                    LIKES {renderSortIcon('favoriteCount')}
                  </th>
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
                      <button
                        onClick={(e) => handleToggleLike(location._id, e)}
                        className={`btn-favorite-table ${likeStatus[location._id] ? 'favorited' : ''}`}
                      >
                        {likeStatus[location._id] ? '❤️' : '🤍'} {location.favoriteCount || 0}
                      </button>
                    </td>
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
     

