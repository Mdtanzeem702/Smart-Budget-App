// routes/budgets.js
const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController.js');

router.get('/index', budgetController.index);
router.get('/add', budgetController.addForm);
router.post('/add', budgetController.addBudget);
router.get('/edit/:id', budgetController.editForm);
router.post('/edit/:id', budgetController.updateBudget);
router.get('/compare', budgetController.compareBudgets);

module.exports = router;
