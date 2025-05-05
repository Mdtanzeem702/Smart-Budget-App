// app.js
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { User } = require("./models/user");
const db = require("./services/db");

const app = express();

// Body parsers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("static"));

// Pug setup
app.set("view engine", "pug");
app.set("views", "./app/views");

// Session + cookies
app.use(cookieParser());
const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: "secretkeysdfjsflyoifasd",
    saveUninitialized: true,
    resave: false,
    cookie: { maxAge: oneDay },
  })
);

// ---------- Auth Routes ---------- //

// Render login form
app.get("/login", (req, res) => {
  res.render("login", { pageTitle: "Login", activePage: "login" });
});

// Render signup form
app.get("/register", (req, res) => {
  res.render("signup", { pageTitle: "Sign Up", activePage: "signup" });
});

// Handle signup / set-password
app.post("/set-password", async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).send("All fields are required.");
  }

  try {
    // Check existing by email or username
    const existing = await db.query(
      "SELECT * FROM Users WHERE email = ? OR username = ?",
      [email, username]
    );
    const user = new User(email, username);

    if (existing.length > 0) {
      // update password for existing
      user.id = existing[0].user_id;
      await user.setUserPassword(password);
      return res.send("Password updated successfully.");
    }

    // create new
    await user.addUser(password);
    res.send("Account created! Please log in.");
  } catch (err) {
    console.error("Error in /set-password:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Handle login
app.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).send("Email and password are required.");

  const user = new User(email);
  try {
    const uId = await user.getIdFromEmail();
    if (!uId) return res.status(401).send("Invalid email");

    user.id = uId;
    const match = await user.authenticate(password);
    if (!match) return res.status(401).send("Invalid password");

    // set session
    req.session.uid = uId;
    req.session.loggedIn = true;
    res.redirect("/");
  } catch (err) {
    console.error("Error in /authenticate:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Handle logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/login");
  });
});

// ---------- Protected Pug Routes ---------- //

