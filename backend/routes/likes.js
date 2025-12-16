const express = require('express');
const Location = require('../models/Location');
const Like = require('../models/Like');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/:locationId', auth, async (req, res) => {
  try {
    const location = await Location.findById(req.params.locationId);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    const existingLike = await Like.findOne({
      userId: req.user.userId,
      locationId: req.params.locationId
    });
    
    if (existingLike) {
      return res.status(400).json({ error: 'Already liked' });
    }
    
    const like = new Like({
      userId: req.user.userId,
      locationId: req.params.locationId
    });
    
    await like.save();
    
    location.favoriteCount = (location.favoriteCount || 0) + 1;
    await location.save();
    
    res.json({ 
      success: true, 
      favoriteCount: location.favoriteCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:locationId', auth, async (req, res) => {
  try {
    const location = await Location.findById(req.params.locationId);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    const like = await Like.findOneAndDelete({
      userId: req.user.userId,
      locationId: req.params.locationId
    });
    
    if (!like) {
      return res.status(404).json({ error: 'Like not found' });
    }
    
    if (location.favoriteCount > 0) {
      location.favoriteCount -= 1;
      await location.save();
    }
    
    res.json({ 
      success: true, 
      favoriteCount: location.favoriteCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check/:locationId', auth, async (req, res) => {
  try {
    const like = await Like.findOne({
      userId: req.user.userId,
      locationId: req.params.locationId
    });
    
    res.json({ isLiked: !!like });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
