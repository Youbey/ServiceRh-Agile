var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Welcome to Quiz System');
});

// Route for rh stats page
router.get('/stats', function(req, res, next) {
  const rootDir = path.join(__dirname, '..');
  res.sendFile(path.join(rootDir, 'views', 'stats.html'));
});

// Mock data endpoint for stats
router.get('/stats/data', function(req, res) {
  // Mock data based on your database schema
  const mockData = {
    quizzes: [
      { id: 1, title: "JavaScript Avancé", time_limit: 1800 },
      { id: 2, title: "HTML/CSS Fondamentaux", time_limit: 1200 },
      { id: 3, title: "Algorithms", time_limit: 1500 }
    ],
    candidates: [
      {
        id: 1,
        mail: "candidat1@example.com",
        quiz_id: 1,
        quiz_title: "JavaScript Avancé",
        score: "8/10",
        percentage: 80,
        time_spent: 765, // seconds
        date: "2023-05-15T14:30:00Z",
        attempt_id: 101
      },
      {
        id: 2,
        mail: "candidat2@example.com",
        quiz_id: 1,
        quiz_title: "JavaScript Avancé",
        score: "6/10",
        percentage: 60,
        time_spent: 900,
        date: "2023-05-16T10:15:00Z",
        attempt_id: 102
      },
      {
        id: 3,
        mail: "candidat3@example.com",
        quiz_id: 2,
        quiz_title: "HTML/CSS Fondamentaux",
        score: "9/10",
        percentage: 90,
        time_spent: 600,
        date: "2023-05-17T16:45:00Z",
        attempt_id: 103
      },
      {
        id: 4,
        mail: "candidat4@example.com",
        quiz_id: 3,
        quiz_title: "Algorithms",
        score: "5/10",
        percentage: 50,
        time_spent: 1200,
        date: "2023-05-18T09:20:00Z",
        attempt_id: 104
      }
    ],
    summary: {
      total_candidates: 4,
      avg_score: 70,
      completion_rate: 100,
      avg_time: 866
    }
  };

  res.json(mockData);
});


// Route for results page
router.get('/resultats', function(req, res, next) {
  const rootDir = path.join(__dirname, '..');
  res.sendFile(path.join(rootDir, 'views', 'resultats.html'));
});

