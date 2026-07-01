const express = require('express');
const supabase = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST marquer une lecon comme terminee
router.post('/lesson/:lessonId/complete', verifyToken, async (req, res) => {
    try {
        const { formationId } = req.body;

        // Verifier si l'inscription existe
        let { data: inscription } = await supabase
            .from('inscriptions')
            .select('*')
            .eq('utilisateur_id', req.userId)
            .eq('formation_id', formationId)
            .single();

        let inscriptionId;
        if (!inscription) {
            const { data: newInscription, error: insertError } = await supabase
                .from('inscriptions')
                .insert([{
                    utilisateur_id: req.userId,
                    formation_id: formationId,
                    progression: 0,
                    statut: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (insertError) {
                return res.status(500).json({ message: 'Erreur: ' + insertError.message });
            }
            inscriptionId = newInscription.id;
            inscription = newInscription;
        } else {
            inscriptionId = inscription.id;
        }

        // Verifier si la lecon est deja terminee
        const { data: existing } = await supabase
            .from('lecons_vues')
            .select('*')
            .eq('utilisateur_id', req.userId)
            .eq('lecon_id', req.params.lessonId)
            .single();

        if (existing) {
            return res.json({ message: 'Lecon deja terminee', progress: inscription?.progression || 0 });
        }

        // Marquer la lecon comme terminee
        await supabase
            .from('lecons_vues')
            .insert([{
                utilisateur_id: req.userId,
                lecon_id: req.params.lessonId,
                formation_id: formationId,
                inscription_id: inscriptionId,
                terminee: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);

        // Calculer la progression
        const { count: totalLecons } = await supabase
            .from('lecons')
            .select('*', { count: 'exact', head: true })
            .eq('formation_id', formationId);

        const { count: completedLecons } = await supabase
            .from('lecons_vues')
            .select('*', { count: 'exact', head: true })
            .eq('utilisateur_id', req.userId)
            .eq('formation_id', formationId)
            .eq('terminee', true);

        const progressPercent = totalLecons > 0 
            ? Math.min(Math.round((completedLecons / totalLecons) * 100), 100)
            : 0;

        // Mettre a jour la progression
        await supabase
            .from('inscriptions')
            .update({
                progression: progressPercent,
                updated_at: new Date().toISOString()
            })
            .eq('utilisateur_id', req.userId)
            .eq('formation_id', formationId);

        res.json({ 
            message: 'Lecon terminee !',
            progress: progressPercent
        });
    } catch (err) {
        console.error('ERREUR completion lecon:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

// POST s'inscrire a une formation
router.post('/enroll', verifyToken, async (req, res) => {
    const { formationId } = req.body;

    try {
        const { data: existing } = await supabase
            .from('inscriptions')
            .select('*')
            .eq('utilisateur_id', req.userId)
            .eq('formation_id', formationId)
            .single();

        if (existing) {
            return res.json({ message: 'Vous etes deja inscrit.', alreadyEnrolled: true });
        }

        await supabase
            .from('inscriptions')
            .insert([{
                utilisateur_id: req.userId,
                formation_id: formationId,
                progression: 0,
                statut: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);

        res.json({ message: 'Inscription reussie !' });
    } catch (err) {
        console.error('ERREUR inscription:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

// GET progression de l'utilisateur
router.get('/my', verifyToken, async (req, res) => {
    try {
        const { data: progress, error } = await supabase
            .from('inscriptions')
            .select('*')
            .eq('utilisateur_id', req.userId);

        if (error) {
            console.error('ERREUR progression:', error);
            return res.status(500).json({ message: 'Erreur: ' + error.message });
        }

        // Enrichir avec les infos des formations
        const enrichedProgress = await Promise.all(
            (progress || []).map(async (p) => {
                const { data: formation } = await supabase
                    .from('formations')
                    .select('titre, title, image, duree, niveau, certificat_active')
                    .eq('id', p.formation_id)
                    .single();

                return {
                    ...p,
                    formation_title: formation?.titre || formation?.title || 'Formation',
                    formation_image: formation?.image || null,
                    duration: formation?.duree || 'N/A',
                    level: formation?.niveau || 'Tous niveaux',
                    certificate_enabled: formation?.certificat_active || false,
                    progress: p.progression || 0,
                    progress_percent: p.progression || 0
                };
            })
        );

        res.json({ progress: enrichedProgress });
    } catch (err) {
        console.error('ERREUR progression:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

// GET progression d'une formation specifique
router.get('/formation/:formationId', verifyToken, async (req, res) => {
    try {
        const { data: inscription } = await supabase
            .from('inscriptions')
            .select('*')
            .eq('utilisateur_id', req.userId)
            .eq('formation_id', req.params.formationId)
            .single();

        const { data: leconsVues } = await supabase
            .from('lecons_vues')
            .select('*')
            .eq('utilisateur_id', req.userId)
            .eq('formation_id', req.params.formationId);

        res.json({ 
            enrollment: inscription || null, 
            inscription: inscription || null,
            lessonProgress: leconsVues || [],
            leconsVues: leconsVues || []
        });
    } catch (err) {
        console.error('ERREUR progression formation:', err);
        res.status(500).json({ message: 'Erreur: ' + err.message });
    }
});

module.exports = router;