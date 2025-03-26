// routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Apply authentication middleware to all routes
// router.use(isAuthenticated);

// Dashboard route
router.get('/index', dashboardController.getDashboard);

module.exports = router;