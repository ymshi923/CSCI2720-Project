import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import '../styles/pages.css';

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    presenter: '',
    locationId: '',
    price: '',
    ageLimit: '',
    url: ''
  });
  const [editForm, setEditForm] = useState({
    title: '',
    date: '',
    description: '',
    presenter: '',
    locationId: '',
    price: '',
    ageLimit: '',
    url: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchLocations();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.events.getAll();
      setEvents(response.data);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await adminAPI.locations.getAll();
      setLocations(response.data);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.locationId) {
      setError('Title, date, and location are required');
      return;
    }

    try {
      await adminAPI.events.create({
        title: formData.title,
        date: formData.date,
        description: formData.description,
        presenter: formData.presenter,
        locationId: formData.locationId,
        price: formData.price || 'Free',
        ageLimit: formData.ageLimit || 'All ages',
        url: formData.url || ''
      });
      setSuccess('Event created successfully');
      setFormData({
        title: '',
        date: '',
        description: '',
        presenter: '',
        locationId: '',
        price: '',
        ageLimit: '',
        url: ''
      });
      setShowForm(false);
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title || '',
      date: event.date || '',
      description: event.description || '',
      presenter: event.presenter || '',
      locationId: event.locationId?._id || event.locationId || '',
      price: event.price || '',
      ageLimit: event.ageLimit || '',
      url: event.url || ''
    });
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      await adminAPI.events.update(editingEvent._id, {
        title: editForm.title,
        date: editForm.date,
        description: editForm.description,
        presenter: editForm.presenter,
        locationId: editForm.locationId,
        price: editForm.price || 'Free',
        ageLimit: editForm.ageLimit || 'All ages',
        url: editForm.url || ''
      });
      setSuccess('Event updated successfully');
      setEditingEvent(null);
      setEditForm({
        title: '',
        date: '',
        description: '',
        presenter: '',
        locationId: '',
        price: '',
        ageLimit: '',
        url: ''
      });
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await adminAPI.events.delete(eventId);
        setSuccess('Event deleted successfully');
        fetchEvents();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete event');
      }
    }
  };

  const getLocationName = (event) => {
    if (typeof event.locationId === 'object' && event.locationId !== null) {
      return event.locationId.name;
    }
    const location = locations.find(l => l._id === event.locationId);
    return location ? location.name : 'Unknown Venue';
  };

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="page">
      <h1>Manage Events</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {!showForm && !editingEvent ? (
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          ➕ Add New Event
        </button>
      ) : showForm ? (
        <form className="admin-form" onSubmit={handleCreateEvent}>
          <h2>Add New Event</h2>

          <div className="form-group">
            <label>Event Title:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter event title"
              required
            />
          </div>

          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Venue:</label>
            <select 
              name="locationId" 
              value={formData.locationId} 
              onChange={handleInputChange}
              required
            >
              <option value="">Select Venue</option>
              {locations.map(location => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter event description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Presenter/Organization:</label>
            <input
              type="text"
              name="presenter"
              value={formData.presenter}
              onChange={handleInputChange}
              placeholder="Enter presenter/organization"
            />
          </div>

          <div className="form-group">
            <label>Price:</label>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="e.g., Free, $50, $100-200"
            />
          </div>

          <div className="form-group">
            <label>Age Limit:</label>
            <input
              type="text"
              name="ageLimit"
              value={formData.ageLimit}
              onChange={handleInputChange}
              placeholder="e.g., All ages, 18+, 12+"
            />
          </div>

          <div className="form-group">
            <label>URL:</label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              placeholder="https://example.com/event"
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-primary">Save Event</button>
            <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      ) : null}

      {editingEvent && (
        <form className="admin-form" onSubmit={handleUpdateEvent}>
          <h2>Edit Event</h2>

          <div className="form-group">
            <label>Event Title:</label>
            <input
              type="text"
              name="title"
              value={editForm.title}
              onChange={handleEditInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={editForm.date}
              onChange={handleEditInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Venue:</label>
            <select 
              name="locationId" 
              value={editForm.locationId} 
              onChange={handleEditInputChange}
              required
            >
              <option value="">Select Venue</option>
              {locations.map(location => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={editForm.description}
              onChange={handleEditInputChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Presenter/Organization:</label>
            <input
              type="text"
              name="presenter"
              value={editForm.presenter}
              onChange={handleEditInputChange}
            />
          </div>

          <div className="form-group">
            <label>Price:</label>
            <input
              type="text"
              name="price"
              value={editForm.price}
              onChange={handleEditInputChange}
            />
          </div>

          <div className="form-group">
            <label>Age Limit:</label>
            <input
              type="text"
              name="ageLimit"
              value={editForm.ageLimit}
              onChange={handleEditInputChange}
            />
          </div>

          <div className="form-group">
            <label>URL:</label>
            <input
              type="url"
              name="url"
              value={editForm.url}
              onChange={handleEditInputChange}
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-primary">Update Event</button>
            <button
              type="button"
              className="btn-delete"
              style = {{height: '30px'}}
              onClick={() => {
                setEditingEvent(null);
                setEditForm({
                  title: '',
                  date: '',
                  presenter: '',
                  locationId: '',
                  price: '',
                  ageLimit: '',
                  url: ''
                });
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="admin-table-container">
        <h2>All Events ({events.length})</h2>
        {events.length === 0 ? (
          <p>No events found</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Presenter</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event._id}>
                  <td>{event.title}</td>
                  <td>{event.date}</td>
                  <td>{getLocationName(event)}</td>
                  <td>{event.presenter}</td>
                  <td>{event.price || 'Free'}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => handleEditEvent(event)}
                      style={{ marginRight: '8px' }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDeleteEvent(event._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminEvents;
