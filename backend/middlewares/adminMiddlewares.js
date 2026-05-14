const asyncHandler = require('./asyncHandler');

const isAdmin = asyncHandler(async (req, res, next) => {
    // authMiddleware already verified the token and put it in req.user
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Superuser')) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Administrative authority required.' });
    }
});

const isSuperuser = (req, res, next) => {
    if (req.user && req.user.role === 'Superuser') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Superuser authority required.' });
    }
};

module.exports = { isAdmin, isSuperuser };
