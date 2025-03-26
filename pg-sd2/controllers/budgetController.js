// controllers/budgetController.js
const db = require('../config/database');
const moment = require('moment');

// View all budgets
exports.index = (req, res) => {
    const user_id = req.session.user_id;

    db.query(
        `SELECT budgets.*, categories.category_name 
     FROM budgets 
     JOIN categories ON budgets.category_id = categories.category_id 
     WHERE budgets.user_id = ?`,
        [user_id],
        (err, budgets) => {
            if (err) return res.status(500).send('Server error');
            res.render('budgets/index', { budgets });
        }
    );
};

// Add budget form
exports.addForm = (req, res) => {
    db.query('SELECT * FROM categories', (err, categories) => {
        if (err) return res.status(500).send('Server error');
        res.render('budgets/add', { categories });
    });
};

// Add a new budget
exports.addBudget = (req, res) => {
    const user_id = req.session.user_id;
    const { category_id, amount, month } = req.body;

    db.query(
        'INSERT INTO budgets (user_id, category_id, amount, month) VALUES (?, ?, ?, ?)',
        [user_id, category_id, parseFloat(amount), month],
        (err) => {
            if (err) return res.status(500).send('Server error');
            res.redirect('/budgets/index');
        }
    );
};

// Edit budget form
exports.editForm = (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM budgets WHERE budget_id = ?', [id], (err, budget) => {
        if (err || !budget.length) return res.status(404).send('Budget not found');

        db.query('SELECT * FROM categories', (err, categories) => {
            if (err) return res.status(500).send('Server error');
            res.render('budgets/edit', { budget: budget[0], categories });
        });
    });
};

// Update budget
exports.updateBudget = (req, res) => {
    const { id } = req.params;
    const { category_id, amount, month } = req.body;

    db.query(
        'UPDATE budgets SET category_id = ?, amount = ?, month = ? WHERE budget_id = ?',
        [category_id, parseFloat(amount), month, id],
        (err) => {
            if (err) return res.status(500).send('Server error');
            res.redirect('/budgets/index');
        }
    );
};

// Compare Budgets - View
exports.compareBudgets = async (req, res) => {
    const user_id = req.session.user_id;
  
    try {
      // Fetch budgets for the user
      db.query(
        `SELECT b.budget_id, b.amount AS budget_amount, b.month, c.category_name,
                COALESCE(SUM(t.amount), 0) AS actual_spending
         FROM budgets b
         LEFT JOIN categories c ON b.category_id = c.category_id
         LEFT JOIN transactions t ON b.category_id = t.category_id 
            AND t.transaction_type = 'expense'
            AND MONTH(t.transaction_date) = MONTH(b.month)
            AND t.user_id = ?
         WHERE b.user_id = ?
         GROUP BY b.budget_id, b.amount, b.month, c.category_name`,
        [user_id, user_id],
        (err, results) => {
          if (err) {
            console.error('Error fetching budget comparison:', err);
            return res.status(500).send('Server error');
          }
  
          res.render('budgets/compare', { budgets: results });
        }
      );
    } catch (err) {
      console.error('Unexpected error in budget comparison:', err);
      res.status(500).send('Server error');
    }
  };
  