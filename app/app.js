
//// 1. Import dependencies ////////////////
const express       = require("express");            // Fast, unopinionated, minimalist web framework
const bodyParser    = require("body-parser");         // Parse incoming request bodies
const cookieParser  = require("cookie-parser");       // Parse Cookie header and populate req.cookies
const session       = require("express-session");     // Session middleware for Express
const { User }      = require("./models/user");       // User model for authentication
const db            = require("./services/db");       // Database helper for queries

//// 2. Create and configure Express app 
const app = express();

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

// Serve static assets from /static (CSS, JS, images)
app.use(express.static("static"));

// Set Pug as the templating engine
app.set("view engine", "pug");
app.set("views", "./app/views");

//// 3. Session & Cookie Configuration ///
app.use(cookieParser());
const oneDay = 1000 * 60 * 60 * 24;  // milliseconds in one day

app.use(session({
  secret: "secretkeysdfjsflyoifasd", // TODO: move to env var in production
  saveUninitialized: true,
  resave: false,
  cookie: { maxAge: oneDay }
}));

//// 4. Authentication Routes ///////////////

// Render login page
app.get("/login", (req, res) => {
  res.render("login", {
    pageTitle: "Login",
    activePage: "login"
  });
});

// Render registration (signup) page
app.get("/register", (req, res) => {
  res.render("signup", {
    pageTitle: "Sign Up",
    activePage: "signup"
  });
});

// Handle new user signup or existing user password set
app.post("/set-password", async (req, res) => {
  const { email, password } = req.body;
  const user = new User(email);

  try {
    const uId = await user.getIdFromEmail();

    if (uId) {
      // Existing user: update password
      await user.setUserPassword(password);
      res.send("Password updated successfully.");
    } else {
      // New user: create account
      await user.addUser(email);
      res.send("Account created! Please log in.");
    }
  } catch (err) {
    console.error("Error in /set-password:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Handle login form submission
app.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;

  // Validate form inputs
  if (!email || !password) {
    return res.status(400).send("Email and password are required.");
  }

  const user = new User(email);

  try {
    const uId = await user.getIdFromEmail();
    if (!uId) {
      return res.status(401).send("Invalid email");
    }

    const match = await user.authenticate(password);
    if (!match) {
      return res.status(401).send("Invalid password");
    }

    // Store user ID and login flag in session
    req.session.uid      = uId;
    req.session.loggedIn = true;

    res.redirect("/");
  } catch (err) {
    console.error("Error in /authenticate:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Handle logout
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error("Error destroying session:", err);
    res.redirect("/login");
  });
});

//// 5. Protected Routes 

// Home page — only accessible if logged in
app.get("/", (req, res) => {
  if (!req.session.uid) {
    // Not authenticated → redirect to login
    return res.redirect("/login");
  }

  res.render("index", {
    pageTitle: "Home",
    activePage: "home"
  });
});

// Transactions list — must be logged in
app.get("/transactions", async (req, res) => {
  if (!req.session.uid) {
    return res.redirect("/login");
  }

  // Build SQL with optional filters
  const { description, user_id, category_id } = req.query;
  let sql    = "SELECT * FROM Transactions WHERE 1=1";
  let params = [];

  if (description) {
    sql    += " AND description LIKE ?";
    params.push(`%${description}%`);
  }
  if (user_id) {
    sql    += " AND user_id = ?";
    params.push(user_id);
  }
  if (category_id) {
    sql    += " AND category_id = ?";
    params.push(category_id);
  }

  try {
    const results = await db.query(sql, params);
    res.render("transactions", {
      pageTitle: "Transactions",
      activePage: "transactions",
      transactions: results,
      filters: req.query
    });
  } catch (err) {
    console.error("DB error in /transactions:", err);
    res.status(500).send("Database error");
  }
});

// Transaction details by ID
app.get("/transactions/:id", async (req, res) => {
  if (!req.session.uid) {
    return res.redirect("/login");
  }

  const transactionId = req.params.id;
  const sql = `
    SELECT
      t.*,
      u.email AS user_email,
      c.name  AS category_name,
      c.type  AS category_type
    FROM Transactions t
    JOIN Users u ON t.user_id = u.user_id
    LEFT JOIN Categories c ON t.category_id = c.category_id
    WHERE t.transaction_id = ?
  `;

  try {
    const results = await db.query(sql, [transactionId]);
    if (results.length === 0) {
      return res.status(404).send("Transaction not found");
    }
    res.render("details_transaction", {
      pageTitle: "Transaction Details",
      activePage: "transactions",
      transaction: results[0]
    });
  } catch (err) {
    console.error("DB error in /transactions/:id:", err);
    res.status(500).send("Error retrieving transaction details");
  }
});

//// 6. Miscellaneous Routes

// Simple DB test route (for development)
app.get("/db_test", async (req, res) => {
  try {
    const results = await db.query("SELECT * FROM test_table");
    res.send(results);
  } catch (err) {
    console.error("DB error in /db_test:", err);
    res.status(500).send("Database error");
  }
});

// Goodbye world!
app.get("/goodbye", (req, res) => {
  res.send("Goodbye world!");
});

// Dynamic greeting
app.get("/hello/:name", (req, res) => {
  const name = req.params.name;
  res.send(`Hello ${name}`);
});

//// 7. Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
