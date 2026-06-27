const express = require('express');
const supabase = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST s'inscrire à une formation
router.post('/enroll', verifyToken, async (req, res) => {
    const { formationId } = req.body;

    try {
        // Vérifier si déjà inscrit
        const { data: existing } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', formationId);

        if (existing && existing.length > 0) {
            return res.json({ message: 'Vous êtes déjà inscrit.', alreadyEnrolled: true });
        }

        // Créer l'inscription
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

        res.json({ message: 'Inscription réussie !' });
    } catch (err) {
        console.error('ERREUR inscription:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

// POST marquer une leçon comme terminée
router.post('/lesson/:lessonId/complete', verifyToken, async (req, res) => {
    try {
        const { formationId } = req.body;

        // Vérifier l'inscription
        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', formationId);

        let enrollmentId;
        if (!enrollment || enrollment.length === 0) {
            // Créer l'inscription si pas existante
            const { data: newEnr, error: insertErr } = await supabase
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

            if (insertErr) throw insertErr;
            enrollmentId = newEnr[0].id;
        } else {
            enrollmentId = enrollment[0].id;
        }

        // Vérifier si la leçon est déjà terminée
        const { data: existing } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', req.userId)
            .eq('lesson_id', req.params.lessonId);

        if (existing && existing.length > 0) {
            return res.json({ message: 'Leçon déjà terminée', progress: 0 });
        }

        // Marquer comme terminée
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
        const { data: totalLessons } = await supabase
            .from('modules')
            .select('id')
            .eq('formation_id', formationId);

        const moduleIds = totalLessons ? totalLessons.map(m => m.id) : [];
        let totalCount = 0;
        if (moduleIds.length > 0) {
            const { data: allLessons } = await supabase
                .from('lessons')
                .select('id')
                .in('module_id', moduleIds);
            totalCount = allLessons ? allLessons.length : 0;
        }

        const { data: completedLessons } = await supabase
            .from('lesson_progress')
            .select('id')
            .eq('user_id', req.userId)
            .eq('formation_id', formationId)
            .eq('is_completed', true);

        const completedCount = completedLessons ? completedLessons.length : 0;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // Mettre à jour la progression
        await supabase
            .from('enrollments')
            .update({
                progress_percent: progressPercent,
                completed_lessons: completedCount,
                last_accessed_at: new Date().toISOString()
            })
            .eq('user_id', req.userId)
            .eq('formation_id', formationId);

        res.json({ message: 'Leçon terminée !', progress: progressPercent });
    } catch (err) {
        console.error('ERREUR completion leçon:', err);
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
                formations:formation_id (title, image_url, category)
            `)
            .eq('user_id', req.userId);

        if (error) throw error;

        res.json({ progress: progress || [] });
    } catch (err) {
        console.error('ERREUR progression:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

// GET progression d'une formation spécifique
router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        const { data: progress } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', req.params.formationId);

        const { data: lessonProgress } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', req.params.formationId);

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