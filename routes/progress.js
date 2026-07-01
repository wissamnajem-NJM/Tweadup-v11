const express = require('express');
const supabase = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST marquer une lecon comme terminee
router.post('/lesson/:lessonId/complete', verifyToken, async (req, res) => {
    try {
        const { formationId } = req.body;

        // Verifier si l'inscription existe
        let { data: enrollment, error: enrollError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', formationId)
            .single();

        let enrollmentId;
        if (!enrollment) {
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
                .select()
                .single();

            if (insertError) {
                return res.status(500).json({ message: 'Erreur: ' + insertError.message });
            }
            enrollmentId = newEnrollment.id;
            enrollment = newEnrollment;
        } else {
            enrollmentId = enrollment.id;
        }

        // Verifier si la lecon est deja terminee
        const { data: existing } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', req.userId)
            .eq('lesson_id', req.params.lessonId)
            .single();

        if (existing) {
            return res.json({ message: 'Lecon deja terminee', progress: enrollment?.progress_percent || 0 });
        }

        // Marquer la lecon comme terminee
        await supabase
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

        // Calculer la progression
        const { count: totalLessons } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('formation_id', formationId);

        const { count: completedLessons } = await supabase
            .from('lesson_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.userId)
            .eq('formation_id', formationId)
            .eq('is_completed', true);

        const progressPercent = totalLessons > 0 
            ? Math.round((completedLessons / totalLessons) * 100) 
            : 0;

        // Mettre a jour la progression
        await supabase
            .from('enrollments')
            .update({
                progress_percent: progressPercent,
                completed_lessons: completedLessons,
                last_accessed_at: new Date().toISOString()
            })
            .eq('user_id', req.userId)
            .eq('formation_id', formationId);

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
        const { data: existing } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', formationId)
            .single();

        if (existing) {
            return res.json({ message: 'Vous etes deja inscrit.', alreadyEnrolled: true });
        }

        await supabase
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
            .select('*')
            .eq('user_id', req.userId);

        if (error) {
            console.error('ERREUR progression:', error);
            return res.status(500).json({ message: 'Erreur: ' + error.message });
        }

        // Enrichir avec les infos des formations
        const enrichedProgress = await Promise.all(
            (progress || []).map(async (p) => {
                const { data: formation } = await supabase
                    .from('formations')
                    .select('titre, title, image')
                    .eq('id', p.formation_id)
                    .single();

                return {
                    ...p,
                    formation_title: formation?.titre || formation?.title || 'Formation',
                    formation_image: formation?.image || null
                };
            })
        );

        res.json({ progress: enrichedProgress });
    } catch (err) {
        console.error('ERREUR progression:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

// GET progression d'une formation specifique
router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        const { data: progress } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', req.params.formationId)
            .single();

        const { data: lessonProgress } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', req.params.formationId);

        // Retourner null au lieu de 403 si pas inscrit
        res.json({ 
            enrollment: progress || null, 
            lessonProgress: lessonProgress || [] 
        });
    } catch (err) {
        console.error('ERREUR progression formation:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

module.exports = router;