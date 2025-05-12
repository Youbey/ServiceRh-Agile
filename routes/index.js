var express = require('express');
var router = express.Router();
var path = require('path');
const db = require('./../db');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Welcome to Quiz System');
});

// Route for rh stats page 
router.get('/stats', function(req, res, next) {
  const rootDir = path.join(__dirname, '..');
  res.sendFile(path.join(rootDir, 'views', 'stats.html'));
});

// Real data endpoint for stats
router.get('/stats/data', async function(req, res) {

  // Promisify db.query to avoid callback hell
        const query = (sql, params) => {
            return new Promise((resolve, reject) => {
                db.query(sql, params, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
        };

  try {
    // Get all quizzes
    const quizzes = await query(`
      SELECT id, title, time_limit 
      FROM quizzes
      ORDER BY title
    `);

    // Get all candidate attempts with calculated scores
    const candidates = await query(`
      SELECT 
        u.id AS id,
        u.mail AS mail,
        ca.quiz_id AS quiz_id,
        q.title AS quiz_title,
        ca.score AS raw_score,
        (SELECT SUM(points) FROM questions WHERE quiz_id = ca.quiz_id) AS total_points,
        ca.start_time AS date,
        TIMESTAMPDIFF(SECOND, ca.start_time, ca.end_time) AS time_spent,
        ca.id AS attempt_id
      FROM candidate_attempts ca
      JOIN users u ON ca.user_id = u.id
      JOIN quizzes q ON ca.quiz_id = q.id
      WHERE ca.status = 'completed'
      ORDER BY ca.start_time DESC
    `);

    // Process candidates data to calculate percentages
    const processedCandidates = candidates.map(candidate => {
      const score = candidate.raw_score || 0;
      console.log(candidate.mail + " : " + score)
      const totalPoints = candidate.total_points || 1; // Avoid division by zero
      const percentage = Math.round((score / totalPoints) * 100);
      
      return {
        id: candidate.id,
        mail: candidate.mail,
        quiz_id: candidate.quiz_id,
        quiz_title: candidate.quiz_title,
        score: `${score}/${totalPoints}`,
        percentage: percentage,
        time_spent: candidate.time_spent,
        date: candidate.date,
        attempt_id: candidate.attempt_id
      };
    });

    // Calculate summary statistics
    const totalCandidates = processedCandidates.length;
    
    let avgScore = 0;
    if (totalCandidates > 0) {
      avgScore = Math.round(
        processedCandidates.reduce((sum, candidate) => sum + candidate.percentage, 0) / totalCandidates
      );
    }

    // Get completion rate (completed attempts vs total attempts)
    const attemptsCount = await query(`
      SELECT 
        COUNT(*) AS total_attempts,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_attempts
      FROM candidate_attempts
    `);
    
    const completionRate = attemptsCount[0].total_attempts > 0 
      ? Math.round((attemptsCount[0].completed_attempts / attemptsCount[0].total_attempts) * 100)
      : 0;

    // Calculate average time
    let avgTime = 0;
    if (totalCandidates > 0) {
      avgTime = Math.round(
        processedCandidates.reduce((sum, candidate) => sum + candidate.time_spent, 0) / totalCandidates
      );
    }

    // Return the formatted data
    res.json({
      quizzes: quizzes,
      candidates: processedCandidates,
      summary: {
        total_candidates: totalCandidates,
        avg_score: avgScore,
        completion_rate: completionRate,
        avg_time: avgTime
      }
    });
  } catch (error) {
    console.error('Error fetching stats data:', error);
    res.status(500).json({ error: 'Error fetching statistics data' });
  }
});

// Route for results page
router.get('/resultats', function(req, res, next) {
  const rootDir = path.join(__dirname, '..');
  res.sendFile(path.join(rootDir, 'views', 'resultats.html'));
});


// API endpoint to serve the results data
router.get('/resultats/data', async function(req, res, next) {
    try {
        const user_id = req.query.user_id;
        
        // Validate input parameters
        if (!user_id) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Promisify db.query to avoid callback hell
        const query = (sql, params) => {
            return new Promise((resolve, reject) => {
                db.query(sql, params, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
        };

        // 1. Get user information
        const userResults = await query(`SELECT * FROM users WHERE id = ?`, [user_id]);
        
        if (userResults.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userResults[0];

        // 2. Get the most recent attempt
        const attemptResults = await query(`
            SELECT ca.*, q.title as quiz_title, q.description as quiz_description, q.time_limit 
            FROM candidate_attempts ca
            JOIN quizzes q ON ca.quiz_id = q.id
            WHERE ca.user_id = ?
            ORDER BY ca.start_time DESC
            LIMIT 1
        `, [user.id]);
        
        if (attemptResults.length === 0) {
            return res.status(404).json({ error: 'No quiz attempts found for this user' });
        }
        
        const attempt = attemptResults[0];

        // 3. Get questions for this quiz
        const questionsResults = await query(`
            SELECT 
                q.id as question_id,
                q.text as question_text,
                q.order as question_order,
                q.points as question_points
            FROM questions q
            WHERE q.quiz_id = ?
            ORDER BY q.order
        `, [attempt.quiz_id]);

        // 4. Get answers for all questions
        const answersResults = await query(`
            SELECT 
                a.id as answer_id,
                a.question_id,
                a.text as answer_text,
                a.is_correct
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            WHERE q.quiz_id = ?
        `, [attempt.quiz_id]);

        // 5. Get responses for this attempt
        const responsesResults = await query(`
            SELECT 
                cr.question_id,
                cr.answer_id,
                cr.time_spent
            FROM candidate_responses cr
            WHERE cr.attempt_id = ?
        `, [attempt.id]);

        // Process the data
        
        // Map answers to their questions
        const answersMap = {};
        answersResults.forEach(answer => {
            if (!answersMap[answer.question_id]) {
                answersMap[answer.question_id] = [];
            }
            answersMap[answer.question_id].push({
                id: answer.answer_id,
                text: answer.answer_text,
                isCorrect: answer.is_correct === 1
            });
        });
        
        // Map responses to their questions
        const responsesMap = {};
        responsesResults.forEach(response => {
            responsesMap[response.question_id] = {
                answerId: response.answer_id,
                timeSpent: response.time_spent
            };
        });
        
        // Process all questions with their answers and user responses
        const processedResponses = [];
        let totalTimeSpent = 0;
        let correctCount = 0;
        
        questionsResults.forEach(question => {
            const questionId = question.question_id;
            const userResponse = responsesMap[questionId] || { answerId: null, timeSpent: 0 };
            
            // Get all answers for this question
            const answers = answersMap[questionId] || [];
            
            // Find the selected answer object and correct answer object
            const selectedAnswer = answers.find(a => a.id === userResponse.answerId) || { 
                id: null, 
                text: 'Aucune réponse sélectionnée', 
                isCorrect: false 
            };
            
            const correctAnswer = answers.find(a => a.isCorrect) || { 
                id: null, 
                text: 'Réponse correcte non disponible', 
                isCorrect: true 
            };
            
            // Check if the answer is correct
            const isCorrect = selectedAnswer.isCorrect;
            
            // Add to correct count if correct
            if (isCorrect) {
                correctCount++;
            }
            
            // Add to total time spent
            totalTimeSpent += userResponse.timeSpent;
            
            // Create response object
            processedResponses.push({
                question: {
                    id: questionId,
                    text: question.question_text,
                    order: question.question_order,
                    points: question.question_points
                },
                selectedAnswer: {
                    id: selectedAnswer.id,
                    text: selectedAnswer.text
                },
                correctAnswer: {
                    id: correctAnswer.id,
                    text: correctAnswer.text
                },
                allAnswers: answers,
                isCorrect: isCorrect,
                timeSpent: userResponse.timeSpent
            });
        });
        
        // Sort responses by question order
        processedResponses.sort((a, b) => a.question.order - b.question.order);
        
        // Calculate percentage
        const totalQuestions = questionsResults.length;
        const percentageScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        
        // Create the final result object
        const result = {
            user: {
                id: user.id,
                mail: user.mail
            },
            quiz: {
                id: attempt.quiz_id,
                title: attempt.quiz_title,
                description: attempt.quiz_description,
                timeLimit: attempt.time_limit
            },
            attempt: {
                id: attempt.id,
                startTime: attempt.start_time,
                endTime: attempt.end_time,
                status: attempt.status,
                score: attempt.score || percentageScore,
                timeSpent: totalTimeSpent
            },
            summary: {
                totalQuestions: totalQuestions,
                correctAnswers: correctCount,
                percentage: percentageScore
            },
            responses: processedResponses
        };
        
        // Send the final response
        res.json(result);
        
    } catch (error) {
        console.error('Error in /data endpoint:', error);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message 
        });
    }
});

module.exports = router;
