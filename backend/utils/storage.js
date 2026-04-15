const multer = require('multer');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
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
            // acl: 'public-read', // Removed to avoid 403/500 errors on buckets with "Block Public Access" enabled
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
            if (extname || mimetype) return cb(null, true);
            cb(new Error(`Only images (jpg, png, webp) are allowed. Detected: Ext=${path.extname(file.originalname)}, Type=${file.mimetype}`));
        }
    });
};

/**
 * Delete a file from either AWS S3 or Local Storage
 */
const deleteFile = async (fileUrl) => {
    if (!fileUrl) return;

    try {
        // 1. Detect if it's an S3 URL
        // Example: https://bucket.s3.region.amazonaws.com/folder/file.jpg
        const isS3 = fileUrl.includes('.amazonaws.com');

        if (isS3) {
            // Extract the Key from the full URL
            // The key starts after the '.com/' part
            const domainSplit = fileUrl.split('.amazonaws.com/');
            if (domainSplit.length < 2) return;
            
            const key = domainSplit[1];
            console.log(`🗑️ Deleting from S3 Key: ${key}`);

            const deleteParams = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: key
            };

            await s3.send(new DeleteObjectCommand(deleteParams));
        } else {
            // 2. Handle Local File Deletion
            // Expected Relative Path like /uploads/general/filename.jpg
            const relativePath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
            const absolutePath = path.join(__dirname, '..', ...relativePath.split('/'));
            
            if (fs.existsSync(absolutePath)) {
                console.log(`📁 Deleting Local File: ${absolutePath}`);
                fs.unlinkSync(absolutePath);
            }
        }
    } catch (error) {
        console.error(`⚠️ Failed to delete file: ${fileUrl}`, error.message);
        // We log the error but don't throw, allowing DB deletion to proceed
    }
};

module.exports = { createUpload, getFileUrl, deleteFile };
