const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool(process.env.DATABASE_URL);

// Test de connexion
pool.getConnection()
    .then(conn => {
        console.log('Connecte a la base de donnees MySQL (Railway)');
        conn.release();
    })
    .catch(err => {
        console.error('ERREUR connexion MySQL:', err.message);
    });

module.exports = pool;