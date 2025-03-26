const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Get all categories
router.get('/', categoryController.getAllCategories);

// Add category form
router.get('/add', categoryController.getAddCategory);

// Process add category
router.post('/add', categoryController.postAddCategory);

// Edit category form
router.get('/edit/:id', categoryController.getEditCategory);

// Process edit category
router.post('/edit/:id', categoryController.postEditCategory);

// Delete category
router.get('/delete/:id', categoryController.deleteCategory);

module.exports = router;