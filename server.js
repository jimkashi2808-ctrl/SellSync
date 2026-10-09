const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve HTML/CSS/JS static files

// Initialize SQLite Database (creates users.db file automatically)
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
});

// API Endpoint: User Registration / Signup
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
  db.run(query, [name, email, password], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res
          .status(400)
          .json({ success: false, message: "Email already registered." });
      }
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }
    res.json({
      success: true,
      message: "Account created successfully!",
      userId: this.lastID,
    });
  });
});

// API Endpoint: User Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const query = `SELECT * FROM users WHERE email = ? AND password = ?`;
  db.get(query, [email, password], (err, row) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Database error." });
    }
    if (!row) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }
    res.json({
      success: true,
      message: "Login successful!",
      user: { id: row.id, name: row.name, email: row.email },
    });
  });
});

// Serve Main Page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
