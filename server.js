const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/formations', require('./routes/formations'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/certificates', require('./routes/certificates'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/catalogue', (req, res) => res.sendFile(path.join(__dirname, 'public', 'catalogue.html')));
app.get('/formation/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'formation.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'profile.html')));
app.get('/exam/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'exam.html')));
app.get('/certificate/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'certificate.html')));

app.listen(PORT, () => {
    console.log('========================================');
    console.log('  TWEADUP SERVEUR DEMARRE');
    console.log('  http://localhost:' + PORT);
    console.log('  Version: 3.0 - SUPABASE');
    console.log('========================================');
});