import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, password, email) => api.post('/auth/register', { username, password, email }),
  verify: () => api.get('/auth/verify')
};

// Location endpoints
export const locationsAPI = {
  getAll: (sort = 'name', filters = {}) => api.get('/locations', { params: { sort, ...filters } }),
  getOne: (id) => api.get(`/locations/${id}`),
  search: (q) => api.get('/locations/search/query', { params: { q } })
};

// Events endpoints
export const eventsAPI = {
  getByLocation: (locationId) => api.get(`/events/location/${locationId}`),
  getRandom: () => api.get('/events/random/pick'),
  create: (event) => api.post('/events', event),
  update: (id, event) => api.put(`/events/${id}`, event),
  delete: (id) => api.delete(`/events/${id}`)
};

//Likes endpoints
export const likesAPI = {
  check: (locationId) => api.get(`/locations/${locationId}/like-status`),
  like: (locationId) => api.post(`/locations/${locationId}/like`),
  unlike: (locationId) => api.post(`/locations/${locationId}/unlike`)
};

// Comments endpoints
export const commentsAPI = {
  getByLocation: (locationId) => api.get(`/comments/location/${locationId}`),
  add: (locationId, text, rating) => api.post('/comments', { locationId, text, rating }),
  delete: (id) => api.delete(`/comments/${id}`)
};

// Favorites endpoints
export const favoritesAPI = {
  getAll: () => api.get('/favorites'),
  add: (locationId) => api.post('/favorites', { locationId }),
  remove: (locationId) => api.delete(`/favorites/${locationId}`),
  check: (locationId) => api.get(`/favorites/check/${locationId}`)
};

// Admin endpoints
export const adminAPI = {
  users: {
    getAll: () => api.get('/admin/users'),
    create: (user) => api.post('/admin/users', user),
    update: (id, user) => api.put(`/admin/users/${id}`, user),
    delete: (id) => api.delete(`/admin/users/${id}`)
  },
  locations: {
    getAll: () => api.get('/admin/locations'),
    create: (location) => api.post('/admin/locations', location),
    update: (id, location) => api.put(`/admin/locations/${id}`, location),
    delete: (id) => api.delete(`/admin/locations/${id}`)
  },
  events: {
    getAll: () => api.get('/admin/events'),
    create: (event) => api.post('/admin/events', event),
    update: (id, event) => api.put(`/admin/events/${id}`, event),
    delete: (id) => api.delete(`/admin/events/${id}`)
  },
  stats: () => api.get('/admin/stats')
};

export default api;
