const express = require('express');
const supabase = require('../config/db');

const router = express.Router();

// GET toutes les formations
router.get('/', async (req, res) => {
    try {
        // Récupérer toutes les formations
        const { data: formations, error } = await supabase
            .from('formations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Récupérer tous les modules, leçons et inscriptions en UNE SEULE FOIS
        const { data: allModules } = await supabase.from('modules').select('id,formation_id');
        const { data: allLessons } = await supabase.from('lessons').select('id,module_id');
        const { data: allEnrollments } = await supabase.from('enrollments').select('id,formation_id');

        const formationsWithCounts = (formations || []).map(f => {
            // Trouver les modules de cette formation
            const modIds = (allModules || [])
                .filter(m => m.formation_id === f.id)
                .map(m => m.id);

            // Compter les leçons de ces modules
            const lesCount = (allLessons || [])
                .filter(l => modIds.includes(l.module_id))
                .length;

            // Compter les inscriptions
            const enrCount = (allEnrollments || [])
                .filter(e => e.formation_id === f.id)
                .length;

            return {
                ...f,
                image: f.image_url || f.image,
                lessons_count: lesCount,
                enrollments_count: enrCount
            };
        });

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

        // Récupérer les modules de cette formation
        const { data: modules } = await supabase
            .from('modules')
            .select('*')
            .eq('formation_id', req.params.id)
            .order('sort_order', { ascending: true });

        // Récupérer les leçons de ces modules
        const moduleIds = modules ? modules.map(m => m.id) : [];
        let lessons = [];
        if (moduleIds.length > 0) {
            const { data: lessonsData } = await supabase
                .from('lessons')
                .select('*')
                .in('module_id', moduleIds)
                .order('sort_order', { ascending: true });
            lessons = lessonsData || [];
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