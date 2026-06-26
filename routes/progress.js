const express = require('express');
const supabase = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST marquer une lecon comme terminee
router.post('/lesson/:lessonId/complete', verifyToken, async (req, res) => {
    try {
        const { formationId } = req.body;

        // Verifier si l'inscription existe
        const { data: enrollment, error: eError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', formationId);

        if (eError) throw eError;

        let enrollmentId;
        if (!enrollment || enrollment.length === 0) {
            // Creer l'inscription
            const { data: newEnrollment, error: insertError } = await supabase
                .from('enrollments')
                .insert([{
                    user_id: req.userId,
                    formation_id: formationId,
                    progress_percent: 0,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    last_accessed_at: new Date().toISOString(),
                    started_at: new Date().toISOString(),
                    completed_lessons: 0,
                    total_lessons: 0,
                    total_time_spent: 0
                }])
                .select();

            if (insertError) throw insertError;
            enrollmentId = newEnrollment[0].id;
        } else {
            enrollmentId = enrollment[0].id;
        }

        // Verifier si la lecon est deja terminee
        const { data: existing, error: exError } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', req.userId)
            .eq('lesson_id', req.params.lessonId);

        if (exError) throw exError;

        if (existing && existing.length > 0) {
            return res.json({ 
                message: 'Lecon deja terminee', 
                progress: enrollment[0]?.progress_percent || 0 
            });
        }

        // Marquer la lecon comme terminee
        const { error: lpError } = await supabase
            .from('lesson_progress')
            .insert([{
                user_id: req.userId,
                lesson_id: req.params.lessonId,
                formation_id: formationId,
                enrollment_id: enrollmentId,
                is_completed: true,
                completed_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                watch_time: 0,
                last_position: 0
            }]);

        if (lpError) throw lpError;

        // Calculer la progression
        const { data: totalLessons, error: tlError } = await supabase
            .from('lessons')
            .select('id')
            .eq('formation_id', formationId);

        if (tlError) throw tlError;

        const { data: completedLessons, error: clError } = await supabase
            .from('lesson_progress')
            .select('id')
            .eq('user_id', req.userId)
            .eq('formation_id', formationId)
            .eq('is_completed', true);

        if (clError) throw clError;

        const totalCount = totalLessons ? totalLessons.length : 0;
        const completedCount = completedLessons ? completedLessons.length : 0;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // Mettre a jour la progression
        const { error: upError } = await supabase
            .from('enrollments')
            .update({
                progress_percent: progressPercent,
                completed_lessons: completedCount,
                last_accessed_at: new Date().toISOString()
            })
            .eq('user_id', req.userId)
            .eq('formation_id', formationId);

        if (upError) throw upError;

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
        const { data: existing, error: eError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', formationId);

        if (eError) throw eError;

        if (existing && existing.length > 0) {
            return res.json({ message: 'Vous etes deja inscrit.', alreadyEnrolled: true });
        }

        const { error: insertError } = await supabase
            .from('enrollments')
            .insert([{
                user_id: req.userId,
                formation_id: formationId,
                progress_percent: 0,
                status: 'active',
                created_at: new Date().toISOString(),
                last_accessed_at: new Date().toISOString(),
                started_at: new Date().toISOString(),
                completed_lessons: 0,
                total_lessons: 0,
                total_time_spent: 0
            }]);

        if (insertError) throw insertError;

        res.json({ message: 'Inscription reussie !' });
    } catch (err) {
        console.error('ERREUR inscription:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

// GET progression de l'utilisateur
router.get('/my', verifyToken, async (req, res) => {
    try {
        const { data: progress, error } = await supabase
            .from('enrollments')
            .select(`
                *,
                formations:formation_id (title, image_url)
            `)
            .eq('user_id', req.userId);

        if (error) throw error;

        res.json({ progress: progress || [] });
    } catch (err) {
        console.error('ERREUR progression:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

// GET progression d'une formation specifique
router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        const { data: progress, error: pError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', req.params.formationId);

        if (pError) throw pError;

        const { data: lessonProgress, error: lpError } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', req.params.formationId);

        if (lpError) throw lpError;

        res.json({ 
            enrollment: progress && progress.length > 0 ? progress[0] : null, 
            lessonProgress: lessonProgress || [] 
        });
    } catch (err) {
        console.error('ERREUR progression formation:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

module.exports = router;