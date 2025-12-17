const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { parseStringPromise } = require('xml2js');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB Connected Successfully');
    await seedInitialData();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const User = require('../models/User');
const Location = require('../models/Location');
const Event = require('../models/Event');
const DATA_DIRECTORY = path.join(__dirname, '..', 'data');
const VENUES_FILE = path.join(DATA_DIRECTORY, 'venues.xml');
const EVENTS_FILE = path.join(DATA_DIRECTORY, 'events.xml');

const cleanString = (str) => (str || '').toString().trim() || 'N/A';

const seedInitialData = async () => {
  console.log('Starting import...');

  await Location.deleteMany({});
  await Event.deleteMany({});
  
  if (!(await User.findOne({ username: 'admin' }))) {
    await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        email: 'admin@culturalvenues.hk'
    });
    await User.create({
        username: 'testuser',
        password: 'testuser123',
        role: 'user',
        email: 'user@culturalvenues.hk'
    });
  }

  const [venueXml, eventXml] = await Promise.all([
    fs.readFile(VENUES_FILE, 'utf8'),
    fs.readFile(EVENTS_FILE, 'utf8')
  ]);

  const venuesXml = await parseStringPromise(venueXml, { trim: true, explicitArray: false, attrkey: '$' });
  const eventsXml = await parseStringPromise(eventXml, { trim: true, explicitArray: false, attrkey: '$' });

  const venueMap = new Map();
  const seenCoordinates = new Set();
  const venueList = Array.isArray(venuesXml.venues.venue) ? venuesXml.venues.venue : [venuesXml.venues.venue || {}];

  for (const v of venueList) {
    if (v.$.id) {
      const lat = v.latitude ? parseFloat(v.latitude) : null;
      const lng = v.longitude ? parseFloat(v.longitude) : null;
      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) continue;

      const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      if (seenCoordinates.has(coordKey)) continue;

      seenCoordinates.add(coordKey);
      venueMap.set(v.$.id, {
        name: cleanString(v.venuee),
        latitude: lat,
        longitude: lng,
      });
    }
  }

  const locCache = new Map(); 
  const venueEventCounter = new Map();
  const tempEvents = [];

  const eventList = Array.isArray(eventsXml.events.event)
    ? eventsXml.events.event
    : [eventsXml.events.event || {}];

  for (const e of eventList) {
    const venueId = (e.venueid || '').trim();
    if (!venueId) continue;
    const venue = venueMap.get(venueId);
    if (!venue) continue;

    venueEventCounter.set(venueId, (venueEventCounter.get(venueId) || 0) + 1);

    if (!locCache.has(venueId)) {
      const loc = await Location.create({
        venueId,
        name: venue.name,
        latitude: venue.latitude,
        longitude: venue.longitude,
        lastUpdated: new Date(),
        eventCount: 0,
      });
      locCache.set(venueId, loc._id);
    }

    tempEvents.push({
      locationId: locCache.get(venueId),
      eventId: cleanString(e.$.id),
      title: cleanString(e.titlee),
      date: cleanString(e.predateE) || 'Not Confirmed',
      description: cleanString(e.desce),
      presenter: cleanString(e.presenterorge),
      price: cleanString(e.pricee),
      ageLimit: cleanString(e.agelimite),
      url: cleanString(e.urle),
    });
  }

  if (tempEvents.length > 0) {
    await Event.insertMany(tempEvents);
  }

  const allVenueIds = Array.from(locCache.keys());
  const sortedVenueIds = allVenueIds.sort((a, b) => {
    return (venueEventCounter.get(b) || 0) - (venueEventCounter.get(a) || 0);
  });

  const select10LocIds = sortedVenueIds.slice(0, 10);
  const Location10MongoIds = select10LocIds.map(id => locCache.get(id));

  await Location.deleteMany({ _id: { $nin: Location10MongoIds } });
  await Event.deleteMany({ locationId: { $nin: Location10MongoIds } });

  for (const locId of Location10MongoIds) {
    const count = await Event.countDocuments({ locationId: locId });
    await Location.findByIdAndUpdate(locId, { eventCount: count });
  }
  
  console.log(`✓ Seed Finished. Venues: ${await Location.countDocuments()}`);
}

module.exports = connectDB;


