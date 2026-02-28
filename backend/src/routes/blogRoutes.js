const express = require('express');
const router = express.Router();
const {
    getBlogs,
    getBlogById,
    createBlog,
    deleteBlog
} = require('../controllers/blogController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getBlogs)
    .post(protect, admin, createBlog);

router.route('/:id')
    .get(getBlogById)
    .delete(protect, admin, deleteBlog);

module.exports = router;
