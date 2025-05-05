const express = require('express');
const router = express.Router();

async function generateToken(email) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Invalid email address');
    }

    const salt = "mySaltIsSecure"
    const data = email + salt;

    // Simuler l'API Web Crypto dans Node.js avec le module crypto
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(data).digest('hex');

    return hash;
}

router.post('/generate', async (req, res) => {
    const { email } = req.body;

    try {
        const token = await generateToken(email);
        res.status(200).json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;