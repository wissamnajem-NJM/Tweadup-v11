const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT f.*, c.name as category_name, c.color as category_color
            FROM formations f
            LEFT JOIN categories c ON f.category_id = c.id
            ORDER BY f.created_at DESC
        `);
        const formations = result.rows;

        const formationsWithCounts = await Promise.all(
            formations.map(async (formation) => {
                const lessonsResult = await pool.query(
                    'SELECT COUNT(*) as count FROM lessons WHERE formation_id = $1',
                    [formation.id]
                );
                const enrollResult = await pool.query(
                    'SELECT COUNT(*) as count FROM enrollments WHERE formation_id = $1',
                    [formation.id]
                );
                return {
                    ...formation,
                    lessons_count: parseInt(lessonsResult.rows[0].count),
                    enrollments_count: parseInt(enrollResult.rows[0].count)
                };
            })
        );

        res.json({ formations: formationsWithCounts });
    } catch (err) {
        console.error('ERREUR formations:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT f.*, c.name as category_name, c.color as category_color
            FROM formations f
            LEFT JOIN categories c ON f.category_id = c.id
            WHERE f.id = $1
        `, [req.params.id]);
        const formations = result.rows;

        if (formations.length === 0) {
            return res.status(404).json({ message: 'Formation non trouvee' });
        }

        const lessonsResult = await pool.query(`
            SELECT * FROM lessons 
            WHERE formation_id = $1 
            ORDER BY sort_order ASC, id ASC
        `, [req.params.id]);

        const quizzesResult = await pool.query(`
            SELECT * FROM quizzes 
            WHERE formation_id = $1
        `, [req.params.id]);

        res.json({ 
            formation: formations[0], 
            lessons: lessonsResult.rows, 
            quizzes: quizzesResult.rows 
        });
    } catch (err) {
        console.error('ERREUR formation detail:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;