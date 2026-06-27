const express = require('express');
const supabase = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET toutes les formations
router.get('/', async (req, res) => {
    try {
        const { data: formations, error } = await supabase
            .from('formations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formationsWithCounts = await Promise.all(
            (formations || []).map(async (formation) => {
                // Compter les modules de la formation
                const { data: modules, error: mError } = await supabase
                    .from('modules')
                    .select('id')
                    .eq('formation_id', formation.id);

                const moduleIds = modules ? modules.map(m => m.id) : [];
                
                // Compter les leçons des modules
                let lessonsCount = 0;
                if (moduleIds.length > 0) {
                    const { data: lessons, error: lError } = await supabase
                        .from('lessons')
                        .select('id')
                        .in('module_id', moduleIds);
                    lessonsCount = lessons ? lessons.length : 0;
                }

                const { data: enrollments, error: eError } = await supabase
                    .from('enrollments')
                    .select('id')
                    .eq('formation_id', formation.id);

                return {
                    ...formation,
                    image: formation.image_url || formation.image,
                    lessons_count: lessonsCount,
                    enrollments_count: enrollments ? enrollments.length : 0
                };
            })
        );

        res.json({ formations: formationsWithCounts });
    } catch (err) {
        console.error('ERREUR formations:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

// GET une formation par ID
router.get('/:id', async (req, res) => {
    try {
        const { data: formations, error } = await supabase
            .from('formations')
            .select('*')
            .eq('id', req.params.id);

        if (error) throw error;

        if (!formations || formations.length === 0) {
            return res.status(404).json({ message: 'Formation non trouvée' });
        }

        const formation = formations[0];
        formation.image = formation.image_url || formation.image;

        // Récupérer les modules
        const { data: modules, error: mError } = await supabase
            .from('modules')
            .select('*')
            .eq('formation_id', req.params.id)
            .order('sort_order', { ascending: true });

        const moduleIds = modules ? modules.map(m => m.id) : [];

        // Récupérer les leçons des modules
        let lessons = [];
        if (moduleIds.length > 0) {
            const { data: lessonsData, error: lError } = await supabase
                .from('lessons')
                .select('*')
                .in('module_id', moduleIds)
                .order('sort_order', { ascending: true });
            lessons = lessonsData || [];
        }

        const { data: quizzes, error: qError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('formation_id', req.params.id);

        res.json({ 
            formation: formation, 
            lessons: lessons, 
            quizzes: quizzes || [] 
        });
    } catch (err) {
        console.error('ERREUR formation detail:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;