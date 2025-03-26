const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const db = require('../config/database'); // Assuming you have a SQLite database setup
const moment = require('moment');

// Get all transactions
// exports.getAllTransactions = async (req, res) => {
//   try {
//     const transactions = await Transaction.getAll(req.session.user_id);
//     res.render('transactions/index', { title: 'Transactions', transactions });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server Error');
//   }
// };


// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.getAll(req.session.user_id);
    const categories = await Category.getAll(req.session.user_id);

    // Calculate monthly income, expenses, and remaining balance
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    transactions.forEach(transaction => {
      if (transaction.transaction_type === 'income') {
        monthlyIncome += transaction.amount;
      } else {
        monthlyExpenses += transaction.amount;
      }
    });

    const remainingBalance = monthlyIncome - monthlyExpenses;

    res.render('transactions/index', {
      title: 'Transactions',
      transactions,
      categories,
      monthlyIncome,
      monthlyExpenses,
      remainingBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// ------------------------------------------------------------

// Add a New Transaction
// Add a New Transaction
exports.addTransaction = async (req, res) => {
  const user_id = req.session.user_id
  const { description, amount, transaction_type, category_id } = req.body;

  try {
    // INSERT INTO `transactions`(`transaction_id`, `user_id`, `amount`, `description`, `category_id`, `transaction_type`, `transaction_date`) 
    // VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]','[value-7]')
    await db.execute(
      `INSERT INTO transactions (user_id, amount, description, category_id, transaction_type, transaction_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, parseFloat(amount), description, parseInt(category_id), transaction_type, moment().format('YYYY-MM-DD'),]
    );
    res.redirect('/transactions/index');
  } catch (err) {
    console.error('Error adding transaction:', err);
    res.status(500).send('Server error');
  }
};


// Render Edit Form
exports.editTransactionForm = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.user_id

  console.log('Transaction ID:', id);
  console.log('User ID:', userId);

  try {
    // Fetching the transaction based on the provided ID and user_id
    db.query(
      'SELECT * FROM transactions WHERE transaction_id = ? AND user_id = ?',
      [id, userId],
      (err, transactionResult) => {
        if (err) {
          console.error('Error fetching transaction:', err);
          return res.status(500).send('Server error');
        }

        console.log('Transaction Result:', transactionResult);

        // If no transaction is found
        if (!transactionResult || transactionResult.length === 0) {
          console.log('No transaction found for the given ID and user');
          return res.status(404).send('Transaction not found');
        }

        // Fetching all categories for the user
        db.query(
          'SELECT * FROM categories WHERE user_id = ?',
          [userId],
          (err, categoryResult) => {
            if (err) {
              console.error('Error fetching categories:', err);
              return res.status(500).send('Server error');
            }

            console.log('Category Result:', categoryResult);

            res.render('transactions/edit', {
              transaction: transactionResult[0],
              categories: categoryResult,
            });
          }
        );
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).send('Server error');
  }
};





// Update Transaction
exports.updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { description, amount, transaction_type, category_id, transaction_date } = req.body;
  const user_id = req.session.user_id; // User ID from session

  try {
    db.query(
      `UPDATE transactions 
       SET description = ?, amount = ?, transaction_type = ?, category_id = ?, transaction_date = ?
       WHERE transaction_id = ? AND user_id = ?`,
      [description, parseFloat(amount), transaction_type, parseInt(category_id), transaction_date, id, user_id],
      (err, result) => {
        if (err) {
          console.error('Error updating transaction:', err);
          return res.status(500).send('Server error');
        }

        if (result.affectedRows === 0) {
          console.log('No transaction updated. Either transaction not found or unauthorized access.');
          return res.status(404).send('Transaction not found or unauthorized access.');
        }

        res.redirect('/transactions/index');
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).send('Server error');
  }
};




// Delete Transaction
exports.deleteTransaction = (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM transactions WHERE transaction_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting transaction:', err);
      return res.status(500).send('Server error');
    }

    if (result.affectedRows === 0) {
      console.log('No transaction found for deletion.');
      return res.status(404).send('Transaction not found.');
    }

    res.redirect('/transactions/index');
  });
};

// ------------------------------------------------------------
