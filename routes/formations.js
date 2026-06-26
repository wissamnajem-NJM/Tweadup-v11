const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET toutes les formations
router.get('/', async (req, res) => {
    try {
        const [formations] = await pool.query(`
            SELECT f.*, c.name as category_name, c.color as category_color
            FROM tweadup_formations f
            LEFT JOIN categories c ON f.category_id = c.id
            ORDER BY f.created_at DESC
        `);

        // Pour chaque formation, compter les lecons et inscriptions
        const formationsWithCounts = await Promise.all(
            formations.map(async (formation) => {
                const [lessonsCount] = await pool.query(
                    'SELECT COUNT(*) as count FROM tweadup_lessons WHERE formation_id = ?',
                    [formation.id]
                );
                const [enrollCount] = await pool.query(
                    'SELECT COUNT(*) as count FROM enrollments WHERE formation_id = ?',
                    [formation.id]
                );
                return {
                    ...formation,
                    lessons_count: lessonsCount[0].count,
                    enrollments_count: enrollCount[0].count
                };
            })
        );

        res.json({ formations: formationsWithCounts });
    } catch (err) {
        console.error('ERREUR formations:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

// GET une formation par ID
router.get('/:id', async (req, res) => {
    try {
        const [formations] = await pool.query(`
            SELECT f.*, c.name as category_name, c.color as category_color
            FROM tweadup_formations f
            LEFT JOIN categories c ON f.category_id = c.id
            WHERE f.id = ?
        `, [req.params.id]);

        if (formations.length === 0) {
            return res.status(404).json({ message: 'Formation non trouvee' });
        }

        const [lessons] = await pool.query(`
            SELECT * FROM tweadup_lessons 
            WHERE formation_id = ? 
            ORDER BY sort_order ASC, id ASC
        `, [req.params.id]);

        const [quizzes] = await pool.query(`
            SELECT * FROM tweadup_quizzes 
            WHERE formation_id = ?
        `, [req.params.id]);

        res.json({ 
            formation: formations[0], 
            lessons, 
            quizzes 
        });
    } catch (err) {
        console.error('ERREUR formation detail:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;
