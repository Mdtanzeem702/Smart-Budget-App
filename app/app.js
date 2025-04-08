// Import express.js
const express = require("express");

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Create a route for root - /
app.get("/", function(req, res) {
    res.render("index");
});



// Create a route for testing the db
app.get("/transactions", (req, res) => {
    const { description, user_id, category_id } = req.query;
    let sql = 'SELECT * FROM Transactions WHERE 1=1';
    let params = [];

    if (description) {
        sql += ' AND description LIKE ?';
        params.push(`%${description}%`);
    }
    if (user_id) {
        sql += ' AND user_id = ?';
        params.push(user_id);
    }
    if (category_id) {
        sql += ' AND category_id = ?';
        params.push(category_id);
    }

    db.query(sql, params).then(results => {
        res.render('transactions', {
            transactions: results,
            filters: req.query
        });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Database error");
    });
});


// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

// Route to show details of a single transaction by ID
app.get("/transactions/:id", function(req, res) {
    const transactionId = req.params.id;
    const sql = 'SELECT * FROM Transactions WHERE transaction_id = ?';
    db.query(sql, [transactionId]).then(results => {
        if (results.length === 0) {
            return res.status(404).send("Transaction not found");
        }
        res.render('details_transaction', { transaction: results[0] });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error retrieving transaction details");
    });
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});