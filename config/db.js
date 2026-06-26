const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tweadup_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test de connexion
pool.getConnection()
    .then(conn => {
        console.log('Connecte a la base de donnees MySQL');
        conn.release();
    })
    .catch(err => {
        console.error('ERREUR connexion MySQL:', err.message);
        console.error('Verifiez que MySQL est demarre et que la base tweadup_db existe.');
    });

module.exports = pool;
