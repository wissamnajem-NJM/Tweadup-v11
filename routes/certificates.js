// routes/certificates.js - CORRIGÉ (sans relation formations)
const express = require('express');
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET certificats de l'utilisateur - SANS jointure formations
router.get('/my', verifyToken, async (req, res) => {
    try {
        const { data: certificates, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('user_id', req.userId)
            .order('issued_at', { ascending: false });

        if (error) throw error;

        // Récupérer les titres des formations séparément
        const formatted = await Promise.all((certificates || []).map(async (c) => {
            const { data: formation } = await supabase
                .from('formations')
                .select('titre, image')
                .eq('id', c.formation_id)
                .single();
            
            return {
                ...c,
                formation_title: formation ? formation.titre : 'Formation',
                formation_image: formation ? formation.image : ''
            };
        }));

        res.json({ certificates: formatted });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// GET un certificat spécifique - SANS jointure
router.get('/:formationId', verifyToken, async (req, res) => {
    try {
        console.log('Fetching certificate for formation:', req.params.formationId, 'user:', req.userId);

        const { data: certificate, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', req.params.formationId)
            .single();

        console.log('Certificate found:', certificate);
        console.log('Error:', error);

        if (error || !certificate) {
            return res.status(404).json({ message: 'Certificat non trouve' });
        }

        // Récupérer la formation séparément
        const { data: formation } = await supabase
            .from('formations')
            .select('titre, description')
            .eq('id', req.params.formationId)
            .single();

        // Récupérer l'utilisateur séparément
        const { data: user } = await supabase
            .from('users')
            .select('first_name, last_name, email')
            .eq('id', req.userId)
            .single();

        const formatted = {
            ...certificate,
            formation_title: formation ? formation.titre : 'Formation',
            description: formation ? formation.description : '',
            first_name: user ? user.first_name : '',
            last_name: user ? user.last_name : '',
            email: user ? user.email : ''
        };

        res.json({ certificate: formatted });
    } catch (err) {
        console.error('ERREUR certificat:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;