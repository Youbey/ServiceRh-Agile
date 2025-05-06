var express = require('express');
var router = express.Router();
var path = require('path');
const db = require('./../db');




// API endpoint to serve the results data
router.get('/resultatsCandidats/data', function(req, res, next) {
    // In a real application, you would fetch this data from the database
    // For now, we'll return static mock data


    async function fetchQuizData(token, attemptId) {
        console.log(`Démarrage de la récupération des données pour le token: ${token} et attemptId: ${attemptId}`);

        try {
            // Étape 1 : Vérification du token dans la table users
            console.log('Exécution de la requête pour vérifier le token dans la table users...');
            const query1 = 'SELECT quizzID, mail, result FROM users WHERE token = ?';
            const [userResult] = await db.query(query1, [token]);

            // Vérification si un utilisateur a été trouvé
            if (!userResult || userResult.length === 0) {
                console.warn('Aucun utilisateur trouvé pour le token fourni.');
                return {
                    success: false,
                    message: 'Aucun utilisateur trouvé pour ce token'
                };
            }

            console.log(`Utilisateur trouvé: mail=${userResult[0].mail}, quizzID=${userResult[0].quizzID}`);

            // Étape 2 : Récupération des détails de la tentative
            console.log('Exécution de la requête pour récupérer les détails de la tentative...');
            const query2 = `
            SELECT 
                q.title AS quizTitle,
                ca.user_id AS userId,
                ca.id AS attemptId,
                COUNT(CASE WHEN a.is_correct = TRUE THEN 1 END) AS correctAnswers,
                COUNT(DISTINCT q2.id) AS totalQuestions,
                (COUNT(CASE WHEN a.is_correct = TRUE THEN 1 END) / COUNT(DISTINCT q2.id) * 100) AS percentage,
                SUM(cr.time_spent) AS totalTimeSpent,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', q2.id,
                        'text', q2.text,
                        'order', q2.\`order\`,
                        'points', q2.points,
                        'timeSpent', cr.time_spent,
                        'isCorrect', a.is_correct,
                        'selectedAnswerId', cr.answer_id,
                        'answers', (
                            SELECT 
                                JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'id', a2.id,
                                        'text', a2.text,
                                        'isCorrect', a2.is_correct
                                    )
                                )
                            FROM 
                                answers a2
                            WHERE 
                                a2.question_id = q2.id
                        )
                    )
                ) AS questions
            FROM 
                quizzes q
                JOIN candidate_attempts ca ON q.id = ca.quiz_id
                JOIN candidate_responses cr ON ca.id = cr.attempt_id
                JOIN questions q2 ON cr.question_id = q2.id
                LEFT JOIN answers a ON cr.answer_id = a.id
            WHERE 
                ca.id = ?;
        `;

            const [attemptResult] = await db.query(query2, [attemptId]);

            // Vérification si des détails de tentative ont été trouvés
            if (!attemptResult || attemptResult.length === 0) {
                console.warn('Aucune tentative trouvée pour l\'attemptId fourni.');
                return {
                    success: false,
                    message: 'Aucune tentative trouvée pour cet attemptId'
                };
            }

            console.log('Détails de la tentative récupérés avec succès.');

            // Étape 3 : Construction de la réponse
            const response = {
                success: true,
                data: {
                    quizTitle: attemptResult[0].quizTitle,
                    userId: attemptResult[0].userId,
                    attemptId: attemptResult[0].attemptId,
                    correctAnswers: attemptResult[0].correctAnswers,
                    totalQuestions: attemptResult[0].totalQuestions,
                    percentage: attemptResult[0].percentage,
                    totalTimeSpent: attemptResult[0].totalTimeSpent,
                    questions: JSON.parse(attemptResult[0].questions), // Parser le JSON des questions
                    user: {
                        mail: userResult[0].mail,
                        quizzID: userResult[0].quizzID,
                        result: userResult[0].result
                    }
                }
            };

            console.log('Données formatées avec succès. Retour de la réponse.');
            return response;

        } catch (error) {
            console.error(`Erreur lors de la récupération des données: ${error.message}`);
            console.error('Détails de l\'erreur:', error.stack);
            return {
                success: false,
                message: `Erreur lors de la récupération des données: ${error.message}`
            };
        }
    }

    var result = fetchQuizData(token, 1)


    res.json(result);

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


});

module.exports = router;
