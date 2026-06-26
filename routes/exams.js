const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET QCM d'une formation
router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        // D'abord trouver le module de cette formation
        const [modules] = await pool.query(`
            SELECT id FROM modules WHERE formation_id = ? LIMIT 1
        `, [req.params.formationId]);

        if (modules.length === 0) {
            return res.status(404).json({ message: 'Aucun module trouve' });
        }

        const moduleId = modules[0].id;

        const [quizzes] = await pool.query(`
            SELECT * FROM quizzes WHERE module_id = ? AND is_published = 1
        `, [moduleId]);

        if (quizzes.length === 0) {
            return res.status(404).json({ message: 'Aucun examen trouve' });
        }

        const quiz = quizzes[0];

        // Recuperer les questions
        const [questions] = await pool.query(`
            SELECT * FROM quiz_questions 
            WHERE quiz_id = ?
            ORDER BY sort_order ASC, id ASC
        `, [quiz.id]);

        // Pour chaque question, recuperer ses reponses
        const questionsWithAnswers = await Promise.all(
            questions.map(async (q) => {
                const [answers] = await pool.query(`
                    SELECT id, answer_text as text, is_correct, sort_order
                    FROM quiz_answers 
                    WHERE question_id = ?
                    ORDER BY sort_order ASC, id ASC
                `, [q.id]);

                return {
                    id: q.id,
                    question: q.question,
                    question_type: q.question_type,
                    points: q.points || 1,
                    sort_order: q.sort_order,
                    explanation: q.explanation || '',
                    answers: answers.map(a => ({
                        id: a.id,
                        text: a.text,
                        is_correct: a.is_correct === 1 || a.is_correct === true
                    }))
                };
            })
        );

        res.json({ 
            quiz: { 
                id: quiz.id, 
                title: quiz.title, 
                description: quiz.description,
                passing_score: quiz.passing_score || 70,
                time_limit: quiz.time_limit,
                max_attempts: quiz.max_attempts || 3,
                questions: questionsWithAnswers
            }
        });
    } catch (err) {
        console.error('ERREUR examen:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

// POST soumettre un examen
router.post('/submit', verifyToken, async (req, res) => {
    const { quizId, answers, formationId } = req.body;

    try {
        let score = 0;
        let totalPoints = 0;

        for (const [questionId, selectedAnswerId] of Object.entries(answers)) {
            const [questionData] = await pool.query(`
                SELECT points FROM quiz_questions WHERE id = ?
            `, [questionId]);

            const points = questionData[0]?.points || 1;
            totalPoints += points;

            const [correctAnswers] = await pool.query(`
                SELECT * FROM quiz_answers 
                WHERE question_id = ? AND is_correct = true
            `, [questionId]);

            if (correctAnswers.length > 0 && correctAnswers[0].id == selectedAnswerId) {
                score += points;
            }
        }

        const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
        const passed = percentage >= 70;

        // Enregistrer la tentative
        await pool.query(`
            INSERT INTO quiz_attempts (user_id, quiz_id, score, passed, completed_at)
            VALUES (?, ?, ?, ?, NOW())
        `, [req.userId, quizId, percentage, passed]);

        // Si reussi, generer certificat
        if (passed) {
            await pool.query(`
                INSERT INTO certificates (user_id, formation_id, issued_at, status)
                VALUES (?, ?, NOW(), 'issued')
                ON DUPLICATE KEY UPDATE issued_at = NOW(), status = 'issued'
            `, [req.userId, formationId]);
        }

        res.json({
            score,
            totalPoints,
            percentage,
            passed,
            message: passed ? 'Felicitations ! Vous avez reussi l examen !' : 'Vous n avez pas atteint la note minimale (70%). Reessayez !'
        });
    } catch (err) {
        console.error('ERREUR soumission examen:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;
