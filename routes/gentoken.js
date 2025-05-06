const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('./../db');

async function generateToken(email) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Adresse e-mail invalide');
    }

    // Récupérer l'email et la date de création
    const [results] = await db.query('SELECT mail, creation_date FROM users WHERE mail = ?', [email]);

    // Vérifier si l'email existe
    if (results.length > 0) {
        const creationDate = new Date(results[0].creation_date);
        const currentYear = new Date().getFullYear();

        // Vérifier si le compte a été créé pendant l'année en cours
        if (creationDate.getFullYear() === currentYear) {
            throw new Error('Ce compte a été créé cette année, impossible de générer un nouveau token');
        } else {
            throw new Error('Cet e-mail existe déjà');
        }
    }

    const salt = "mySaltIsSecure";
    const data = email + salt;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return hash;
}

async function addToken(token, email, quizId) {
    try {
        // Valider les paramètres
        if (!token || !email || !quizId) {
            throw new Error('Token ou email ou quizId manquant');
        }

        // Insérer dans la base de données avec le timestamp actuel
        const query = 'INSERT INTO users (mail, token, quizzID, creation_date) VALUES (?, ?, ?, NOW())';
        const [result] = await db.query(query, [email, token, quizId]);

        // Vérifier si l'insertion a réussi
        if (result.affectedRows === 0) {
            throw new Error('Échec de l\'ajout du token');
        }

        return { success: true, message: 'Token ajouté avec succès' };
    } catch (error) {
        throw new Error(`Erreur lors de l'ajout du token : ${error.message}`);
    }
}

router.post('/generate', async (req, res) => {
    const { email, quizId } = req.body;

    try {
        const token = await generateToken(email);
        await addToken(token, email, quizId);
        const lien = "http://localhost:3000/quizz?token=" + token;
        res.status(200).json({ token, lien });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/quizzes', async (req, res) => {
    try {
        const query = 'SELECT id, title FROM quizzes';
        const [result] = await db.query(query);

        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'Aucun quiz trouvé' });
        }

        // Transformer title en name
        const quizzes = result.map(quiz => ({
            id: quiz.id,
            name: quiz.title
        }));

        res.status(200).json({ quizzes });
    } catch (error) {
        console.error('Erreur lors de la récupération des quiz:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des quiz' });
    }
});
module.exports = router;