# Location & IP Tracker - Educational Project

A comprehensive web application for tracking user location and IP addresses through deceptive links. **This is for educational purposes only.**

## ⚠️ Important Notice

This application is designed for educational and research purposes only. Always ensure you have proper consent before tracking users. Respect privacy laws and regulations in your jurisdiction.

## 🚀 Features

- **Fake Link Generation**: Create deceptive links that look legitimate
- **Location Tracking**: Automatic GPS location capture (if user allows)
- **IP Address Detection**: Capture user's IP address and location data
- **Browser Detection**: Identify browser type and operating system
- **Real-time Dashboard**: Live tracking data with Socket.io
- **Data Storage**: MongoDB for persistent data storage
- **Admin Panel**: Comprehensive dashboard for viewing collected data

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time updates
- **Helmet** for security headers
- **CORS** for cross-origin requests

### Frontend
- **HTML5 Geolocation API** for location tracking
- **Bootstrap 5** for responsive UI
- **Font Awesome** for icons
- **Socket.io Client** for real-time updates

### Key APIs Used
- **HTML5 Geolocation API** - For GPS coordinates
- **IPAPI.co** - For IP-based location data
- **Browser Detection** - User agent parsing

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd location-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install MongoDB**
   - Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Start MongoDB service

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the application**
   - Main app: `http://localhost:3000`
   - Admin dashboard: `http://localhost:3000/admin`

## 🎯 How It Works

### 1. Link Generation
- User enters a target URL and fake title
- System generates a unique tracking link
- Link appears legitimate but contains tracking code

### 2. Tracking Process
When someone clicks the fake link:
1. **Loading page** appears (3-second delay)
2. **Location request** - Browser asks for GPS permission
3. **IP detection** - Server captures IP address
4. **Browser detection** - Identifies browser and OS
5. **Data collection** - All data sent to server
6. **Redirect** - User redirected to original URL

### 3. Data Collection
- **GPS Coordinates** (latitude/longitude with accuracy)
- **IP Address** and location (city/country)
- **Browser Information** (Chrome, Firefox, Safari, etc.)
- **Operating System** (Windows, macOS, Linux, etc.)
- **Timestamp** and click count

### 4. Admin Dashboard
- **Real-time updates** via Socket.io
- **Statistics** - Total clicks, unique IPs, locations found
- **Data table** - All tracking data with timestamps
- **Link management** - View and copy generated links

## 🔧 Configuration

### Environment Variables
Create a `.env` file:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/location_tracker
```

### MongoDB Setup
```bash
# Start MongoDB
mongod

# Or with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 📊 Data Structure

### Tracking Data Schema
```javascript
{
  linkId: String,           // Unique link identifier
  ip: String,              // User's IP address
  userAgent: String,        // Browser user agent
  location: {
    latitude: Number,       // GPS latitude
    longitude: Number,      // GPS longitude
    accuracy: Number        // Location accuracy in meters
  },
  timestamp: Date,          // When data was collected
  city: String,            // IP-based city
  country: String,         // IP-based country
  browser: String,         // Detected browser
  os: String              // Detected operating system
}
```

## 🎨 Customization

### Styling
- Modify CSS in `public/index.html` and `public/admin.html`
- Bootstrap 5 classes for responsive design
- Custom gradients and animations

### Tracking Behavior
- Adjust delay in `public/track.html` (currently 3 seconds)
- Modify location accuracy settings
- Add additional data collection

### Database
- Change MongoDB connection string
- Modify schemas in `server.js`
- Add data validation

## 🔒 Security Considerations

- **No authentication** - Add user authentication for production
- **Rate limiting** - Implement to prevent abuse
- **Data encryption** - Encrypt sensitive data
- **HTTPS** - Use SSL certificates in production
- **Input validation** - Validate all user inputs

## 📈 Advanced Features

### Potential Enhancements
- **Google Maps integration** for visual location display
- **Email notifications** for new tracking data
- **Data export** (CSV, JSON)
- **User management** and authentication
- **Analytics charts** and graphs
- **Geofencing** capabilities

### API Integrations
- **Google Maps API** for map visualization
- **Weather API** for location-based weather
- **Social media APIs** for additional data
- **Analytics services** for advanced tracking

## 🚨 Legal and Ethical Guidelines

### Always Ensure:
- ✅ **Explicit consent** from users
- ✅ **Clear privacy policy** disclosure
- ✅ **Compliance** with local laws (GDPR, CCPA, etc.)
- ✅ **Data protection** and security measures
- ✅ **Transparent** data collection practices

### Never Use For:
- ❌ **Stalking** or harassment
- ❌ **Unauthorized** surveillance
- ❌ **Malicious** purposes
- ❌ **Privacy violations**

## 🐛 Troubleshooting

### Common Issues
1. **MongoDB connection failed**
   - Ensure MongoDB is running
   - Check connection string

2. **Location not detected**
   - User denied location permission
   - HTTPS required for geolocation

3. **Socket.io connection issues**
   - Check CORS settings
   - Verify Socket.io client script

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start
```

## 📝 License

This project is for educational purposes only. Use responsibly and in compliance with applicable laws and regulations.

## 🤝 Contributing

This is an educational project. Contributions should focus on:
- Security improvements
- Educational documentation
- Ethical use cases
- Privacy enhancements

---

**Remember: Always respect user privacy and obtain proper consent before tracking anyone.**
