const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  eventId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    index: true
  },
  date: {
    type: String,
    required: [true, 'Event date is required']
  },
  description: {
    type: String,
    default: ''
  },
  presenter: {
    type: String,
    default: ''
  },
  price: {
    type: String,
    default: 'Free'
  },
  ageLimit: {
    type: String,
    default: 'All ages'
  },
  url: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);
