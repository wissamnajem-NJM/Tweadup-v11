const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        const modulesResult = await pool.query(`
            SELECT id FROM modules WHERE formation_id = $1 LIMIT 1
        `, [req.params.formationId]);

        if (modulesResult.rows.length === 0) {
            return res.status(404).json({ message: 'Aucun module trouve' });
        }

        const moduleId = modulesResult.rows[0].id;

        const quizzesResult = await pool.query(`
            SELECT * FROM quizzes WHERE module_id = $1 AND is_published = true
        `, [moduleId]);

        if (quizzesResult.rows.length === 0) {
            return res.status(404).json({ message: 'Aucun examen trouve' });
        }

        const quiz = quizzesResult.rows[0];

        const questionsResult = await pool.query(`
            SELECT * FROM quiz_questions 
            WHERE quiz_id = $1
            ORDER BY sort_order ASC, id ASC
        `, [quiz.id]);

        const questionsWithAnswers = await Promise.all(
            questionsResult.rows.map(async (q) => {
                const answersResult = await pool.query(`
                    SELECT id, answer_text as text, is_correct, sort_order
                    FROM quiz_answers 
                    WHERE question_id = $1
                    ORDER BY sort_order ASC, id ASC
                `, [q.id]);

                return {
                    id: q.id,
                    question: q.question,
                    question_type: q.question_type,
                    points: q.points || 1,
                    sort_order: q.sort_order,
                    explanation: q.explanation || '',
                    answers: answersResult.rows.map(a => ({
                        id: a.id,
                        text: a.text,
                        is_correct: a.is_correct === true
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

router.post('/submit', verifyToken, async (req, res) => {
    const { quizId, answers, formationId } = req.body;

    try {
        let score = 0;
        let totalPoints = 0;

        for (const [questionId, selectedAnswerId] of Object.entries(answers)) {
            const questionResult = await pool.query(`
                SELECT points FROM quiz_questions WHERE id = $1
            `, [questionId]);

            const points = questionResult.rows[0]?.points || 1;
            totalPoints += points;

            const correctResult = await pool.query(`
                SELECT * FROM quiz_answers 
                WHERE question_id = $1 AND is_correct = true
            `, [questionId]);

            if (correctResult.rows.length > 0 && correctResult.rows[0].id == selectedAnswerId) {
                score += points;
            }
        }

        const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
        const passed = percentage >= 70;

        await pool.query(`
            INSERT INTO quiz_attempts (user_id, quiz_id, score, is_passed, completed_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [req.userId, quizId, percentage, passed]);

        if (passed) {
            await pool.query(`
                INSERT INTO certificates (user_id, formation_id, issued_at, status)
                VALUES ($1, $2, NOW(), 'issued')
                ON CONFLICT (user_id, formation_id) DO UPDATE SET issued_at = NOW(), status = 'issued'
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