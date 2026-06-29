const express = require('express');
const supabase = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET QCM d'une formation (PROTEGE - necessite connexion)
router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        const { data: quizzes, error: qError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('formation_id', req.params.formationId)
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

// POST soumettre un examen (PROTEGE - necessite connexion)
router.post('/submit', verifyToken, async (req, res) => {
    const { quizId, answers, formationId } = req.body;

    try {
        let correctCount = 0;  // Nombre de bonnes reponses
        let totalQuestions = 0;  // Nombre total de questions

        // Filtrer les reponses vides ou invalides
        const validAnswers = Object.entries(answers).filter(([questionId, answerId]) => {
            return questionId && answerId && answerId !== '' && answerId !== 'null' && answerId !== 'undefined';
        });

        for (const [questionId, selectedAnswerId] of validAnswers) {
            // Verifier que la question existe
            const { data: questionData, error: qError } = await supabase
                .from('quiz_questions')
                .select('id, points')
                .eq('id', questionId)
                .single();

            if (qError || !questionData) continue;  // Question inexistante, on ignore

            totalQuestions += 1;

            // Verifier si la reponse est correcte
            const { data: correctAnswers, error: cError } = await supabase
                .from('quiz_answers')
                .select('id')
                .eq('question_id', questionId)
                .eq('is_correct', true);

            if (cError) continue;

            if (correctAnswers && correctAnswers.length > 0) {
                const correctAnswerId = correctAnswers[0].id.toString();
                const selectedId = selectedAnswerId.toString();

                if (correctAnswerId === selectedId) {
                    correctCount += 1;
                }
            }
        }

        // Calculer le pourcentage
        const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
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

        // Si reussi, generer certificat
        if (passed) {
            const { error: certError } = await supabase
                .from('certificates')
                .upsert([{
                    user_id: req.userId,
                    formation_id: formationId,
                    issued_at: new Date().toISOString()
                }], { onConflict: 'user_id,formation_id' });

            if (certError) throw certError;
        }

        // Reponse au client (AVEC les bonnes variables)
        res.json({
            passed,
            score: percentage,           // Pourcentage (ex: 85)
            correctCount: correctCount, // Bonnes reponses (ex: 24)
            totalQuestions: totalQuestions, // Total questions (ex: 29)
            message: passed ? 'Examen reussi' : 'Examen echoue'
        });

    } catch (err) {
        console.error('ERREUR soumission examen:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;