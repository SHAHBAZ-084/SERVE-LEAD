const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Get token from Cookie FIRST (High security), then fallback to Authorization header
    const token = req.cookies?.jwt || req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            ...decoded,
            memberId: decoded.memberId || decoded.id || decoded._id
        };
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        res.status(401).json({ error: 'Invalid or expired session. Please re-authenticate.' });
    }
};

