const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/my', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, f.title as formation_title, f.image as formation_image,
                   u.first_name, u.last_name
            FROM certificates c
            JOIN formations f ON c.formation_id = f.id
            JOIN users u ON c.user_id = u.id
            WHERE c.user_id = $1
            ORDER BY c.issued_at DESC
        `, [req.userId]);
        res.json({ certificates: result.rows });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.get('/:formationId', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, f.title as formation_title, f.description,
                   u.first_name, u.last_name, u.email
            FROM certificates c
            JOIN formations f ON c.formation_id = f.id
            JOIN users u ON c.user_id = u.id
            WHERE c.user_id = $1 AND c.formation_id = $2
        `, [req.userId, req.params.formationId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Certificat non trouvé' });
        }

        res.json({ certificate: result.rows[0] });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;