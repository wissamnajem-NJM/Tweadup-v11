const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET certificats de l'utilisateur
router.get('/my', verifyToken, async (req, res) => {
    try {
        const [certificates] = await pool.query(`
            SELECT c.*, f.title as formation_title, f.image as formation_image,
                   u.first_name, u.last_name
            FROM certificates c
            JOIN formations f ON c.formation_id = f.id
            JOIN users u ON c.user_id = u.id
            WHERE c.user_id = ?
            ORDER BY c.issued_at DESC
        `, [req.userId]);
        res.json({ certificates });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// GET un certificat spécifique
router.get('/:formationId', verifyToken, async (req, res) => {
    try {
        const [certificates] = await pool.query(`
            SELECT c.*, f.title as formation_title, f.description,
                   u.first_name, u.last_name, u.email
            FROM certificates c
            JOIN formations f ON c.formation_id = f.id
            JOIN users u ON c.user_id = u.id
            WHERE c.user_id = ? AND c.formation_id = ?
        `, [req.userId, req.params.formationId]);

        if (certificates.length === 0) {
            return res.status(404).json({ message: 'Certificat non trouvé' });
        }

        res.json({ certificate: certificates[0] });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
