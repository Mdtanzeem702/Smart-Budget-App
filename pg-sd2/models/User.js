// models/User.js
const db = require('../config/database');

class User {
  static findById(userId) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM users WHERE user_id = ?`;
      db.query(query, [userId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]); // Assuming user_id is unique
      });
    });
  }

  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE email = ?';
      db.query(query, [email], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  }

  static create(user) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO users SET ?';
      db.query(query, user, (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      });
    });
  }
}

module.exports = User;