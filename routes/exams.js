const express = require('express');
const supabase = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET QCM d'une formation
router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        // D'abord trouver le module de cette formation
        const { data: modules, error: modError } = await supabase
            .from('modules')
            .select('id')
            .eq('formation_id', req.params.formationId)
            .limit(1);

        if (!modules || modules.length === 0) {
            return res.status(404).json({ message: 'Aucun module trouve' });
        }

        const moduleId = modules[0].id;

        const { data: quizzes, error: quizError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('module_id', moduleId)
            .eq('is_published', true);

        if (!quizzes || quizzes.length === 0) {
            return res.status(404).json({ message: 'Aucun examen trouve' });
        }

        const quiz = quizzes[0];

        // Recuperer les questions
        const { data: questions, error: qError } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quiz.id)
            .order('sort_order', { ascending: true });

        // Pour chaque question, recuperer ses reponses
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
                    explanation: q.explanation || '',
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
            const { data: questionData } = await supabase
                .from('quiz_questions')
                .select('points')
                .eq('id', questionId)
                .single();

            const points = questionData?.points || 1;
            totalPoints += points;

            const { data: correctAnswers } = await supabase
                .from('quiz_answers')
                .select('*')
                .eq('question_id', questionId)
                .eq('is_correct', true);

            if (correctAnswers && correctAnswers.length > 0 && correctAnswers[0].id == selectedAnswerId) {
                score += points;
            }
        }

        const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
        const passed = percentage >= 70;

        // Enregistrer la tentative
        await supabase
            .from('quiz_attempts')
            .insert([{
                user_id: req.userId,
                quiz_id: quizId,
                score: percentage,
                passed: passed,
                completed_at: new Date().toISOString()
            }]);

        // Si reussi, generer certificat
        if (passed) {
            await supabase
                .from('certificates')
                .upsert([{
                    user_id: req.userId,
                    formation_id: formationId,
                    issued_at: new Date().toISOString(),
                    status: 'issued'
                }], { onConflict: 'user_id,formation_id' });
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