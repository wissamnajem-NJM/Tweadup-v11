const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// GET toutes les formations
router.get('/', async (req, res) => {
    try {
        const [formations] = await pool.query('SELECT * FROM formations ORDER BY created_at DESC');
        res.json({ formations });
    } catch (err) {
        console.error('ERREUR formations:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

// GET une formation par ID
router.get('/:id', async (req, res) => {
    try {
        const [formations] = await pool.query('SELECT * FROM formations WHERE id = ?', [req.params.id]);
        
        if (formations.length === 0) {
            return res.status(404).json({ message: 'Formation non trouvee' });
        }

        const [lessons] = await pool.query('SELECT * FROM lessons WHERE module_id = ? ORDER BY sort_order ASC', [req.params.id]);
        
        res.json({ 
            formation: formations[0], 
            lessons 
        });
    } catch (err) {
        console.error('ERREUR formation detail:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;