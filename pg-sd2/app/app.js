const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const { pool } = require('./services/db');

// Create Express app
const app = express();

// Configure view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));

// Setup session
app.use(session({
  secret: process.env.SESSION_SECRET || 'smartbudget-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Setup flash messages
app.use(flash());

// Set local variables for templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/login');
};

// Routes
// Auth routes
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { title: 'Login' });
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      req.flash('error_msg', 'Please provide both email and password');
      return res.redirect('/login');
    }
    
    // Find user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    
    if (!user) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }
    
    // Simple password check (in a real app, use bcrypt)
    if (password !== user.password) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }
    
    // Store user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    req.flash('success_msg', 'You are now logged in');
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error_msg', 'An error occurred during login');
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('register', { title: 'Register' });
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirm_password } = req.body;
    
    // Validate input
    if (!username || !email || !password || !confirm_password) {
      req.flash('error_msg', 'Please fill in all fields');
      return res.redirect('/register');
    }
    
    if (password !== confirm_password) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect('/register');
    }
    
    // Check if email exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/register');
    }
    
    // Insert user
    await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );
    
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/register');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Dashboard route
app.get('/', isAuthenticated, (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get monthly summary
    const [summaryResults] = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE user_id = ? AND MONTH(date) = MONTH(CURRENT_DATE) AND YEAR(date) = YEAR(CURRENT_DATE)
    `, [userId]);
    
    const summary = summaryResults[0];
    const remaining = summary.income - summary.expenses;
    
    // Get budget status
    const [categories] = await pool.query(`
      SELECT c.*, 
        COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as spent
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id 
        AND t.user_id = ? 
        AND MONTH(t.date) = MONTH(CURRENT_DATE)
        AND YEAR(t.date) = YEAR(CURRENT_DATE)
      WHERE c.user_id = ? AND c.type = 'expense'
      GROUP BY c.id
    `, [userId, userId]);
    
    // Recent transactions
    const [transactions] = await pool.query(`
      SELECT t.*, c.name as category_name, c.color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.date DESC
      LIMIT 5
    `, [userId]);
    
    res.render('dashboard', {
      title: 'Dashboard',
      summary: {
        income: summary.income.toFixed(2),
        expenses: summary.expenses.toFixed(2),
        remaining: remaining.toFixed(2)
      },
      categories,
      transactions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error_msg', 'Error loading dashboard');
    res.render('dashboard', {
      title: 'Dashboard',
      summary: { income: '0.00', expenses: '0.00', remaining: '0.00' },
      categories: [],
      transactions: []
    });
  }
});

// Transactions routes
app.get('/transactions', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { category_id, startDate, endDate } = req.query;
    
    // Build query
    let query = `
      SELECT t.*, c.name as category_name, c.color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    
    const queryParams = [userId];
    
    if (category_id) {
      query += ' AND t.category_id = ?';
      queryParams.push(category_id);
    }
    
    if (startDate && endDate) {
      query += ' AND t.date BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }
    
    query += ' ORDER BY t.date DESC';
    
    // Get transactions
    const [transactions] = await pool.query(query, queryParams);
    
    // Get categories for filter
    const [categories] = await pool.query('SELECT * FROM categories WHERE user_id = ?', [userId]);
    
    res.render('transactions', {
      title: 'Transactions',
      transactions,
      categories,
      filters: { category_id, startDate, endDate }
    });
  } catch (error) {
    console.error('Transactions error:', error);
    req.flash('error_msg', 'Error loading transactions');
    res.render('transactions', {
      title: 'Transactions',
      transactions: [],
      categories: [],
      filters: {}
    });
  }
});

app.post('/transactions', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { category_id, date, description, amount } = req.body;
    
    // Validate input
    if (!category_id || !date || !description || !amount) {
      req.flash('error_msg', 'Please fill in all fields');
      return res.redirect('/transactions');
    }
    
    // Get category type (income/expense)
    const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [category_id]);
    
    if (categories.length === 0) {
      req.flash('error_msg', 'Invalid category');
      return res.redirect('/transactions');
    }
    
    const category = categories[0];
    
    // Determine correct amount sign based on category type
    let finalAmount = parseFloat(amount);
    if (category.type === 'expense') {
      finalAmount = -Math.abs(finalAmount);
    } else {
      finalAmount = Math.abs(finalAmount);
    }
    
    // Insert transaction
    await pool.query(
      'INSERT INTO transactions (user_id, category_id, date, description, amount) VALUES (?, ?, ?, ?, ?)',
      [userId, category_id, date, description, finalAmount]
    );
    
    req.flash('success_msg', 'Transaction added successfully');
    res.redirect('/transactions');
  } catch (error) {
    console.error('Add transaction error:', error);
    req.flash('error_msg', 'Error adding transaction');
    res.redirect('/transactions');
  }
});

// Additional routes for categories, editing transactions, etc. would go here

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;