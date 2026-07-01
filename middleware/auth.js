const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acces refuse. Token manquant.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tweadup_secret_key_2024');
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userRole = decoded.role_id;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide ou expire.' });
    }
};

module.exports = { verifyToken };