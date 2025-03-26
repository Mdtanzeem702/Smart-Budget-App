// controllers/userController.js
const User = require('../models/User');
const db = require('../config/database');

exports.register = async (req, res) => {
  // const { username, email, password } = req.body;
  // try {
  //   const userId = await User.create({ username, email, password });
  //   res.redirect('/auth/login');
  // } catch (err) {
  //   console.error(err);
  //   res.status(500).send('Server Error');
  // }

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send('All fields are required');
  }

  try {
    const hashedPassword = password;
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';

    db.query(query, [username, email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error inserting user:', err);
        return res.status(500).send('Error registering user');
      }
      res.redirect('/auth/login');
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByEmail(email);
    if (user && user.password === password) {
      req.session.user_id = user.user_id; // Save user_id in the session
      res.redirect('/dashboard/index');
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
