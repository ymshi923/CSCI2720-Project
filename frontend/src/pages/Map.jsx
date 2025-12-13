import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationsAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import '../styles/pages.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function Map() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await locationsAPI.getAll('name');
      setLocations(response.data);
    } catch (err) {
      setError('Failed to load locations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading map...</div>;

  const centerLat = locations.length > 0
    ? locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length
    : 22.3;
  const centerLng = locations.length > 0
    ? locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length
    : 114.2;

  return (
    <div className="page">
      <h1>🗺️ Venue Map</h1>

      {error && <div className="error-message">{error}</div>}

      <div style={{ height: '600px', borderRadius: '8px', overflow: 'hidden' }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={12}
          style={{ height: '70vh', borderRadius: '8px' }}
          scrollWheelZoom={true}
          dragging={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map(location => (
            <Marker key={location._id} position={[location.latitude, location.longitude]}>
              <Popup>
                <div>
                  <h3>{location.name}</h3>
                  <p>{location.eventCount} events</p>
                  <button
                    onClick={() => navigate(`/location/${location._id}`)}
                    className="btn-primary"
                    style={{ marginTop: '10px' }}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{ marginTop: '20px' }}>
        <p>Click on any marker to see venue details and navigate to the location page.</p>
      </div>
    </div>
  );
}

export default Map;