// API endpoint to serve the results data
router.get('/resultats/data', function(req, res, next) {
  // In a real application, you would fetch this data from the database
  // For now, we'll return static mock data
  
  const mockResultData = {
    quizTitle: "JavaScript Avancé",
    userId: 123,
    attemptId: 456,
    correctAnswers: 8,
    totalQuestions: 10,
    percentage: 80,
    totalTimeSpent: 765, // seconds
    questions: [
      {
        id: 1,
        text: "Quelle méthode est utilisée pour ajouter un élément à la fin d'un tableau en JavaScript?",
        order: 1,
        points: 10,
        timeSpent: 45, // seconds
        isCorrect: true,
        selectedAnswerId: 3,
        answers: [
          { id: 1, text: "array.add()", isCorrect: false },
          { id: 2, text: "array.insert()", isCorrect: false },
          { id: 3, text: "array.push()", isCorrect: true },
          { id: 4, text: "array.append()", isCorrect: false }
        ]
      },
      {
        id: 2,
        text: "Comment déclarer une constante en JavaScript?",
        order: 2,
        points: 10,
        timeSpent: 32,
        isCorrect: true,
        selectedAnswerId: 7,
        answers: [
          { id: 5, text: "var x = 5;", isCorrect: false },
          { id: 6, text: "let x = 5;", isCorrect: false },
          { id: 7, text: "const x = 5;", isCorrect: true },
          { id: 8, text: "constant x = 5;", isCorrect: false }
        ]
      },
      {
        id: 3,
        text: "Quel est le résultat de '2' + 2 en JavaScript?",
        order: 3,
        points: 10,
        timeSpent: 60,
        isCorrect: true,
        selectedAnswerId: 9,
        answers: [
          { id: 9, text: "'22'", isCorrect: true },
          { id: 10, text: "4", isCorrect: false },
          { id: 11, text: "NaN", isCorrect: false },
          { id: 12, text: "Error", isCorrect: false }
        ]
      },
      {
        id: 4,
        text: "Quelle méthode est utilisée pour sélectionner un élément par son ID en JavaScript?",
        order: 4,
        points: 10,
        timeSpent: 28,
        isCorrect: true,
        selectedAnswerId: 14,
        answers: [
          { id: 13, text: "document.findElement()", isCorrect: false },
          { id: 14, text: "document.getElementById()", isCorrect: true },
          { id: 15, text: "document.querySelector()", isCorrect: false },
          { id: 16, text: "document.getElement()", isCorrect: false }
        ]
      },
      {
        id: 5,
        text: "Comment créer une fonction en JavaScript?",
        order: 5,
        points: 10,
        timeSpent: 40,
        isCorrect: true,
        selectedAnswerId: 17,
        answers: [
          { id: 17, text: "function maFonction() {}", isCorrect: true },
          { id: 18, text: "def maFonction() {}", isCorrect: false },
          { id: 19, text: "create maFonction() {}", isCorrect: false },
          { id: 20, text: "new Function() {}", isCorrect: false }
        ]
      },
      {
        id: 6,
        text: "Comment vérifier si une variable est un tableau en JavaScript?",
        order: 6,
        points: 10,
        timeSpent: 55,
        isCorrect: true,
        selectedAnswerId: 24,
        answers: [
          { id: 21, text: "typeof variable === 'array'", isCorrect: false },
          { id: 22, text: "variable instanceof Array", isCorrect: false },
          { id: 23, text: "variable.isArray()", isCorrect: false },
          { id: 24, text: "Array.isArray(variable)", isCorrect: true }
        ]
      },
      {
        id: 7,
        text: "Quelle méthode convertit un objet JavaScript en chaîne JSON?",
        order: 7,
        points: 10,
        timeSpent: 47,
        isCorrect: true,
        selectedAnswerId: 25,
        answers: [
          { id: 25, text: "JSON.stringify()", isCorrect: true },
          { id: 26, text: "JSON.parse()", isCorrect: false },
          { id: 27, text: "JSON.toString()", isCorrect: false },
          { id: 28, text: "JSON.convert()", isCorrect: false }
        ]
      },
      {
        id: 8,
        text: "Comment accéder au premier élément d'un tableau en JavaScript?",
        order: 8,
        points: 10,
        timeSpent: 33,
        isCorrect: true,
        selectedAnswerId: 29,
        answers: [
          { id: 29, text: "array[0]", isCorrect: true },
          { id: 30, text: "array(1)", isCorrect: false },
          { id: 31, text: "array.first()", isCorrect: false },
          { id: 32, text: "array.get(0)", isCorrect: false }
        ]
      },
      {
        id: 9,
        text: "Quel opérateur est utilisé pour la comparaison stricte en JavaScript?",
        order: 9,
        points: 10,
        timeSpent: 37,
        isCorrect: false,
        selectedAnswerId: 34,
        answers: [
          { id: 33, text: "==", isCorrect: false },
          { id: 34, text: "=", isCorrect: false },
          { id: 35, text: "===", isCorrect: true },
          { id: 36, text: "!==", isCorrect: false }
        ]
      },
      {
        id: 10,
        text: "Comment déclarer une classe en JavaScript moderne?",
        order: 10,
        points: 10,
        timeSpent: 68,
        isCorrect: false,
        selectedAnswerId: 39,
        answers: [
          { id: 37, text: "class MaClasse {}", isCorrect: true },
          { id: 38, text: "function MaClasse() {}", isCorrect: false },
          { id: 39, text: "new Class MaClasse {}", isCorrect: false },
          { id: 40, text: "create MaClasse {}", isCorrect: false }
        ]
      }
    ]
  };
  
  res.json(mockResultData);
});

module.exports = router;
