// models/Transaction.js
const db = require('../config/database');

class Transaction {
  static getAll(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT t.*, c.category_name 
        FROM transactions t 
        LEFT JOIN categories c ON t.category_id = c.category_id 
        WHERE t.user_id = ? 
        ORDER BY t.transaction_date DESC`;
      db.query(query, [userId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  static create(transactionData) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO transactions SET ?';
      db.query(query, [transactionData], (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }

  // 🔹 Method to get monthly income or expenses
  static getMonthlySum(userId, type, year, month) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT SUM(amount) AS total 
        FROM transactions 
        WHERE user_id = ? 
          AND transaction_type = ? 
          AND YEAR(transaction_date) = ? 
          AND MONTH(transaction_date) = ?`;
      db.query(query, [userId, type, year, month], (err, results) => {
        if (err) return reject(err);
        resolve(results[0].total || 0);  // Return 0 if no results
      });
    });
  }
  

  // 🔹 Method to get recent transactions
  static getRecentTransactions(userId, limit) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * 
        FROM transactions 
        WHERE user_id = ? 
        ORDER BY transaction_date DESC 
        LIMIT ?`;
      db.query(query, [userId, limit], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }
}

module.exports = Transaction;
