const express = require('express');
const db = require('../db'); // Connexion à la base de données
const router = express.Router();
const path = require('path');
const authenticate = require('../middleware/auth'); // Middleware d'authentification

// Route pour afficher la page de création de quiz
router.get('/', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/quiz_create.html'));
});

// Route pour ajouter un quiz, des questions et des réponses à la BDD
router.post('/', authenticate, async (req, res) => {
    console.log("Données reçues :", req.body);

  const { title, description, time_limit } = req.body;

  if (!title || !description || !time_limit) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const [quizResult] = await db.execute(
      'INSERT INTO quizzes (title, description, time_limit) VALUES (?, ?, ?)',
      [title, description, time_limit]
    );
    const quizId = quizResult.insertId;

    // Insérer les questions
    const questions = req.body.questions || [];
    for (let i = 0; i < questions.length; i++) {
      const [questionResult] = await db.execute(
        'INSERT INTO questions (quiz_id, text, `order`, points) VALUES (?, ?, ?, ?)',
        [quizId, questions[i], i + 1, 1]
      );
      const questionId = questionResult.insertId;

      // Insérer les réponses pour chaque question
      const answers = req.body.answers[i] || [];
      const correctAnswers = req.body.correct[i] || [];
      for (let j = 0; j < answers.length; j++) {
        const isCorrect = correctAnswers[j] === "on"; // Checkbox activée
        await db.execute(
          'INSERT INTO answers (question_id, text, is_correct) VALUES (?, ?, ?)',
          [questionId, answers[j], isCorrect]
        );
      }
    }

    res.json({ message: "Quiz ajouté avec succès !" });
  } catch (error) {
    console.error("Erreur lors de l'ajout du quiz :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.delete('/quiz_delete/:id', authenticate, async (req, res) => {
    const quizId = req.params.id;
  
    try {
      await db.execute('DELETE FROM quizzes WHERE id = ?', [quizId]);

      res.json({ message: "Quiz supprimé avec succès !" });
    } catch (error) {
      console.error("Erreur suppression du quiz :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
  
router.put('/quiz_modify/:id', authenticate, async (req, res) => {
    const quizId = req.params.id;
  
    try {
        await db.execute('UPDATE quizzes SET title = ?, description = ?, time_limit = ? WHERE id = ?', 
            [title, description, time_limit, quizId]);

      res.json({ message: "Quiz modifier avec succès !" });
    } catch (error) {
      console.error("Erreur modification du quiz :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

module.exports = router;
