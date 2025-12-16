const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

likeSchema.index({ userId: 1, locationId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
