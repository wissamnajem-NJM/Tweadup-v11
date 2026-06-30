const express = require('express');
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/lesson/:lessonId/complete', verifyToken, async (req, res) => {
    try {
        const { formationId } = req.body;
        if (!formationId) return res.status(400).json({ message: 'formationId requis' });

        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', formationId)
            .single();

        let enrollmentId;
        if (!enrollment) {
            const { data: newEnrollment } = await supabase
                .from('enrollments')
                .insert({ user_id: req.userId, formation_id: formationId, progress_percent: 0, status: 'active' })
                .select()
                .single();
            enrollmentId = newEnrollment.id;
        } else {
            enrollmentId = enrollment.id;
        }

        const { data: existing } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', req.userId)
            .eq('lesson_id', req.params.lessonId)
            .single();

        if (existing) {
            return res.json({ message: 'Leçon déjà terminée', progress: Math.min(enrollment?.progress_percent || 0, 100) });
        }

        await supabase.from('lesson_progress').insert({
            user_id: req.userId,
            lesson_id: req.params.lessonId,
            formation_id: formationId,
            enrollment_id: enrollmentId,
            is_completed: true,
            completed_at: new Date().toISOString()
        });

        // Compter le total des leçons de cette formation
        const { data: modules } = await supabase
            .from('modules')
            .select('id')
            .eq('formation_id', formationId);

        let totalLessonsCount = 0;
        if (modules && modules.length > 0) {
            const moduleIds = modules.map(m => m.id);
            const { count } = await supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true })
                .in('module_id', moduleIds)
                .eq('is_published', true);
            totalLessonsCount = count || 0;
        }

        // Compter les leçons terminées (sans doublons)
        const { data: completedData } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', req.userId)
            .eq('formation_id', formationId)
            .eq('is_completed', true);

        const uniqueCompleted = [...new Set((completedData || []).map(lp => lp.lesson_id))];
        const completedLessons = uniqueCompleted.length;

        const progressPercent = totalLessonsCount > 0
            ? Math.round((completedLessons / totalLessonsCount) * 100)
            : 0;

        const finalProgress = Math.min(progressPercent, 100);

        await supabase
            .from('enrollments')
            .update({ progress_percent: finalProgress, completed_lessons: completedLessons })
            .eq('user_id', req.userId)
            .eq('formation_id', formationId);

        res.json({ message: 'Leçon terminée !', progress: finalProgress });
    } catch (err) {
        console.error('ERREUR:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

router.post('/enroll', verifyToken, async (req, res) => {
    const { formationId } = req.body;
    try {
        const { data: existing } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', formationId)
            .single();

        if (existing) return res.json({ message: 'Déjà inscrit', alreadyEnrolled: true });

        await supabase.from('enrollments').insert({
            user_id: req.userId,
            formation_id: formationId,
            progress_percent: 0,
            status: 'active'
        });

        res.json({ message: 'Inscription réussie !' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

router.get('/my', verifyToken, async (req, res) => {
    try {
        const { data: progress, error } = await supabase
            .from('enrollments')
            .select('*, formations(titre, image)')
            .eq('user_id', req.userId);

        if (error) throw error;

        const formatted = (progress || []).map(p => ({
            ...p,
            formation_title: p.formations?.titre,
            formation_image: p.formations?.image,
            progress_percent: Math.min(p.progress_percent || 0, 100)
        }));

        res.json({ progress: formatted });
    } catch (err) {
        res.status(500).json({ message: 'Erreur' });
    }
});

router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        const { data: enrollment } = await supabase
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

        res.json({
            enrollment: enrollment ? { ...enrollment, progress_percent: Math.min(enrollment.progress_percent || 0, 100) } : null,
            lessonProgress: lessonProgress || []
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur' });
    }
});

module.exports = router;