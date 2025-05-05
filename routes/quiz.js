const express = require('express');
const path = require('path'); // Import the path module
const router = express.Router();
const authenticate = require('../middleware/auth'); // Import the authentication middleware

// Route to display the quiz page
router.get('/', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/quiz.html')); // Ensure the path to quiz.html is correct
});

module.exports = router;
