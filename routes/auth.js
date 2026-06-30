const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');

const router = express.Router();

router.post('/register', [
    body('first_name').notEmpty().withMessage('Prenom requis'),
    body('last_name').notEmpty().withMessage('Nom requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe min 6 caracteres')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, email, password } = req.body;

    try {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(400).json({ message: 'Cet email est deja utilise.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: user, error } = await supabase
            .from('users')
            .insert({
                first_name,
                last_name,
                email,
                password: hashedPassword,
                role_id: 3,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        const token = jwt.sign(
            { userId: user.id, email, role_id: 3 },
            process.env.JWT_SECRET || 'tweadup_secret_key_2024',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Compte cree avec succes !',
            token,
            user: { id: user.id, first_name, last_name, email, role_id: 3 }
        });
    } catch (err) {
        console.error('ERREUR INSCRIPTION:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

router.post('/login', [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role_id: user.role_id },
            process.env.JWT_SECRET || 'tweadup_secret_key_2024',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Connexion reussie !',
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role_id: user.role_id
            }
        });
    } catch (err) {
        console.error('ERREUR CONNEXION:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

module.exports = router;