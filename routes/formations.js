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

        // Pour chaque formation, compter les lecons
        const formationsWithCounts = await Promise.all(
            (formations || []).map(async (formation) => {
                const { data: lessons, error: lError } = await supabase
                    .from('lessons')
                    .select('id')
                    .eq('formation_id', formation.id);

                const { data: enrollments, error: eError } = await supabase
                    .from('enrollments')
                    .select('id')
                    .eq('formation_id', formation.id);

                return {
                    ...formation,
                    lessons_count: lessons ? lessons.length : 0,
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
            return res.status(404).json({ message: 'Formation non trouvee' });
        }

        const { data: lessons, error: lError } = await supabase
            .from('lessons')
            .select('*')
            .eq('formation_id', req.params.id)
            .order('sort_order', { ascending: true });

        const { data: quizzes, error: qError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('formation_id', req.params.id);

        res.json({ 
            formation: formations[0], 
            lessons: lessons || [], 
            quizzes: quizzes || [] 
        });
    } catch (err) {
        console.error('ERREUR formation detail:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;