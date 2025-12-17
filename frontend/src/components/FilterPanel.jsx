import React, { useState } from 'react';
import '../styles/components.css';

function FilterPanel({ locations, onFilter, userLat, userLng, onUserLocationChange }) {
  const [keyword, setKeyword] = useState('');
  const [distance, setDistance] = useState(30);
  const [selectedArea, setSelectedArea] = useState('');

  const getAreaFromName = (locationName) => {
    const name = locationName.toLowerCase();
    
    if (name.includes('central') || name.includes('city hall')) {
      return 'Central and Western';
    }
    if (name.includes('cultural centre')) {
      return 'Yau Tsim Mong';
    }
    if (name.includes('film archive')) {
      return 'Wan Chai';
    }
    if (name.includes('ko shan')) {
      return 'Kowloon City';
    }
    if (name.includes('ngau chi wan')) {
      return 'Wong Tai Sin';
    }
    if (name.includes('north district')) {
      return 'North';
    }
    if (name.includes('sha tin')) {
      return 'Sha Tin';
    }
    if (name.includes('tai po')) {
      return 'Tai Po';
    }
    if (name.includes('tuen mun')) {
      return 'Tuen Mun';
    }
    if (name.includes('yuen long')) {
      return 'Yuen Long';
    }
    
    return 'Central and Western';
  };

  const areas = [
    'Central and Western',
    'Yau Tsim Mong',
    'Wan Chai',
    'Kowloon City',
    'Wong Tai Sin',
    'North',
    'Sha Tin',
    'Tai Po',
    'Tuen Mun',
    'Yuen Long'
  ];

  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleFilter = () => {
    let filtered = locations.map(loc => ({
      ...loc,
      area: loc.area || getAreaFromName(loc.name)
    }));

    filtered = filtered.filter(loc => loc.eventCount > 0);

    if (keyword) {
      filtered = filtered.filter(loc =>
        loc.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    if (selectedArea) {
      filtered = filtered.filter(loc => loc.area === selectedArea);
    }

    if (distance < 30) { 
      filtered = filtered.filter(loc => {
        const dist = calculateHaversineDistance(
          userLat, 
          userLng, 
          loc.latitude, 
          loc.longitude
        );
        return dist <= distance;
      });
    }

    onFilter(filtered);
  };

  React.useEffect(() => {
    handleFilter();
  }, [keyword, distance, selectedArea, locations]);

  const handleDistanceChange = (e) => {
    const value = parseInt(e.target.value);
    setDistance(value);
  };

  return (
    <aside className="filter-panel">
      <h3>🔍 Filter</h3>

      <div className="filter-group">
        <label>Keyword Search</label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search venues..."
        />
      </div>

      <div className="filter-group">
        <label>Area District</label>
        <select 
          value={selectedArea} 
          onChange={(e) => setSelectedArea(e.target.value)}
        >
          <option value="">All Districts</option>
          {areas.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Distance Filter (km)</label>
        <div className="distance-slider-container">
          <input
            type="range"
            min="1"
            max="30"
            value={distance}
            onChange={handleDistanceChange}
            className="distance-slider"
          />
        </div>
        <p className="distance-display">{distance} km from your location</p>
      </div>

      <button onClick={() => {
        setKeyword('');
        setDistance(30);
        setSelectedArea('');
      }} className="btn-secondary" style={{height: '18px', width: '150px'}}>
        Reset Filters
      </button>
    </aside>
  );
}

export default FilterPanel;

