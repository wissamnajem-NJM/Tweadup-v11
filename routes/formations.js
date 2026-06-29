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

        if (error) throw error;

        res.json({ formations: formations || [] });
    } catch (err) {
        console.error('ERREUR formations:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

// GET une formation par ID
router.get('/:id', async (req, res) => {
    try {
        const { data: formations, error: formationError } = await supabase
            .from('formations')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (formationError) throw formationError;

        if (!formations) {
            return res.status(404).json({ message: 'Formation non trouvee' });
        }

        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', req.params.id)
            .order('sort_order', { ascending: true });

        if (lessonsError) throw lessonsError;

        res.json({ 
            formation: formations, 
            lessons: lessons || []
        });
    } catch (err) {
        console.error('ERREUR formation detail:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;    