// Dashboard
app.get("/", async (req, res) => {
  if (!req.session.uid) return res.redirect("/login");

  try {
    const userId = req.session.uid;

    const queries = {
      totalIncome: `SELECT SUM(amount) AS total FROM Transactions WHERE user_id = ? AND amount > 0`,
      totalExpense: `SELECT SUM(amount) AS total FROM Transactions WHERE user_id = ? AND amount < 0`,
      todayExpense: `SELECT SUM(amount) AS total FROM Transactions WHERE user_id = ? AND amount < 0 AND DATE(date) = CURDATE()`,
      weekExpense: `SELECT SUM(amount) AS total FROM Transactions WHERE user_id = ? AND amount < 0 AND YEARWEEK(date,1)=YEARWEEK(CURDATE(),1)`,
      monthExpense: `SELECT SUM(amount) AS total FROM Transactions WHERE user_id = ? AND amount < 0 AND MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE())`,
      yearExpense: `SELECT SUM(amount) AS total FROM Transactions WHERE user_id = ? AND amount < 0 AND YEAR(date)=YEAR(CURDATE())`,
    };

    const [
      [inc],
      [exp],
      [td],
      [wk],
      [mo],
      [yr],
    ] = await Promise.all([
      db.query(queries.totalIncome, [userId]),
      db.query(queries.totalExpense, [userId]),
      db.query(queries.todayExpense, [userId]),
      db.query(queries.weekExpense, [userId]),
      db.query(queries.monthExpense, [userId]),
      db.query(queries.yearExpense, [userId]),
    ]);

    res.render("index", {
      pageTitle: "Home",
      activePage: "home",
      totalIncome: inc.total || 0,
      totalExpense: exp.total || 0,
      todayExpense: td.total || 0,
      weekExpense: wk.total || 0,
      monthExpense: mo.total || 0,
      yearExpense: yr.total || 0,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send("Error loading dashboard.");
  }
});

// List & filter transactions
app.get("/transactions", async (req, res) => {
  if (!req.session.uid) return res.redirect("/login");

  let sql = "SELECT * FROM Transactions WHERE user_id = ?";
  const params = [req.session.uid];
  const { description, category_id } = req.query;

  if (description && description.trim()) {
    sql += " AND description LIKE ?";
    params.push(`%${description}%`);
  }
  if (category_id && !isNaN(category_id)) {
    sql += " AND category_id = ?";
    params.push(category_id);
  }

  try {
    const results = await db.query(sql, params);
    res.render("transactions", {
      pageTitle: "Transactions",
      activePage: "transactions",
      transactions: results,
      filters: req.query,
    });
  } catch (err) {
    console.error("DB error in /transactions:", err);
    res.status(500).send("Database error");
  }
});

// View single transaction
app.get("/transactions/:id", async (req, res) => {
  if (!req.session.uid) return res.redirect("/login");

  const sql = `
    SELECT t.*, u.email AS user_email, c.name AS category_name, c.type AS category_type
    FROM Transactions t
    JOIN Users u ON t.user_id = u.user_id
    LEFT JOIN Categories c ON t.category_id = c.category_id
    WHERE t.transaction_id = ?
  `;
  try {
    const results = await db.query(sql, [req.params.id]);
    if (!results.length) return res.status(404).send("Transaction not found");
    res.render("details_transaction", {
      pageTitle: "Transaction Details",
      activePage: "transactions",
      transaction: results[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving transaction details");
  }
});

// ---------- JSON REST APIs for Transactions ---------- //
const ensureAuth = (req, res, next) => {
  if (!req.session.uid) return res.status(401).json({ error: "Not authenticated" });
  next();
};

// // GET all
// app.get("/transactions", ensureAuth, async (req, res) => {
//   try {
//     const txs = await db.query("SELECT * FROM Transactions WHERE user_id = ?", [
//       req.session.uid,
//     ]);
//     res.json(txs);
//   } catch (err) {
//     console.error("API list error:", err);
//     res.status(500).json({ error: "Database error" });
//   }
// });

// POST create
app.post("/transactions", ensureAuth, async (req, res) => {
  const { category_id, date, description, amount } = req.body;
  if (!category_id || !date || !description || amount == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await db.query(
      `INSERT INTO Transactions (user_id, category_id, date, description, amount)
       VALUES (?, ?, ?, ?, ?)`,
      [req.session.uid, category_id, date, description, amount]
    );
    const [newTx] = await db.query(
      "SELECT * FROM Transactions WHERE transaction_id = ?",
      [result.insertId]
    );
    res.status(201).json(newTx);
  } catch (err) {
    console.error("API create error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Make sure user is logged in
function ensureLoggedIn(req, res, next) {
  if (!req.session.uid) return res.redirect('/login');
  next();
}

// ——— Render “New Transaction” form ———
app.get('/transactions_create', ensureLoggedIn, async (req, res) => {
  res.render('transaction_form', {
    pageTitle: 'New Transaction',
    action: '/transactions/new',
    transaction: {}
  });
});

// ——— Handle “Create Transaction” ———
app.post('/transactions/new', ensureLoggedIn, async (req, res) => {
  const { category_id, date, description, amount } = req.body;
  try {
    await db.query(
      `INSERT INTO Transactions (user_id, category_id, date, description, amount)
       VALUES (?, ?, ?, ?, ?)`,
      [req.session.uid, category_id, date, description, amount]
    );
    res.redirect('/transactions');
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).send('Error creating transaction');
  }
});

// ——— Render “Edit Transaction” form ———
app.get('/transactions/:id/edit', ensureLoggedIn, async (req, res) => {
  try {
    const [tx] = await db.query(
      'SELECT * FROM Transactions WHERE transaction_id = ? AND user_id = ?',
      [req.params.id, req.session.uid]
    );
    if (!tx) return res.status(404).send('Transaction not found');
    res.render('transaction_form', {
      pageTitle: 'Edit Transaction',
      action: `/transactions/${tx.transaction_id}/edit`,
      transaction: tx
    });
  } catch (err) {
    console.error('Error loading transaction:', err);
    res.status(500).send('Error loading transaction');
  }
});


// ——— Handle “Update Transaction” ———
app.post('/transactions/:id/edit', ensureLoggedIn, async (req, res) => {
  const { category_id, date, description, amount } = req.body;
  try {
    await db.query(
      `UPDATE Transactions
       SET category_id = ?, date = ?, description = ?, amount = ?
       WHERE transaction_id = ? AND user_id = ?`,
      [category_id, date, description, amount, req.params.id, req.session.uid]
    );
    res.redirect('/transactions');
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).send('Error updating transaction');
  }
});

// ——— Handle “Delete Transaction” ———
app.post('/transactions/:id/delete', ensureLoggedIn, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM Transactions WHERE transaction_id = ? AND user_id = ?',
      [req.params.id, req.session.uid]
    );
    res.redirect('/transactions');
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).send('Error deleting transaction');
  }
});


// Render profile page
app.get('/profile', ensureLoggedIn, async (req, res) => {
  try {
    const [user] = await db.query(
      'SELECT user_id, username, email FROM Users WHERE user_id = ?',
      [req.session.uid]
    );
    if (!user) return res.redirect('/login');

    res.render('profile', {
      pageTitle: 'My Profile',
      activePage: null,
      user
    });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).send('Error loading profile');
  }
});

// Handle profile update
app.post('/profile', ensureLoggedIn, async (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) {
    return res.status(400).send('Username and email cannot be blank.');
  }

  try {
    // ensure no other user uses this email/username
    const conflict = await db.query(
      'SELECT user_id FROM Users WHERE (username = ? OR email = ?) AND user_id != ?',
      [username, email, req.session.uid]
    );
    if (conflict.length) {
      return res.status(400).send('Username or email already taken.');
    }

    await db.query(
      'UPDATE Users SET username = ?, email = ? WHERE user_id = ?',
      [username, email, req.session.uid]
    );
    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send('Error updating profile');
  }
});

// ---------- PASSWORD CHANGE ---------- //

// Render password-change page
app.get('/profile/password', ensureLoggedIn, (req, res) => {
  res.render('change_password', {
    pageTitle: 'Change Password',
    activePage: null
  });
});

// Handle password change
app.post('/profile/password', ensureLoggedIn, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
    return res.status(400).send('Please check your passwords and try again.');
  }

  try {
    // verify current
    const user = new User();  
    user.id = req.session.uid;  
    // load hashed pw
    const [{ password: hash }] = await db.query(
      'SELECT password FROM Users WHERE user_id = ?',
      [req.session.uid]
    );
    const match = await bcrypt.compare(currentPassword, hash);
    if (!match) return res.status(401).send('Current password is incorrect.');

    // update to new
    await user.setUserPassword(newPassword);
    res.redirect('/profile');
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).send('Error changing password');
  }
});


// ---------- Start Server ---------- //
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
