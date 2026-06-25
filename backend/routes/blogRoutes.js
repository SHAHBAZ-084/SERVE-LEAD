const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const Member = require('../models/Member');
const authMiddleware = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const { createUpload, getFileUrl, deleteFile } = require('../utils/storage');

const isAdmin = asyncHandler(async (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Superuser')) {
        const user = await Member.findById(req.user.memberId).lean();
        if (!user || user.status === 'blocked') {
            return res.status(403).json({ error: 'Access denied. Account is blocked.' });
        }
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin only.' });
    }
});

const upload = createUpload('blogs');

const handleSingleImageUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Each image must be 5MB or smaller.' });
            }
            return res.status(400).json({ error: err.message || 'Image upload failed.' });
        }
        next();
    });
};

const normalizeImages = (images) => {
    if (!Array.isArray(images)) return [];
    return images
        .filter((img) => img && img.url)
        .map((img) => ({ url: img.url, caption: img.caption || '' }));
};

// GET all published blogs (Public)
router.get('/', asyncHandler(async (req, res) => {
    const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 }).lean();
    res.json(blogs);
}));

// GET all blogs including drafts (Admin)
router.get('/admin/all', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
    res.json(blogs);
}));

// POST upload a single blog image (Admin Only)
router.post('/upload-image', authMiddleware, isAdmin, handleSingleImageUpload, asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded.' });
    }
    res.json({ url: getFileUrl(req.file, 'blogs') });
}));

// GET single blog (Public)
router.get('/:id', asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id).lean();
    if (!blog) return res.status(404).json({ error: 'Blog post not found.' });
    res.json(blog);
}));

// POST Create blog (Admin Only)
router.post('/', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { title, description, published, images } = req.body;
    const normalizedImages = normalizeImages(images);

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required.' });
    }
    if (normalizedImages.length === 0) {
        return res.status(400).json({ error: 'Please upload at least one image.' });
    }

    const newBlog = new Blog({
        title,
        description,
        published: published !== undefined ? (published === 'true' || published === true) : true,
        images: normalizedImages,
    });

    await newBlog.save();
    res.status(201).json(newBlog);
}));

// PUT Update blog (Admin Only)
router.put('/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });

    const { title, description, published, images } = req.body;

    if (title !== undefined) blog.title = title;
    if (description !== undefined) blog.description = description;
    if (published !== undefined) {
        blog.published = published === 'true' || published === true;
    }

    if (images !== undefined) {
        const normalizedImages = normalizeImages(images);
        if (normalizedImages.length === 0) {
            return res.status(400).json({ error: 'A blog must have at least one image.' });
        }

        const imagesToDelete = blog.images.filter(
            (img) => !normalizedImages.find((ki) => ki.url === img.url)
        );
        for (const img of imagesToDelete) {
            await deleteFile(img.url);
        }
        blog.images = normalizedImages;
    }

    await blog.save();
    res.json(blog);
}));

// DELETE Blog (Admin Only)
router.delete('/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });

    for (const img of blog.images) {
        await deleteFile(img.url);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog post and images deleted successfully.' });
}));

module.exports = router;
