const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [quizzes] = await db.execute('SELECT * FROM quizzes');
    res.json(quizzes);
  } catch (error) {
    console.error("Erreur récupération des quiz :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
