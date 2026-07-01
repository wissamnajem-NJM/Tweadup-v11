const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERREUR: SUPABASE_URL et SUPABASE_ANON_KEY sont requis dans .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Connecte a Supabase');

module.exports = supabase;