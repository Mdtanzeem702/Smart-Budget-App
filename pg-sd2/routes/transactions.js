const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Apply authentication middleware to all routes
// router.use(isAuthenticated);

// Get all transactions
router.get('/index', transactionController.getAllTransactions);

// Add transaction form
// router.get('/add', transactionController.getAddTransaction);

// // Process add transaction
// router.post('/add', transactionController.postAddTransaction);

// // Edit transaction form
// router.get('/edit/:id', transactionController.getEditTransaction);

// // Process edit transaction
// router.post('/edit/:id', transactionController.postEditTransaction);

// // Delete transaction
// router.get('/delete/:id', transactionController.deleteTransaction);



router.post('/add', transactionController.addTransaction);
router.get('/edit/:id', transactionController.editTransactionForm);
router.post('/edit/:id', transactionController.updateTransaction);
router.get('/delete/:id', transactionController.deleteTransaction);

module.exports = router;