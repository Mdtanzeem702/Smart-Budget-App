const db = require('../config/database');
const moment = require('moment');

// View all goals
exports.viewGoals = (req, res) => {
    const user_id = req.session.user_id;

    db.query(
        `SELECT * FROM goals WHERE user_id = ?`,
        [user_id],
        (err, results) => {
            if (err) {
                console.error('Error fetching goals:', err);
                return res.status(500).send('Server error');
            }

            // Ensure date is formatted correctly for display
            results.forEach(goal => {
                goal.target_date = moment(goal.target_date).format('YYYY-MM-DD');
            });

            res.render('goals/index', { goals: results });
        }
    );
};

// Add goal form
exports.addGoalForm = (req, res) => {
    res.render('goals/add');
};

// Add new goal
exports.addGoal = (req, res) => {
    const user_id = req.session.user_id;
    const { goal_name, target_amount, target_date } = req.body;

    // Use Moment.js to format the date correctly without timezone issues
    const formattedDate = moment(target_date).format('YYYY-MM-DD');

    db.query(
        `INSERT INTO goals (user_id, goal_name, target_amount, target_date) VALUES (?, ?, ?, ?)`,
        [user_id, goal_name, parseFloat(target_amount), formattedDate],
        (err) => {
            if (err) {
                console.error('Error adding goal:', err);
                return res.status(500).send('Server error');
            }

            res.redirect('/goals');
        }
    );
};

// Edit goal form
exports.editGoalForm = (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM goals WHERE goal_id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error fetching goal:', err);
            return res.status(500).send('Server error');
        }

        if (result.length === 0) {
            return res.status(404).send('Goal not found');
        }

        const goal = result[0];
        // Format the target_date using Moment.js for the edit form
        goal.target_date = moment(goal.target_date).format('YYYY-MM-DD');

        res.render('goals/edit', { goal });
    });
};

// Update goal
exports.updateGoal = (req, res) => {
    const { id } = req.params;
    const { goal_name, target_amount, target_date, saved_amount } = req.body;

    // Ensure the date is formatted properly using Moment.js
    const formattedDate = moment(target_date).format('YYYY-MM-DD');

    db.query(
        `UPDATE goals SET goal_name = ?, target_amount = ?, target_date = ?, saved_amount = ? WHERE goal_id = ?`,
        [goal_name, parseFloat(target_amount), formattedDate, parseFloat(saved_amount), id],
        (err) => {
            if (err) {
                console.error('Error updating goal:', err);
                return res.status(500).send('Server error');
            }

            res.redirect('/goals');
        }
    );
};


// Delete goal
exports.deleteGoal = (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM goals WHERE goal_id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting goal:', err);
            return res.status(500).send('Server error');
        }

        res.redirect('/goals');
    });
};
