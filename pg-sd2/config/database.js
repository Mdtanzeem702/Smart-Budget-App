const mysql = require('mysql2');


const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost', // Use 'db' as the host (Docker service name)
  port: process.env.DB_PORT || 3306, // Use port 3306 (default MySQL port inside the container)
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Md@12345',
  database: process.env.DB_NAME || 'smartbudget'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

module.exports = db;