const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');

/**
 * AWS S3 Client Configuration
 */
const s3 = new S3Client({
    region: process.env.AWS_REGION || 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

/**
 * Hybrid Storage Utility
 * Switches between Local Disk Storage and AWS S3
 * based on the presence of AWS_S3_BUCKET_NAME in environment variables.
 */

const getStorage = (subfolder = 'general') => {
    // Check if AWS S3 is configured
    const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET_NAME;

    if (useS3) {
        console.log(`☁️ Using AWS S3 Storage for: ${subfolder}`);
        return multerS3({
            s3: s3,
            bucket: process.env.AWS_S3_BUCKET_NAME,
            acl: 'public-read', // Ensure files are publicly readable
            key: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
                cb(null, `${subfolder}/${uniqueSuffix}-${cleanName}`);
            }
        });
    } else {
        // Fallback to Local Disk Storage
        console.log(`📁 Using Local Disk Storage for: ${subfolder}`);
        const uploadDir = path.join(__dirname, '..', 'uploads', subfolder);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        return multer.diskStorage({
            destination: (req, file, cb) => cb(null, uploadDir),
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
                cb(null, `${uniqueSuffix}-${cleanName}`);
            }
        });
    }
};

/**
 * Helper to generate the correct Public URL for an uploaded file
 */
const getFileUrl = (file, subfolder = 'general') => {
    if (!file) return '';
    
    // If S3 is used, multer-s3 provides the link in file.location
    if (file.location) {
        return file.location;
    }
    
    // Fallback for Local Storage
    return `/uploads/${subfolder}/${file.filename}`;
};

const createUpload = (subfolder) => {
    return multer({
        storage: getStorage(subfolder),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: (req, file, cb) => {
            const filetypes = /jpeg|jpg|png|webp/;
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = filetypes.test(file.mimetype);
            if (extname && mimetype) return cb(null, true);
            cb(new Error('Only images (jpg, png, webp) are allowed'));
        }
    });
};

module.exports = { createUpload, getFileUrl };
