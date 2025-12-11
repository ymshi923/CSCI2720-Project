const express = require('express');
const User = require('../models/User');
const Location = require('../models/Location');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Admin: Get all users
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Create user
router.post('/users', auth, adminAuth, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = new User({ username, password, role: role || 'user' });
    await user.save();
    
    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update user
router.put('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username) user.username = username;
    if (typeof role === 'string') user.role = role;
    if (password) {
      user.password = password; // pre-save hook will hash
    }

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete user
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all locations
router.get('/locations', auth, adminAuth, async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Create location
router.post('/locations', auth, adminAuth, async (req, res) => {
  try {
    const { venueId, name, latitude, longitude } = req.body;
    
    if (!venueId || !name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    const location = new Location({
      venueId,
      name,
      latitude,
      longitude
    });
    
    await location.save();
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update location
router.put('/locations/:id', auth, adminAuth, async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete location
router.delete('/locations/:id', auth, adminAuth, async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    // Delete associated events
    await Event.deleteMany({ locationId: req.params.id });
    
    res.json({ message: 'Location and associated events deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Dashboard stats
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const locationCount = await Location.countDocuments();
    const eventCount = await Event.countDocuments();
    
    res.json({
      users: userCount,
      locations: locationCount,
      events: eventCount,
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
