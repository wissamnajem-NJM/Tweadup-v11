const express = require('express');
const supabase = require('../config/db');

const router = express.Router();

// GET toutes les formations
router.get('/', async (req, res) => {
    try {
        const { data: formations, error } = await supabase
            .from('formations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('ERREUR formations:', error);
            return res.status(500).json({ message: 'Erreur serveur: ' + error.message });
        }

        // Pour chaque formation, compter les lecons et inscriptions
        const formationsWithCounts = await Promise.all(
            (formations || []).map(async (formation) => {
                const { count: lessonsCount } = await supabase
                    .from('lessons')
                    .select('*', { count: 'exact', head: true })
                    .eq('formation_id', formation.id);

                const { count: enrollCount } = await supabase
                    .from('enrollments')
                    .select('*', { count: 'exact', head: true })
                    .eq('formation_id', formation.id);

                return {
                    ...formation,
                    lessons_count: lessonsCount || 0,
                    enrollments_count: enrollCount || 0
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
        const { data: formation, error: formError } = await supabase
            .from('formations')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (formError || !formation) {
            return res.status(404).json({ message: 'Formation non trouvee' });
        }

        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('formation_id', req.params.id)
            .order('sort_order', { ascending: true });

        const { data: quizzes, error: quizzesError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('formation_id', req.params.id);

        res.json({ 
            formation: formation, 
            lessons: lessons || [], 
            quizzes: quizzes || [] 
        });
    } catch (err) {
        console.error('ERREUR formation detail:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;