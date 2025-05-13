const express = require('express');
const path = require('path'); // Import the path module
const router = express.Router();
const authenticate = require('../middleware/auth'); // Import the authentication middleware
const db = require('./../db');

// Route to display the quiz page
router.get('/', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/quiz.html')); // Ensure the path to quiz.html is correct
});


router.get('/data', authenticate, async (req, res) => {
  try {
    const [rows, fields] = await db.execute(`
      SELECT id, title, description, time_limit
      FROM quizzes
    `);
    res.status(200).json({ data: rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des quizzes:', error);
    res.status(500).json({ error: 'Erreur serveur: ' + error.message });
  }
});

router.delete('/quiz/:id', async (req, res) => {
  const quizId = req.params.id;


  try {
    await db.beginTransaction();

    await db.execute(`
            DELETE FROM candidate_responses 
            WHERE attempt_id IN (
                SELECT id FROM candidate_attempts 
                WHERE quiz_id = ?
            )`, [quizId]);

    await db.execute(`
            DELETE FROM candidate_attempts 
            WHERE quiz_id = ?`, [quizId]);

    await db.execute(`
            DELETE FROM answers 
            WHERE question_id IN (
                SELECT id FROM questions 
                WHERE quiz_id = ?
            )`, [quizId]);

    await db.execute(`
            DELETE FROM questions 
            WHERE quiz_id = ?`, [quizId]);

    await db.execute(`
            DELETE FROM quizzes 
            WHERE id = ?`, [quizId]);

    res.status(200).json({ message: `Quiz ${quizId} supprimé avec succès` });
  } catch (error) {
    await db.rollback();
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du quiz' });
  } finally {
    await db.end();
  }
});

// GET /quiz_edit/:id - Display the quiz edit page
// GET /quiz_edit/:id - Display the quiz edit page
router.get('/quiz_edit/:id', async (req, res) => {
    const quizId = req.params.id;

    try {
        // Validate quizId
        if (!/^\d+$/.test(quizId)) {
            return res.status(400).send('ID de quiz invalide');
        }

        // Fetch quiz data
        const [quizRows] = await db.execute(
            `SELECT q.id, q.title, q.description, q.time_limit
             FROM quizzes q
             WHERE q.id = ?`,
            [quizId]
        );

        if (quizRows.length === 0) {
            return res.status(404).send('Quiz non trouvé');
        }

        // Fetch questions and answers
        const [questionRows] = await db.execute(
            `SELECT q.id, q.text, q.order, q.points,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', a.id,
                            'text', a.text,
                            'is_correct', a.is_correct
                        )
                    ) as answers
             FROM questions q
             LEFT JOIN answers a ON q.id = a.question_id
             WHERE q.quiz_id = ?
             GROUP BY q.id, q.text, q.order, q.points`,
            [quizId]
        );

        // Process questions, handling answers as objects or JSON strings
        const questions = questionRows.map(row => ({
            ...row,
            answers: typeof row.answers === 'string' ? JSON.parse(row.answers) || [] : row.answers || []
        }));

        // Render the quiz_edit template
        res.render('quiz_edit.ejs', {
            quiz: quizRows[0],
            questions
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du quiz:', error);
        res.status(500).send('Erreur serveur');
    }
});

router.post('/update', authenticate, async (req, res) => {
    const { quizId, title, description, time_limit, questions } = req.body;

    try {
        // Validate quizId
        if (!/^\d+$/.test(quizId)) {
            return res.status(400).json({ error: 'ID de quiz invalide' });
        }

        // Check if quiz exists
        const [quizRows] = await db.execute(
            `SELECT id FROM quizzes WHERE id = ?`,
            [quizId]
        );
        if (quizRows.length === 0) {
            return res.status(404).json({ error: 'Quiz non trouvé' });
        }

        // Validate required fields
        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Le titre du quiz est requis' });
        }

        // Start a transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update quiz
            await connection.execute(
                `UPDATE quizzes
                 SET title = ?, description = ?, time_limit = ?
                 WHERE id = ?`,
                [title, description || null, time_limit || null, quizId]
            );

            // Validate and update questions
            if (Array.isArray(questions)) {
                for (let i = 0; i < questions.length; i++) {
                    const question = questions[i];
                    if (!question.text || question.text.trim() === '' || !question.points || question.points < 0) {
                        throw new Error(`Question ${i + 1} : texte ou points invalides`);
                    }

                    // Verify question exists and belongs to quiz
                    const [questionRows] = await connection.execute(
                        `SELECT id FROM questions WHERE id = ? AND quiz_id = ?`,
                        [question.id, quizId]
                    );
                    if (questionRows.length === 0) {
                        throw new Error(`Question ${i + 1} : ID invalide ou ne appartient pas au quiz`);
                    }

                    // Update question
                    await connection.execute(
                        `UPDATE questions
                         SET text = ?, points = ?, \`order\` = ?
                         WHERE id = ? AND quiz_id = ?`,
                        [question.text, question.points, question.order, question.id, quizId]
                    );

                    // Validate and update answers
                    if (Array.isArray(question.answers)) {
                        // Ensure at least one correct answer
                        const hasCorrectAnswer = question.answers.some(a => a.is_correct);
                        if (!hasCorrectAnswer) {
                            throw new Error(`Question ${i + 1} : au moins une réponse doit être correcte`);
                        }

                        for (const answer of question.answers) {
                            if (!answer.text || answer.text.trim() === '') {
                                throw new Error(`Question ${i + 1} : texte de réponse vide`);
                            }

                            // Verify answer exists and belongs to question
                            const [answerRows] = await connection.execute(
                                `SELECT id FROM answers WHERE id = ? AND question_id = ?`,
                                [answer.id, question.id]
                            );
                            if (answerRows.length === 0) {
                                throw new Error(`Réponse pour question ${i + 1} : ID invalide`);
                            }

                            await connection.execute(
                                `UPDATE answers
                                 SET text = ?, is_correct = ?
                                 WHERE id = ? AND question_id = ?`,
                                [answer.text, answer.is_correct ? 1 : 0, answer.id, question.id]
                            );
                        }
                    }
                }
            }

            // Commit transaction
            await connection.commit();
            res.status(200).json({ message: 'Quiz mis à jour avec succès' });

        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            console.error('Erreur lors de la mise à jour du quiz:', {
                message: error.message,
                stack: error.stack,
                quizId
            });
            res.status(400).json({ error: error.message });
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Erreur lors de la mise à jour du quiz:', {
            message: error.message,
            stack: error.stack,
            quizId
        });
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du quiz' });
    }
});
module.exports = router;
