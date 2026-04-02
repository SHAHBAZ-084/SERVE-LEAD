const multer = require('multer');
const { MulterGoogleCloudStorage } = require('multer-cloud-storage');
const path = require('path');
const fs = require('fs');

/**
 * Hybrid Storage Utility
 * Switches between Local Disk Storage and Google Cloud Storage (GCS)
 * based on the presence of GCS_BUCKET_NAME in environment variables.
 */

const getStorage = (subfolder = 'general') => {
    // Check if GCS is configured
    const useGCS = process.env.GCS_BUCKET_NAME && process.env.GCS_PROJECT_ID;

    if (useGCS) {
        console.log(`☁️ Using Google Cloud Storage for: ${subfolder}`);
        return new MulterGoogleCloudStorage({
            bucket: process.env.GCS_BUCKET_NAME,
            projectId: process.env.GCS_PROJECT_ID,
            // keyFilename is optional if running on Cloud Run with IAM roles, 
            // but needed for local development if GOOGLE_APPLICATION_CREDENTIALS is not set globally.
            keyFilename: process.env.GCP_KEY_FILE || null, 
            destination: subfolder,
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
                cb(null, `${uniqueSuffix}-${cleanName}`);
            },
            autoRetry: true,
            maxRetries: 3
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
    
    // If GCS is used, multer-cloud-storage usually provides the link in file.link or file.path
    if (file.link || (file.path && file.path.startsWith('http'))) {
        return file.link || file.path;
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
