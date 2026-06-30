const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { data: formations, error } = await supabase
            .from('formations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = formations.map(f => ({
            id: f.id,
            title: f.titre,
            category_name: f.categorie,
            level: f.niveau,
            description: f.description,
            short_description: f.description,
            image: f.image,
            lessons_count: f.nombre_lecons,
            duration: f.duree_totale,
            created_at: f.created_at
        }));

        res.json({ formations: formatted });
    } catch (err) {
        console.error('ERREUR formations:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { data: formation, error } = await supabase
            .from('formations')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !formation) {
            return res.status(404).json({ message: 'Formation non trouvee' });
        }

        const { data: modules, error: moduleError } = await supabase
            .from('modules')
            .select('id')
            .eq('formation_id', req.params.id)
            .order('sort_order', { ascending: true })
            .limit(1);

        let lessons = [];
        
        if (modules && modules.length > 0) {
            const moduleId = modules[0].id;
            
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lessons')
                .select('*')
                .eq('module_id', moduleId)
                .eq('is_published', true)
                .order('sort_order', { ascending: true });

            if (lessonsData) {
                lessons = lessonsData;
            }
        }

        const formattedFormation = {
            id: formation.id,
            title: formation.titre,
            category_name: formation.categorie,
            level: formation.niveau,
            description: formation.description,
            image: formation.image,
            lessons_count: lessons.length || formation.nombre_lecons,
            duration: formation.duree_totale,
            created_at: formation.created_at
        };

        res.json({
            formation: formattedFormation,
            lessons: lessons
        });
    } catch (err) {
        console.error('ERREUR formation detail:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;