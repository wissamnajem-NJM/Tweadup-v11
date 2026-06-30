const express = require('express');
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        const { data: quizzes } = await supabase
            .from('quizzes')
            .select('*')
            .eq('formation_id', req.params.formationId);

        if (!quizzes || quizzes.length === 0) {
            return res.status(404).json({ message: 'Aucun examen' });
        }

        const quiz = quizzes[0];

        const { data: questions } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quiz.id)
            .order('sort_order', { ascending: true });

        const questionsWithAnswers = await Promise.all(
            (questions || []).map(async (q) => {
                const { data: answers } = await supabase
                    .from('quiz_answers')
                    .select('id, answer_text, is_correct, sort_order')
                    .eq('question_id', q.id)
                    .order('sort_order', { ascending: true });

                return {
                    id: q.id,
                    question: q.question,
                    points: q.points || 1,
                    answers: (answers || []).map(a => ({
                        id: a.id,
                        text: a.answer_text,
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
                questions: questionsWithAnswers
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur' });
    }
});

router.post('/submit', verifyToken, async (req, res) => {
    try {
        const { quizId, answers, formationId } = req.body;
        
        console.log('SUBMIT - answers:', answers);
        console.log('SUBMIT - formationId:', formationId);

        if (!answers || Object.keys(answers).length === 0) {
            return res.status(400).json({ message: 'Aucune réponse' });
        }

        let score = 0;
        let totalPoints = 0;

        for (const [questionId, selectedAnswerId] of Object.entries(answers)) {
            totalPoints += 1;

            const { data: correctAnswers } = await supabase
                .from('quiz_answers')
                .select('*')
                .eq('question_id', questionId)
                .eq('is_correct', true);

            if (correctAnswers && correctAnswers.length > 0) {
                console.log('Q' + questionId + ': correct=' + correctAnswers[0].id + ' selected=' + selectedAnswerId);
                if (correctAnswers[0].id == selectedAnswerId) {
                    score += 1;
                }
            }
        }

        const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
        const passed = percentage >= 70;

        console.log('RESULT:', score, '/', totalPoints, '=', percentage, '% passed:', passed);

        // Sauvegarder la tentative
        await supabase.from('quiz_attempts').insert({
            user_id: req.userId,
            quiz_id: quizId,
            score: percentage,
            completed_at: new Date().toISOString()
        });

        // Créer le certificat si réussi
        if (passed) {
            const { data: existing } = await supabase
                .from('certificates')
                .select('*')
                .eq('user_id', req.userId)
                .eq('formation_id', formationId)
                .single();

            if (existing) {
                await supabase.from('certificates').update({
                    quiz_score: percentage,
                    issued_at: new Date().toISOString()
                }).eq('user_id', req.userId).eq('formation_id', formationId);
            } else {
                await supabase.from('certificates').insert({
                    user_id: req.userId,
                    formation_id: formationId,
                    quiz_score: percentage,
                    issued_at: new Date().toISOString()
                });
            }
        }

        res.json({
            score: score,
            totalPoints: totalPoints,
            percentage: percentage,
            passed: passed,
            message: passed ? 'Félicitations !' : 'Réessayez !'
        });
    } catch (err) {
        console.error('ERREUR:', err);
        res.status(500).json({ message: 'Erreur' });
    }
});

module.exports = router;