const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes = require('./routes/categories');
const budgetRoutes = require('./routes/budgets');
const goalRoutes = require('./routes/goals');
const User = require('./models/User');

const app = express();

// Middleware: Session setup (move this above user loading middleware)
app.use(session({
  secret: 'smartbudgetsecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Flash middleware
app.use(flash());

// Middleware to load user from session
app.use(async (req, res, next) => {
  if (req.session.user_id) {
    try {
      const user = await User.findById(req.session.user_id); // Assuming you have a `findById` method
      res.locals.user = user;
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  } else {
    res.locals.user = null;
  }
  next();
});

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const isAuthenticated = (req, res, next) => {
  if (req.session.user_id) {
    return next();
  }
  res.redirect('/auth/login');
};

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', isAuthenticated, dashboardRoutes);
app.use('/transactions', isAuthenticated, transactionRoutes);
app.use('/categories', isAuthenticated, categoryRoutes);
app.use('/budgets', isAuthenticated, budgetRoutes);
app.use('/goals', isAuthenticated, goalRoutes);

// Home route
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/dashboard/index');
  } else {
    res.redirect('/auth/login');
  }
});



app.get('/logout', isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/auth/dashboard');
    }
    res.redirect('/auth/login');
  });
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

module.exports = app;
