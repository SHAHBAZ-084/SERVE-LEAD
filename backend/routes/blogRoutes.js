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

// GET all published blogs (Public)
router.get('/', asyncHandler(async (req, res) => {
    const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 }).lean();
    res.json(blogs);
}));

// GET single blog (Public)
router.get('/:id', asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id).lean();
    if (!blog) return res.status(404).json({ error: 'Blog post not found.' });
    res.json(blog);
}));

// POST Create blog (Admin Only)
router.post('/', authMiddleware, isAdmin, upload.array('images', 10), asyncHandler(async (req, res) => {
    const { title, description, published, captions } = req.body;
    
    // Parse captions if sent as a JSON string or handle as array
    let parsedCaptions = [];
    try {
        parsedCaptions = typeof captions === 'string' ? JSON.parse(captions) : captions || [];
    } catch (e) {
        parsedCaptions = [];
    }

    const images = req.files ? req.files.map((file, index) => ({
        url: getFileUrl(file, 'blogs'),
        caption: parsedCaptions[index] || ""
    })) : [];

    const newBlog = new Blog({
        title,
        description,
        published: published !== undefined ? (published === 'true' || published === true) : true,
        images
    });

    await newBlog.save();
    res.status(201).json(newBlog);
}));

// PUT Update blog (Admin Only)
router.put('/:id', authMiddleware, isAdmin, upload.array('images', 10), asyncHandler(async (req, res) => {
    const { title, description, published, captions, existingImages } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });

    // Handle existing images (to keep)
    let keptImages = [];
    try {
        keptImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages || [];
    } catch (e) {
        keptImages = [];
    }

    // Identify images to delete from storage
    const imagesToDelete = blog.images.filter(img => !keptImages.find(ki => ki.url === img.url));
    for (const img of imagesToDelete) {
        await deleteFile(img.url);
    }

    // Handle new images
    let parsedCaptions = [];
    try {
        parsedCaptions = typeof captions === 'string' ? JSON.parse(captions) : captions || [];
    } catch (e) {
        parsedCaptions = [];
    }

    const newImages = req.files ? req.files.map((file, index) => ({
        url: getFileUrl(file, 'blogs'),
        caption: parsedCaptions[index] || ""
    })) : [];

    blog.title = title || blog.title;
    blog.description = description || blog.description;
    blog.published = published !== undefined ? (published === 'true' || published === true) : blog.published;
    blog.images = [...keptImages, ...newImages];

    await blog.save();
    res.json(blog);
}));

// DELETE Blog (Admin Only)
router.delete('/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found.' });

    // Delete all associated images
    for (const img of blog.images) {
        await deleteFile(img.url);
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog post and images deleted successfully.' });
}));

module.exports = router;
