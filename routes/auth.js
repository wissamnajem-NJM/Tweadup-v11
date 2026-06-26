const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');

const router = express.Router();

// INSCRIPTION
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
    console.log('Tentative inscription:', email);

    try {
        // Verifier si l'email existe deja
        const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            console.log('Email deja utilise:', email);
            return res.status(400).json({ message: 'Cet email est deja utilise.' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Mot de passe hashe');

        // Creer l'utilisateur
        const insertResult = await pool.query(
            `INSERT INTO users (first_name, last_name, email, password, role, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, 'student', NOW(), NOW()) RETURNING id`,
            [first_name, last_name, email, hashedPassword]
        );
        const userId = insertResult.rows[0].id;
        console.log('Utilisateur cree, ID:', userId);

        // Generer le token
        const token = jwt.sign(
            { userId: userId, email, role: 'student' },
            process.env.JWT_SECRET || 'secret_key_2024',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Compte cree avec succes !',
            token,
            user: { id: userId, first_name, last_name, email, role: 'student' }
        });
    } catch (err) {
        console.error('ERREUR INSCRIPTION:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

// CONNEXION
router.post('/login', [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('Tentative connexion:', email);

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            console.log('Utilisateur non trouve:', email);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Mot de passe correspond:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret_key_2024',
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
                role: user.role,
                avatar: user.avatar_url
            }
        });
    } catch (err) {
        console.error('ERREUR CONNEXION:', err);
        res.status(500).json({ message: 'Erreur serveur: ' + err.message });
    }
});

// PROFIL UTILISATEUR
router.get('/profile', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Non authentifie' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_2024');
        const result = await pool.query(
            'SELECT id, first_name, last_name, email, role, avatar_url, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouve' });
        }

        res.json({ user: result.rows[0] });
    } catch (err) {
        res.status(403).json({ message: 'Token invalide' });
    }
});

module.exports = router;