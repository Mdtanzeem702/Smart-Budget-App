const db = require('../services/db');
const bcrypt = require("bcryptjs");

class User {
    id;
    email;
    username;

    constructor(email, username = null) {
        this.email = email;
        this.username = username; // Added username for insertion
    }

    // Get an existing user_id from an email address
    async getIdFromEmail() {
        const sql = "SELECT user_id FROM Users WHERE email = ?";
        const result = await db.query(sql, [this.email]);

        if (result.length > 0) {
            this.id = result[0].user_id;
            return this.id;
        } else {
            return false;
        }
    }

    // Set or update the user's password
    async setUserPassword(password) {
        const pw = await bcrypt.hash(password, 10);
        const sql = "UPDATE Users SET password = ? WHERE user_id = ?";
        await db.query(sql, [pw, this.id]);
        return true;
    }

    // Add a new user (requires username, email, and password)
    async addUser(password) {
        const pw = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO Users (username, email, password) VALUES (?, ?, ?)";
        const result = await db.query(sql, [this.username, this.email, pw]);
        this.id = result.insertId;
        return true;
    }

    // Authenticate user by comparing submitted password with stored hash
    async authenticate(submittedPassword) {
        const sql = "SELECT password FROM Users WHERE user_id = ?";
        const result = await db.query(sql, [this.id]);
        if (result.length === 0) return false;

        const match = await bcrypt.compare(submittedPassword, result[0].password);
        return match;
    }
}

module.exports = {
    User
};
