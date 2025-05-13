const express = require('express');
const path = require('path');
const db = require('../db');
const bcrypt = require('bcrypt');
const router = express.Router();

// Route to display the login form
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Route to handle login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM rh WHERE mail = ?', [email]);

    if (rows.length == 0) {
      return res.send.status(401).send('<h1>Mail ou Password not found</h1><br><a href="/users/login">Retry</a>');
    }

    const user = rows[0];

    //Check Password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch){
      return res.send.status(401).send('<h1>Mail ou Password not found</h1><br><a href="/users/login">Retry</a>');
    }

    req.session.isLoggedIn = true;
    req.session.userId = user.id;

    res.redirect('/quiz');
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).send('<h1>Erreur serveur</h1><a href="/users/login">Réessayer</a>');
  }
});

// Route to handle logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/users/login'); // Redirect to login page after logout
});

module.exports = router;
  