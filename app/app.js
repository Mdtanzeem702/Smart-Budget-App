const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { User } = require("./models/user");
const db = require("./services/db");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("static"));

app.set("view engine", "pug");
app.set("views", "./app/views");

app.use(cookieParser());
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
  secret: "secretkeysdfjsflyoifasd",
  saveUninitialized: true,
  resave: false,
  cookie: { maxAge: oneDay }
}));

// --- Auth Routes ---

app.get("/login", (req, res) => {
  res.render("login", { pageTitle: "Login", activePage: "login" });
});

app.get("/register", (req, res) => {
  res.render("signup", { pageTitle: "Sign Up", activePage: "signup" });
});

app.post("/set-password", async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).send("All fields are required.");
  }

  try {
    const existing = await db.query("SELECT * FROM Users WHERE email = ? OR username = ?", [email, username]);
    const user = new User(email, username);

    if (existing.length > 0) {
      user.id = existing[0].user_id;
      await user.setUserPassword(password);
      return res.send("Password updated successfully.");
    }

    await user.addUser(password);
    res.send("Account created! Please log in.");
  } catch (err) {
    console.error("Error in /set-password:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send("Email and password are required.");

  const user = new User(email);

  try {
    const uId = await user.getIdFromEmail();
    if (!uId) return res.status(401).send("Invalid email");

    user.id = uId;
    const match = await user.authenticate(password);
    if (!match) return res.status(401).send("Invalid password");

    req.session.uid = uId;
    req.session.loggedIn = true;
    res.redirect("/");
  } catch (err) {
    console.error("Error in /authenticate:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect("/login");
  });
});

// --- Protected Routes ---

app.get("/", async (req, res) => {
  if (!req.session.uid) return res.redirect("/login");

  try {
    const userId = req.session.uid;

    const queries = {
      totalIncome: `
        SELECT SUM(amount) AS total FROM Transactions
        WHERE user_id = ? AND amount > 0
      `,
      totalExpense: `
        SELECT SUM(amount) AS total FROM Transactions
        WHERE user_id = ? AND amount < 0
      `,
      todayExpense: `
        SELECT SUM(amount) AS total FROM Transactions
        WHERE user_id = ? AND amount < 0 AND DATE(date) = CURDATE()
      `,
      weekExpense: `
        SELECT SUM(amount) AS total FROM Transactions
        WHERE user_id = ? AND amount < 0 AND YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)
      `,
      monthExpense: `
        SELECT SUM(amount) AS total FROM Transactions
        WHERE user_id = ? AND amount < 0 AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
      `,
      yearExpense: `
        SELECT SUM(amount) AS total FROM Transactions
        WHERE user_id = ? AND amount < 0 AND YEAR(date) = YEAR(CURDATE())
      `
    };

    const [
      [income],
      [expense],
      [today],
      [week],
      [month],
      [year]
    ] = await Promise.all([
      db.query(queries.totalIncome, [userId]),
      db.query(queries.totalExpense, [userId]),
      db.query(queries.todayExpense, [userId]),
      db.query(queries.weekExpense, [userId]),
      db.query(queries.monthExpense, [userId]),
      db.query(queries.yearExpense, [userId])
    ]);

    res.render("index", {
      pageTitle: "Home",
      activePage: "home",
      totalIncome: income.total || 0,
      totalExpense: expense.total || 0,
      todayExpense: today.total || 0,
      weekExpense: week.total || 0,
      monthExpense: month.total || 0,
      yearExpense: year.total || 0
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send("Error loading dashboard.");
  }
});


app.get("/transactions", async (req, res) => {
  if (!req.session.uid) return res.redirect("/login");

  const { description, category_id } = req.query;
  let sql = "SELECT * FROM Transactions WHERE user_id = ?";
  const params = [req.session.uid];

  if (description && description.trim() !== "") {
    sql += " AND description LIKE ?";
    params.push(`%${description}%`);
  }

  if (category_id && !isNaN(category_id)) {
    sql += " AND category_id = ?";
    params.push(category_id);
  }

  console.log("Running SQL:", sql);
  console.log("With Params:", params);

  try {
    const results = await db.query(sql, params);
    console.log("Results:", results); // ✅ Log actual data returned

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
    if (results.length === 0) return res.status(404).send("Transaction not found");
    res.render("details_transaction", {
      pageTitle: "Transaction Details",
      activePage: "transactions",
      transaction: results[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving transaction details");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
