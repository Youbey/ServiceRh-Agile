const express = require('express');
const path = require('path'); // Add this line to fix the error
const router = express.Router();

// Route to display the login form
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Route to handle login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Hardcoded credentials for simplicity
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    req.session.isLoggedIn = true;
    res.redirect('/quiz'); // Redirect to quiz page after successful login
  } else {
    res.status(401).send('<h1>Invalid credentials</h1><a href="/users/login">Try again</a>');
  }
});

// Route to handle logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/users/login'); // Redirect to login page after logout
});

module.exports = router;
  