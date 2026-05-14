/**
 * Custom NoSQL Injection Sanitizer
 * Recursively removes any keys starting with '$' from req.body, req.query, and req.params
 */
const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
            if (key.startsWith('$')) {
                delete obj[key];
            } else if (obj[key] && typeof obj[key] === 'object') {
                sanitize(obj[key]);
            }
        });
    }
};

const mongoSanitizeMiddleware = (req, res, next) => {
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);
    next();
};

module.exports = mongoSanitizeMiddleware;
