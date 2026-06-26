const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST marquer une lecon comme terminee
router.post('/lesson/:lessonId/complete', verifyToken, async (req, res) => {
    try {
        const { formationId } = req.body;

        // Verifier si l'inscription existe, sinon la creer
        let [enrollment] = await pool.query(`
            SELECT * FROM enrollments WHERE user_id = ? AND formation_id = ?
        `, [req.userId, formationId]);

        let enrollmentId;
        if (enrollment.length === 0) {
            // Creer l'inscription et recuperer l'ID
            const [result] = await pool.query(`
                INSERT INTO enrollments (user_id, formation_id, progress_percent, status, created_at, last_accessed_at, started_at, completed_lessons, total_lessons, total_time_spent)
                VALUES (?, ?, 0, 'active', NOW(), NOW(), NOW(), 0, 0, 0)
            `, [req.userId, formationId]);
            enrollmentId = result.insertId;
        } else {
            enrollmentId = enrollment[0].id;
        }

        // Verifier si la lecon est deja terminee
        const [existing] = await pool.query(`
            SELECT * FROM lesson_progress 
            WHERE user_id = ? AND lesson_id = ?
        `, [req.userId, req.params.lessonId]);

        if (existing.length > 0) {
            return res.json({ message: 'Lecon deja terminee', progress: enrollment[0]?.progress_percent || 0 });
        }

        // Marquer la lecon comme terminee avec enrollment_id
        await pool.query(`
            INSERT INTO lesson_progress (user_id, lesson_id, formation_id, enrollment_id, is_completed, completed_at, created_at, updated_at, watch_time, last_position)
            VALUES (?, ?, ?, ?, true, NOW(), NOW(), NOW(), 0, 0)
        `, [req.userId, req.params.lessonId, formationId, enrollmentId]);

        // Calculer la progression
        const [totalLessons] = await pool.query(`
            SELECT COUNT(*) as total FROM lessons WHERE formation_id = ?
        `, [formationId]);

        const [completedLessons] = await pool.query(`
            SELECT COUNT(*) as completed FROM lesson_progress 
            WHERE user_id = ? AND formation_id = ? AND is_completed = true
        `, [req.userId, formationId]);

        const progressPercent = totalLessons[0].total > 0 
            ? Math.round((completedLessons[0].completed / totalLessons[0].total) * 100) 
            : 0;

        // Mettre a jour la progression
        await pool.query(`
            UPDATE enrollments 
            SET progress_percent = ?, completed_lessons = ?, last_accessed_at = NOW() 
            WHERE user_id = ? AND formation_id = ?
        `, [progressPercent, completedLessons[0].completed, req.userId, formationId]);

        res.json({ 
            message: 'Lecon terminee !',
            progress: progressPercent
        });
    } catch (err) {
        console.error('ERREUR completion lecon:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

// POST s'inscrire a une formation
router.post('/enroll', verifyToken, async (req, res) => {
    const { formationId } = req.body;

    try {
        const [existing] = await pool.query(
            'SELECT * FROM enrollments WHERE user_id = ? AND formation_id = ?',
            [req.userId, formationId]
        );

        if (existing.length > 0) {
            return res.json({ message: 'Vous etes deja inscrit.', alreadyEnrolled: true });
        }

        await pool.query(`
            INSERT INTO enrollments (user_id, formation_id, progress_percent, status, created_at, last_accessed_at, started_at, completed_lessons, total_lessons, total_time_spent)
            VALUES (?, ?, 0, 'active', NOW(), NOW(), NOW(), 0, 0, 0)
        `, [req.userId, formationId]);

        res.json({ message: 'Inscription reussie !' });
    } catch (err) {
        console.error('ERREUR inscription:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

// GET progression de l'utilisateur
router.get('/my', verifyToken, async (req, res) => {
    try {
        const [progress] = await pool.query(`
            SELECT p.*, f.title as formation_title, f.image as formation_image
            FROM enrollments p
            JOIN formations f ON p.formation_id = f.id
            WHERE p.user_id = ?
        `, [req.userId]);
        res.json({ progress });
    } catch (err) {
        console.error('ERREUR progression:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

// GET progression d'une formation specifique
router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        const [progress] = await pool.query(`
            SELECT * FROM enrollments 
            WHERE user_id = ? AND formation_id = ?
        `, [req.userId, req.params.formationId]);

        const [lessonProgress] = await pool.query(`
            SELECT * FROM lesson_progress 
            WHERE user_id = ? AND formation_id = ?
        `, [req.userId, req.params.formationId]);

        res.json({ 
            enrollment: progress[0] || null, 
            lessonProgress 
        });
    } catch (err) {
        console.error('ERREUR progression formation:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

module.exports = router;
