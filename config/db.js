const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
    .then(() => console.log('Connecte a PostgreSQL (Supabase)'))
    .catch(err => console.error('ERREUR connexion PostgreSQL:', err.message));

module.exports = pool;