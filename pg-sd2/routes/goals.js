const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalsController'); // Adjust the path if needed


// View all goals
router.get('/', goalController.viewGoals);

// Add goal form
router.get('/add', goalController.addGoalForm);

// Add a new goal
router.post('/add', goalController.addGoal);

// Edit goal form
router.get('/edit/:id', goalController.editGoalForm);

// Update a goal
router.post('/edit/:id', goalController.updateGoal);

// Delete a goal
router.post('/delete/:id', goalController.deleteGoal);

module.exports = router;
