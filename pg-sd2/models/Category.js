// models/Category.js
const db = require('../config/database');

class Category {
  static getAll(userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM categories WHERE user_id = ?';
      db.query(query, [userId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  static getCategoriesWithSpending(userId, year, month) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT c.category_name, 
               SUM(t.amount) AS total_spending
        FROM categories c
        LEFT JOIN transactions t ON c.category_id = t.category_id 
        WHERE t.user_id = ? 
          AND YEAR(t.transaction_date) = ? 
          AND MONTH(t.transaction_date) = ?
        GROUP BY c.category_name`;
      db.query(query, [userId, year, month], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
}

module.exports = Category;