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

async function addToken(token, email) {
    try {
        // Valider les paramètres
        if (!token || !email) {
            throw new Error('Token ou email manquant');
        }


        // Insérer dans la base de données avec le timestamp actuel
        const query = 'INSERT INTO users (mail, token, creation_date) VALUES (?, ?, NOW())';
        const [result] = await db.query(query, [email, token]);

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
    const { email } = req.body;

    try {
        const token = await generateToken(email);
        await addToken(token, email);
        const lien = "http://localhost:3000/quiz?token=" + token;
        res.status(200).json({ token, lien });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;