// routes/auth.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

router.post('/login', userController.login);

router.get('/register-form', (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

router.post('/register', userController.register);

module.exports = router;