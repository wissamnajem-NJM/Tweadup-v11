// routes/formations.js - CORRIGÉ
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

        const formationsWithCounts = await Promise.all(
            (formations || []).map(async (formation) => {
                const { count: leconsCount } = await supabase
                    .from('lecons')
                    .select('*', { count: 'exact', head: true })
                    .eq('formation_id', formation.id);

                const { count: inscriptionsCount } = await supabase
                    .from('inscriptions')
                    .select('*', { count: 'exact', head: true })
                    .eq('formation_id', formation.id);

                return {
                    ...formation,
                    lessons_count: leconsCount || 0,
                    lecons_count: leconsCount || 0,
                    enrollments_count: inscriptionsCount || 0,
                    inscriptions_count: inscriptionsCount || 0
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

        const { data: lecons, error: leconsError } = await supabase
            .from('lecons')
            .select('*')
            .eq('formation_id', req.params.id)
            .order('ordre', { ascending: true }); // CORRIGÉ : ordre au lieu de sort_order

        const { data: quizzes, error: quizzesError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('formation_id', req.params.id);

        res.json({ 
            formation: formation, 
            lessons: lecons || [], 
            lecons: lecons || [],
            quizzes: quizzes || [] 
        });
    } catch (err) {
        console.error('ERREUR formation detail:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;