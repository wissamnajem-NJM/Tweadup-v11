const express = require('express');
const supabase = require('../config/db');

const router = express.Router();

// GET toutes les formations - VERSION SIMPLE
router.get('/', async (req, res) => {
    try {
        const { data: formations, error } = await supabase
            .from('formations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Compter les leçons via une requête simple
        const { data: modules } = await supabase.from('modules').select('id,formation_id');
        const { data: lessons } = await supabase.from('lessons').select('id,module_id');
        const { data: enrollments } = await supabase.from('enrollments').select('id,formation_id');

        const formationsSimple = (formations || []).map(f => {
            const modIds = (modules || []).filter(m => m.formation_id === f.id).map(m => m.id);
            const lesCount = (lessons || []).filter(l => modIds.includes(l.module_id)).length;
            const enrCount = (enrollments || []).filter(e => e.formation_id === f.id).length;

            return {
                ...f,
                image: f.image_url || f.image,
                lessons_count: lesCount,
                enrollments_count: enrCount
            };
        });

        res.json({ formations: formationsSimple });
    } catch (err) {
        console.error('ERREUR formations:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

// GET une formation par ID - VERSION SIMPLE
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

        // Modules
        const { data: modules } = await supabase
            .from('modules')
            .select('*')
            .eq('formation_id', req.params.id)
            .order('sort_order', { ascending: true });

        // Leçons
        const modIds = modules ? modules.map(m => m.id) : [];
        let lessons = [];
        if (modIds.length > 0) {
            const { data: les } = await supabase
                .from('lessons')
                .select('*')
                .in('module_id', modIds)
                .order('sort_order', { ascending: true });
            lessons = les || [];
        }

        // Quizzes
        const { data: quizzes } = await supabase
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