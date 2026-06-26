const express = require('express');
const supabase = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET certificats de l'utilisateur
router.get('/my', verifyToken, async (req, res) => {
    try {
        const { data: certificates, error } = await supabase
            .from('certificates')
            .select(`
                *,
                formations:formation_id (title, image_url),
                users:user_id (first_name, last_name)
            `)
            .eq('user_id', req.userId)
            .order('issued_at', { ascending: false });

        if (error) throw error;

        res.json({ certificates: certificates || [] });
    } catch (err) {
        console.error('ERREUR certificats:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// GET un certificat spécifique
router.get('/:formationId', verifyToken, async (req, res) => {
    try {
        const { data: certificates, error } = await supabase
            .from('certificates')
            .select(`
                *,
                formations:formation_id (title, description),
                users:user_id (first_name, last_name, email)
            `)
            .eq('user_id', req.userId)
            .eq('formation_id', req.params.formationId);

        if (error) throw error;

        if (!certificates || certificates.length === 0) {
            return res.status(404).json({ message: 'Certificat non trouve' });
        }

        res.json({ certificate: certificates[0] });

    // BUG CORRIGE : catch unique et bien formé + fermeture du router.get
    } catch (err) {
        console.error('ERREUR certificat:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;