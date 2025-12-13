import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';
import '../styles/pages.css';

function RandomEventPage() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRandomEvent = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getRandom();
      const newEvent = response.data;
      setEvent(newEvent);
      
      setHistory(prev => [newEvent, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error('Failed to fetch random event:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomEvent();
  }, []);

  const handleAnotherEvent = () => {
    fetchRandomEvent();
  };

  if (!event && !loading) return <div>No event found</div>;

  return (
    <div className="page">
      <h1>🎲 Random Event Picker</h1>
      
      <div className="random-event-container">
        {loading ? (
          <div className="loading">Finding a random event...</div>
        ) : (
          <>
            <div className="current-event">
                <table className="event-table">
                    <tbody>
                        <tr>
                            <td><strong>📅 Date:</strong></td>
                            <td>{event.date}</td>
                        </tr>
                        <tr>
                            <td><strong>📍 Venue:</strong></td>
                            <td>{event.locationId?.name}</td>
                        </tr>
                        <tr>
                            <td><strong>🎤 Presenter:</strong></td>
                            <td>{event.presenter || 'TBA'}</td>
                        </tr>
                        <tr>
                            <td><strong>💰 Price:</strong></td>
                            <td>{event.price || 'Free'}</td>
                        </tr>
                        <tr>
                            <td><strong>👥 Age Limit:</strong></td>
                            <td>{event.ageLimit || 'All ages'}</td>
                        </tr>
                    </tbody>
                </table>
              
              <button onClick={handleAnotherEvent} className="btn-primary">
                🎲 Pick Another Random Event
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RandomEventPage;
