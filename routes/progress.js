const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/lesson/:lessonId/complete', verifyToken, async (req, res) => {
    try {
        const { formationId } = req.body;

        const enrollmentResult = await pool.query(`
            SELECT * FROM enrollments WHERE user_id = $1 AND formation_id = $2
        `, [req.userId, formationId]);

        let enrollmentId;
        if (enrollmentResult.rows.length === 0) {
            const insertResult = await pool.query(`
                INSERT INTO enrollments (user_id, formation_id, progress_percent, status, created_at, last_accessed_at, started_at, completed_lessons, total_lessons, total_time_spent)
                VALUES ($1, $2, 0, 'active', NOW(), NOW(), NOW(), 0, 0, 0)
                RETURNING id
            `, [req.userId, formationId]);
            enrollmentId = insertResult.rows[0].id;
        } else {
            enrollmentId = enrollmentResult.rows[0].id;
        }

        const existingResult = await pool.query(`
            SELECT * FROM lesson_progress 
            WHERE user_id = $1 AND lesson_id = $2
        `, [req.userId, req.params.lessonId]);

        if (existingResult.rows.length > 0) {
            return res.json({ message: 'Lecon deja terminee', progress: enrollmentResult.rows[0]?.progress_percent || 0 });
        }

        await pool.query(`
            INSERT INTO lesson_progress (user_id, lesson_id, formation_id, enrollment_id, is_completed, completed_at, created_at, updated_at, watch_time, last_position)
            VALUES ($1, $2, $3, $4, true, NOW(), NOW(), NOW(), 0, 0)
        `, [req.userId, req.params.lessonId, formationId, enrollmentId]);

        const totalResult = await pool.query(`
            SELECT COUNT(*) as total FROM lessons WHERE formation_id = $1
        `, [formationId]);

        const completedResult = await pool.query(`
            SELECT COUNT(*) as completed FROM lesson_progress 
            WHERE user_id = $1 AND formation_id = $2 AND is_completed = true
        `, [req.userId, formationId]);

        const totalLessons = parseInt(totalResult.rows[0].total);
        const completedLessons = parseInt(completedResult.rows[0].completed);
        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        await pool.query(`
            UPDATE enrollments 
            SET progress_percent = $1, completed_lessons = $2, last_accessed_at = NOW() 
            WHERE user_id = $3 AND formation_id = $4
        `, [progressPercent, completedLessons, req.userId, formationId]);

        res.json({ 
            message: 'Lecon terminee !',
            progress: progressPercent
        });
    } catch (err) {
        console.error('ERREUR completion lecon:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

router.post('/enroll', verifyToken, async (req, res) => {
    const { formationId } = req.body;

    try {
        const existingResult = await pool.query(
            'SELECT * FROM enrollments WHERE user_id = $1 AND formation_id = $2',
            [req.userId, formationId]
        );

        if (existingResult.rows.length > 0) {
            return res.json({ message: 'Vous etes deja inscrit.', alreadyEnrolled: true });
        }

        await pool.query(`
            INSERT INTO enrollments (user_id, formation_id, progress_percent, status, created_at, last_accessed_at, started_at, completed_lessons, total_lessons, total_time_spent)
            VALUES ($1, $2, 0, 'active', NOW(), NOW(), NOW(), 0, 0, 0)
        `, [req.userId, formationId]);

        res.json({ message: 'Inscription reussie !' });
    } catch (err) {
        console.error('ERREUR inscription:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

router.get('/my', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, f.title as formation_title, f.image as formation_image
            FROM enrollments p
            JOIN formations f ON p.formation_id = f.id
            WHERE p.user_id = $1
        `, [req.userId]);
        res.json({ progress: result.rows });
    } catch (err) {
        console.error('ERREUR progression:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        const progressResult = await pool.query(`
            SELECT * FROM enrollments 
            WHERE user_id = $1 AND formation_id = $2
        `, [req.userId, req.params.formationId]);

        const lessonResult = await pool.query(`
            SELECT * FROM lesson_progress 
            WHERE user_id = $1 AND formation_id = $2
        `, [req.userId, req.params.formationId]);

        res.json({ 
            enrollment: progressResult.rows[0] || null, 
            lessonProgress: lessonResult.rows 
        });
    } catch (err) {
        console.error('ERREUR progression formation:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

module.exports = router;