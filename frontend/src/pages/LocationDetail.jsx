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
          <h2>{location.name}</h2>
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
          <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={16}
            scrollWheelZoom={false}
            dragging={false}
            doubleClickZoom={false}
            touchZoom={false}
            boxZoom={false}
            keyboard={false}
            zoomControl={false}
            style={{
              height: '300px',
              width: '100%',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
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

      <div className="events-table-container">
        <h2>🎭 Events at {location.name}</h2>
        {events.length > 0 ? (
          <div className="table-responsive">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Presenter</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Age Limit</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event._id} className="event-row">
                    <td className="event-title">{event.title}</td>
                    <td className="event-date">{event.date}</td>
                    <td className="event-presenter">{event.presenter || '-'}</td>
                    <td className="event-description">
                      {event.description ? (
                        <div className="description-container">
                          {event.description.length > 100 ? (
                            <>
                              {event.description.substring(0, 100)}...
                              <span className="show-more-btn" onClick={() => {
                                const descElement = document.querySelector(`#desc-${event._id}`);
                                if (descElement) {
                                  descElement.textContent = event.description;
                                  descElement.parentElement.querySelector('.show-more-btn').style.display = 'none';
                                  descElement.parentElement.querySelector('.show-less-btn').style.display = 'inline';
                                }
                              }}>Show more</span>
                              <span className="show-less-btn" style={{display: 'none'}} onClick={() => {
                                const descElement = document.querySelector(`#desc-${event._id}`);
                                if (descElement) {
                                  descElement.textContent = event.description.substring(0, 100) + '...';
                                  descElement.parentElement.querySelector('.show-more-btn').style.display = 'inline';
                                  descElement.parentElement.querySelector('.show-less-btn').style.display = 'none';
                                }
                              }}>Show less</span>
                            </>
                          ) : event.description}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="event-price">{event.price || 'Free'}</td>
                    <td className="event-age-limit">{event.ageLimit || 'All ages'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-events">No events available for this venue</p>
        )}
      </div>

      <CommentSection locationId={id} />
    </div>
  );
}

export default LocationDetail;
