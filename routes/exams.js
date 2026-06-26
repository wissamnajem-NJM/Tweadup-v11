const express = require('express');
const supabase = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET QCM d'une formation
router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        const { data: modules, error: mError } = await supabase
            .from('modules')
            .select('id')
            .eq('formation_id', req.params.formationId)
            .limit(1);

        if (mError) throw mError;

        if (!modules || modules.length === 0) {
            return res.status(404).json({ message: 'Aucun module trouve' });
        }

        const moduleId = modules[0].id;

        const { data: quizzes, error: qError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('module_id', moduleId)
            .eq('is_published', true);

        if (qError) throw qError;

        if (!quizzes || quizzes.length === 0) {
            return res.status(404).json({ message: 'Aucun examen trouve' });
        }

        const quiz = quizzes[0];

        const { data: questions, error: quError } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quiz.id)
            .order('sort_order', { ascending: true });

        if (quError) throw quError;

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
                    question_type: q.question_type,
                    points: q.points || 1,
                    sort_order: q.sort_order,
                    answers: (answers || []).map(a => ({
                        id: a.id,
                        text: a.answer_text,
                        is_correct: a.is_correct
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
            const { data: questionData, error: qError } = await supabase
                .from('quiz_questions')
                .select('points')
                .eq('id', questionId)
                .single();

            if (qError) throw qError;

            const points = questionData?.points || 1;
            totalPoints += points;

            const { data: correctAnswers, error: cError } = await supabase
                .from('quiz_answers')
                .select('*')
                .eq('question_id', questionId)
                .eq('is_correct', true);

            if (cError) throw cError;

            // BUG CORRIGE : score incrémenté si la bonne réponse est sélectionnée
            if (correctAnswers && correctAnswers.length > 0 && correctAnswers[0].id == selectedAnswerId) {
                score += points;
            }
        }

        const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
        const passed = percentage >= 70;

        // Enregistrer la tentative
        const { error: insertError } = await supabase
            .from('quiz_attempts')
            .insert([{
                user_id: req.userId,
                quiz_id: quizId,
                score: percentage,
                is_passed: passed,
                completed_at: new Date().toISOString()
            }]);

        if (insertError) throw insertError;

        // Si réussi, générer certificat
        if (passed) {
            const { error: certError } = await supabase
                .from('certificates')
                .upsert([{
                    user_id: req.userId,
                    formation_id: formationId,
                    issued_at: new Date().toISOString(),
                    status: 'issued'
                }], { onConflict: 'user_id,formation_id' });

            if (certError) throw certError;
        }

        // BUG CORRIGE : réponse renvoyée au client
        res.json({
            passed,
            score: percentage,
            message: passed ? 'Examen réussi' : 'Examen échoué'
        });

    } catch (err) {
        console.error('ERREUR soumission examen:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;