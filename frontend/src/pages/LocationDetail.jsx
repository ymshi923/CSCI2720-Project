import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { locationsAPI, eventsAPI, commentsAPI, favoritesAPI } from '../services/api';
import CommentSection from '../components/CommentSection';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import '../styles/pages.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    fetchLocationDetails();
    checkIfFavorited();
  }, [id]);

  const fetchLocationDetails = async () => {
    try {
      setLoading(true);
      const response = await locationsAPI.getOne(id);
      setLocation(response.data);
      
      const eventsResponse = await eventsAPI.getByLocation(id);
      setEvents(eventsResponse.data);
    } catch (err) {
      setError('Failed to load location details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorited = async () => {
    try {
      const response = await favoritesAPI.check(id);
      setIsFavorited(response.data.isFavorited);
    } catch (err) {
      console.error('Error checking favorite:', err);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      setFavoriteLoading(true);
      if (isFavorited) {
        await favoritesAPI.remove(id);
      } else {
        await favoritesAPI.add(id);
      }
      setIsFavorited(!isFavorited);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading location details...</div>;

  if (!location) return <div className="error-message">Location not found</div>;

  return (
    <div className="page">
      <button onClick={() => navigate('/locations')} className="btn-back">
        ← Back to Venues
      </button>

      <div className="location-detail">
        <div className="location-info">
          <h1>{location.name}</h1>
          <p className="venue-id">📍 Venue ID: {location.venueId}</p>
          <p className="event-count">🎭 {location.eventCount} events</p>

          <div className="location-coords">
            <p><strong>Coordinates:</strong></p>
            <p>Latitude: {location.latitude.toFixed(4)}</p>
            <p>Longitude: {location.longitude.toFixed(4)}</p>
          </div>

          <button
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            className={`btn-favorite ${isFavorited ? 'favorited' : ''}`}
          >
            {isFavorited ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
          </button>

          <p className="updated-at">
            Last updated: {new Date(location.lastUpdated).toLocaleDateString()}
          </p>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="map-container">
          <MapContainer center={[location.latitude, location.longitude]} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.latitude, location.longitude]}>
              <Popup>{location.name}</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      <div className="events-list">
        <h2>🎭 Events at {location.name}</h2>
        {events.length > 0 ? (
          <div className="events-grid">
            {events.map(event => (
              <div key={event._id} className="event-item">
                <h3>{event.title}</h3>
                <p><strong>Date:</strong> {event.date}</p>
                <p><strong>Presenter:</strong> {event.presenter}</p>
                {event.description && (
                  <p className="event-description"><strong>Description: </strong>{event.description.substring(0, 2000)}</p>
                )} 
                <br />
              </div>
            ))}
          </div>
        ) : (
          <p>No events available for this venue</p>
        )}
      </div>

      <CommentSection locationId={id} />
    </div>
  );
}

export default LocationDetail;