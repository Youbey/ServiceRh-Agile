const express = require("express");
const router = express.Router();
const db = require("./../db");

// Helper: Convert ISO string to MySQL DATETIME
function toMySQLDateTime(isoString) {
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
}

router.get("/already-attempted/:token", async (req, res) => {
    const token = req.params.token;
    try {
      const [userRows] = await db.query("SELECT id, quizzID FROM users WHERE token = ?", [token]);
      if (userRows.length === 0) return res.status(404).json({ error: "User not found" });
  
      const { id: userId, quizzID: quizId } = userRows[0];
      const [attempts] = await db.query("SELECT COUNT(*) AS count FROM candidate_attempts WHERE user_id = ? AND quiz_id = ?", [userId, quizId]);
  
      res.json({ alreadyAttempted: attempts[0].count > 0 });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error checking attempt status" });
    }
  });

// GET user info from token
router.get("/user-from-token/:token", async (req, res) => {
  const token = req.params.token;

  try {
    const [rows] = await db.query(
      "SELECT id, mail, quizzID FROM users WHERE token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.mail,
      },
      quiz_id: user.quizzID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET quiz questions and answers
router.get("/quiz-from-token/:quizId", async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId, 10);

    const [questions] = await db.query(
      "SELECT * FROM questions WHERE quiz_id = ? ORDER BY `order` ASC",
      [quizId]
    );

    for (const question of questions) {
      const [answers] = await db.query(
        "SELECT id, text, is_correct FROM answers WHERE question_id = ?",
        [question.id]
      );
      question.answers = answers;
    }

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid quiz ID" });
  }
});

// GET all quizzes
router.get("/quizzes", async (req, res) => {
  try {
    const [quizzes] = await db.query("SELECT * FROM quizzes");
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load quizzes" });
  }
});

// GET one quiz by ID
router.get("/quiz/:id", async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  try {
    const [quizzes] = await db.query("SELECT * FROM quizzes WHERE id = ?", [
      quizId,
    ]);
    if (quizzes.length === 0)
      return res.status(404).json({ error: "Quiz not found" });
    res.json(quizzes[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch quiz" });
  }
});

// POST submit responses
router.post("/submit", async (req, res) => {
  const { token, responses, start_time, end_time } = req.body;

  try {
    // Find the user
    const [userRows] = await db.query(
      "SELECT id, quizzID FROM users WHERE token = ?",
      [token]
    );
    if (userRows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const userId = userRows[0].id;
    const quizId = userRows[0].quizzID;

    // Format timestamps
    const formattedStart = toMySQLDateTime(start_time);
    const formattedEnd = toMySQLDateTime(end_time);

    // Calculate score
    let score = 0;
    for (const response of responses) {
      const [rows] = await db.query(
        "SELECT is_correct FROM answers WHERE id = ? AND question_id = ?",
        [response.answer_id, response.question_id]
      );
      if (rows.length && rows[0].is_correct) {
        const [q] = await db.query(
          "SELECT points FROM questions WHERE id = ?",
          [response.question_id]
        );
        score += q[0].points;
      }
    }

    // Insert into candidate_attempts
    const [attemptResult] = await db.query(
      "INSERT INTO candidate_attempts (user_id, quiz_id, start_time, end_time, status, score) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, quizId, formattedStart, formattedEnd, "completed", score]
    );

    const attemptId = attemptResult.insertId;

    // Insert each response
    for (const resp of responses) {
      await db.query(
        "INSERT INTO candidate_responses (attempt_id, question_id, answer_id, time_spent) VALUES (?, ?, ?, ?)",
        [attemptId, resp.question_id, resp.answer_id, resp.time_spent || 0]
      );
    }

    // Get max score for formatting result
    const [[{ max_score }]] = await db.query(
      "SELECT SUM(points) AS max_score FROM questions WHERE quiz_id = ?",
      [quizId]
    );
    const formattedResult = `${score}/${max_score}`;

    // Calculate time in seconds
    const durationSec = Math.floor((new Date(end_time) - new Date(start_time)) / 1000);

    // Update user result and time
    await db.query(
      "UPDATE users SET result = ?, temps = ? WHERE id = ?",
      [formattedResult, durationSec, userId]
    );

    res.json({ success: true, attemptId, score, result: formattedResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed", details: err.message });
  }
});

// GET candidate results by token
router.get("/results/:token", async (req, res) => {
  const token = req.params.token;
  try {
    const [userRows] = await db.query("SELECT id FROM users WHERE token = ?", [
      token,
    ]);
    if (userRows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const userId = userRows[0].id;
    const [attempts] = await db.query(
      "SELECT * FROM candidate_attempts WHERE user_id = ? ORDER BY end_time DESC",
      [userId]
    );

    res.json({ attempts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch results" });
  }
});

module.exports = router;
