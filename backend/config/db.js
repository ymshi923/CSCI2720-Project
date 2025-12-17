const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { parseStringPromise } = require('xml2js');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB Connected Successfully');
    
    // Seed initial data if database is empty
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

const URLS = {
  venues: 'https://www.lcsd.gov.hk/datagovhk/event/venues.xml',
  events: 'https://www.lcsd.gov.hk/datagovhk/event/events.xml',
};

const cleanString = (str) => (str || '').toString().trim() || 'N/A';

// used to update the xml file inside data
const updateFile = async (url, file) => {
  try {
    const { data } = await axios.get(url, { timeout: 50000 });
    const hash = crypto.createHash('md5').update(data).digest('hex');
    let save = true;
    try {
      const old = await fs.readFile(file, 'utf8');
      if (crypto.createHash('md5').update(old).digest('hex') === hash) {
         save = false; 
      }
    } catch {}
    
    if (save) {
      await fs.mkdir(DATA_DIRECTORY, { recursive: true });
      await fs.writeFile(file, data);
      console.log(`Updated`);
    } else {
      // console.log(`Updated Already`);
    }
  } catch (e) {
    console.warn(`Cannot get new version`);
  }
};

// Seed initial data
const seedInitialData = async () => {
  console.log('Checking Event & Venues')

  await Promise.all([
    updateFile(URLS.venues, VENUES_FILE),
    updateFile(URLS.events, EVENTS_FILE)
  ]);

  await Location.deleteMany({});
  await Event.deleteMany({});
  
  console.log('Cleared all old data');

  // Create admin user
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
      console.log('✓ Admin, test user created');
  }

  const [venueXml, eventXml] = await Promise.all([
    fs.readFile(VENUES_FILE, 'utf8'),
    fs.readFile(EVENTS_FILE, 'utf8')
  ]);

  const venuesXml = await parseStringPromise(venueXml, { trim: true, explicitArray: false, attrkey: '$' });
  const eventsXml = await parseStringPromise(eventXml, { trim: true, explicitArray: false, attrkey: '$' });

  const venueMap = new Map();
  const venueList = Array.isArray(venuesXml.venues.venue) ? venuesXml.venues.venue : [venuesXml.venues.venue || {}];

  for (const v of venueList) {
    if (v.$.id) {
      venueMap.set(v.$.id, {
        name: cleanString(v.venuee),
        latitude: v.latitude ? parseFloat(v.latitude) : null,
        longitude: v.longitude ? parseFloat(v.longitude) : null,
      });
    }
  }

  const locCache = new Map(); 
  const venueEventCounter = new Map();
  const temp = [];

  const eventList = Array.isArray(eventsXml.events.event)
    ? eventsXml.events.event
    : [eventsXml.events.event || {}];

  for (const e of eventList) {
    const venueId = (e.venueid || '').trim();
    if (!venueId) continue;

    venueEventCounter.set(venueId, (venueEventCounter.get(venueId) || 0) + 1);

    const venue = venueMap.get(venueId);
    if (!venue || venue.latitude === null || venue.longitude === null) {
      continue; 
    }
    // create location
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

    temp.push({
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

  if (temp.length > 0) {
    await Event.insertMany(temp);
    // console.log(`Total: ${temp.length} events`);
  }
  // check event more than 3
  const selectLoc = [...venueEventCounter.entries()]
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([venueId]) => venueId);

  const selectedVenues = selectLoc.map(id => ({
    venueId: id,
    ...venueMap.get(id)
  })).filter(Boolean);

  const unique = [];
  const latLon = new Set();

  for (const venue of selectedVenues) {
    const storeKey = `${venue.latitude}&${venue.longitude}`;

    // check whether have the same lat lon and store in latLon for later checking
    if (!latLon.has(storeKey)) {
      latLon.add(storeKey);
      unique.push(venue);
      // check event number 
      if (unique.length > 10) {
        break;
      }
    }
  }

  let finalVenueIds = unique.map(v => v.venueId);
  const checked = [...venueEventCounter.entries()]
    .filter(([venueId, _]) => !selectLoc.includes(venueId))
    .sort((a, b) => b[1] - a[1]);

  for (const [venueId, count] of checked) {
    if (finalVenueIds.length > 10) break;
    // final checking
    const venue = venueMap.get(venueId);
    const storeKey = `${venue.latitude}&${venue.longitude}`;
    if (!latLon.has(storeKey)) {
      latLon.add(storeKey);
      finalVenueIds.push(venueId);
    }
  }

  const Location10 = finalVenueIds
    .map(id => locCache.get(id))
    .filter(Boolean);

  // Delete other locations and events
  const deletedLocs = await Location.deleteMany({
    _id: { $nin: Location10 }
  });
  const deletedEvents = await Event.deleteMany({
    locationId: { $nin: Location10 }
  });

  // Update eventCount
  for (const locId of Location10) {
    const count = await Event.countDocuments({ locationId: locId });
    await Location.findByIdAndUpdate(locId, { eventCount: count });
  }
  
  const finalVenues = await Location.countDocuments();
  const finalEvents = await Event.countDocuments();

  // console.log(`\nFinal Venues check: ${finalVenues}`);
  // console.log(`Final Total Event: ${finalEvents}`);

}

module.exports = connectDB;


