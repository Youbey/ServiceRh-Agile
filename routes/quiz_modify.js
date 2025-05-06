const express = require('express');
const db = require('../db'); // Connexion à la base de données
const router = express.Router();
const authenticate = require('../middleware/auth'); // Middleware d'authentification

// Récupérer un quiz pour modification
router.get('/:id', authenticate, async (req, res) => {
  const quizId = req.params.id;

  try {
    const [quiz] = await db.execute('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    if (quiz.length === 0) {
      return res.status(404).json({ message: "Quiz non trouvé" });
    }
    
    const [questions] = await db.execute('SELECT * FROM questions WHERE quiz_id = ?', [quizId]);
    // const [answers] = await db.execute('SELECT * FROM answers WHERE question_id IN ? ? ?', [questions.map(q => q.id)]);
    let answers = [];
    const questionIds = questions.map(q => q.id);
    if (questionIds.length > 0) {
        const placeholders = questionIds.map(() => '?').join(', ');
        const [answerData] = await db.execute(`SELECT * FROM answers WHERE question_id IN (${placeholders})`, questionIds);
    } else {
        answers = answerData;
    }


    res.json({ quiz: quiz[0], questions, answers });
  } catch (error) {
    console.error("Erreur récupération du quiz :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Modifier un quiz existant
router.put('/:id', authenticate, async (req, res) => {
  const quizId = req.params.id;
  const { title, description, time_limit, questions, answers, correct } = req.body;

  if (!title || !description || !time_limit || !questions || questions.length === 0) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    await db.execute('UPDATE quizzes SET title = ?, description = ?, time_limit = ? WHERE id = ?', 
                     [title, description, time_limit, quizId]);

    // Supprimer les anciennes questions et réponses
    await db.execute('DELETE FROM questions WHERE quiz_id = ?', [quizId]);

    for (let i = 0; i < questions.length; i++) {
      const [questionResult] = await db.execute(
        'INSERT INTO questions (quiz_id, text, `order`, points) VALUES (?, ?, ?, ?)',
        [quizId, questions[i], i + 1, 1]
      );
      const questionId = questionResult.insertId;

      const answersArray = answers[i] || [];
      const correctArray = correct[i] || [];
      for (let j = 0; j < answersArray.length; j++) {
        const isCorrect = correctArray[j] === "on";
        await db.execute(
          'INSERT INTO answers (question_id, text, is_correct) VALUES (?, ?, ?)',
          [questionId, answersArray[j], isCorrect]
        );
      }
    }

    res.json({ message: "Quiz modifié avec succès !" });
  } catch (error) {
    console.error("Erreur lors de la modification du quiz :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
