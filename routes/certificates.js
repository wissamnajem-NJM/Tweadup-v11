const express = require('express');
const supabase = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET certificats de l'utilisateur
router.get('/my', verifyToken, async (req, res) => {
    try {
        const { data: certificates, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('user_id', req.userId)
            .order('issued_at', { ascending: false });

        if (error) {
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        // Enrichir avec les infos des formations et users
        const enriched = await Promise.all(
            (certificates || []).map(async (c) => {
                const { data: formation } = await supabase
                    .from('formations')
                    .select('titre, title, image')
                    .eq('id', c.formation_id)
                    .single();

                const { data: user } = await supabase
                    .from('users')
                    .select('first_name, last_name')
                    .eq('id', c.user_id)
                    .single();

                return {
                    ...c,
                    formation_title: formation?.titre || formation?.title || 'Formation',
                    formation_image: formation?.image || null,
                    first_name: user?.first_name,
                    last_name: user?.last_name
                };
            })
        );

        res.json({ certificates: enriched });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// GET un certificat specifique
router.get('/:formationId', verifyToken, async (req, res) => {
    try {
        const { data: certificate, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('user_id', req.userId)
            .eq('formation_id', req.params.formationId)
            .single();

        if (error || !certificate) {
            return res.status(404).json({ message: 'Certificat non trouvé' });
        }

        // Enrichir
        const { data: formation } = await supabase
            .from('formations')
            .select('titre, title, description')
            .eq('id', certificate.formation_id)
            .single();

        const { data: user } = await supabase
            .from('users')
            .select('first_name, last_name, email')
            .eq('id', certificate.user_id)
            .single();

        const enriched = {
            ...certificate,
            formation_title: formation?.titre || formation?.title || 'Formation',
            description: formation?.description,
            first_name: user?.first_name,
            last_name: user?.last_name,
            email: user?.email
        };

        res.json({ certificate: enriched });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;