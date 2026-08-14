const express = require('express');
// Triggering GitHub Actions deployment check
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const logger = require('./utils/logger');
const mongoSanitize = require('./middlewares/mongoSanitize');
require('dotenv').config({ path: __dirname + '/.env' });

const path = require('path');
const app = express();
app.set('trust proxy', 1); // Trust first proxy (useful for Vercel/Render)

// 1. Production Config
if (process.env.NODE_ENV === 'production') {
    // Moved trust proxy outside to handle all environments behind Nginx
}

// 2. Middlewares
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'https://sls-management-system.web.app', 'https://serveandlead.org', 'https://www.serveandlead.org', 'https://serveandleadsociety-1fbd7.web.app'] 
        : 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https:", "blob:"],
            "style-src": ["'self'", "https:", "fonts.googleapis.com"],
            "font-src": ["'self'", "https:", "data:", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
            "img-src": ["'self'", "data:", "https:", "blob:", "https://serveandlead.org"],
            "connect-src": ["'self'", "https:", "http://localhost:5000", "ws://localhost:5173", "http://localhost:5173"],
            "frame-src": ["'self'", "https:"],
        },
    },
})); 
app.use(compression()); // Gzip compression
app.use('/api/blogs/upload-image-data', express.json({ limit: '8mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(mongoSanitize);
app.use(cookieParser());

// Logging with IP Anonymization for Production
morgan.token('remote-addr-anon', (req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + '::'; // IPv6
    return ip.split('.').slice(0, 3).join('.') + '.0'; // IPv4
});

const morganFormat = process.env.NODE_ENV === 'production' 
    ? ':remote-addr-anon - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
    : 'dev';

app.use(morgan(morganFormat, {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// Global Rate Limiter
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute
    message: { error: 'Too many requests from this IP. Please wait a minute.' }
});
app.use('/api/', limiter);

// 3. Auth-Specific Rate Limiting (Brute Force Protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts
    message: { error: 'Too many attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);

// Prevent Caching for API Routes (Security)
app.use('/api/', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Serve Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/slsuet')
    .then(async () => {
        console.log('📡 MongoDB Connected');
        const OTP = require('./models/OTP');
        await OTP.syncIndexes().catch((err) => logger.error(`OTP index sync failed: ${err.message}`));
    })
    .catch(err => logger.error(`❌ DB Connection Error: ${err.message}`));

// Setup Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/admin/authAdmin'));
app.use('/api/admin', require('./routes/admin/dashboard'));
app.use('/api/admin', require('./routes/admin/members'));
app.use('/api/admin', require('./routes/admin/logs'));
app.use('/api/admin', require('./routes/admin/backup'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/cert-templates', require('./routes/certTemplateRoutes'));

// Root
app.get('/', (req, res) => res.json({ status: 'active', env: process.env.NODE_ENV }));

// Global Error Handler (Security Hardened)
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    
    logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    
    res.status(statusCode).json({
        error: isProduction && statusCode === 500 
            ? 'Internal Server Error' 
            : err.message || 'An unexpected error occurred'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));


