const express = require('express');
// Triggering GitHub Actions deployment check
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const logger = require('./utils/logger');
require('dotenv').config({ path: __dirname + '/.env' });

const path = require('path');
const app = express();

// 1. Production Config
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // Trust first proxy (useful for Vercel/Render)
}

// 2. Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); 
app.use(compression()); // Gzip compression
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// app.use(mongoSanitize()); // Disabled due to Express 5 req.query getter issue
app.use(cookieParser());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'https://sls-management-system.web.app', 'https://serveandlead.org', 'https://www.serveandlead.org'] 
        : 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// Global Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 10000, // Developer bypass
    message: { error: 'Too many requests from this IP.' }
});
app.use('/api/', limiter);

// Serve Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/slsuet')
    .then(() => console.log('📡 MongoDB Connected'))
    .catch(err => logger.error(`❌ DB Connection Error: ${err.message}`));

// Setup Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// Root
app.get('/', (req, res) => res.json({ status: 'active', env: process.env.NODE_ENV }));

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));


