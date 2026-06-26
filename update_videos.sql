
-- Mettre a jour les lecons avec des liens video YouTube valides (embed)
UPDATE lessons SET 
    video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    content = '<h3>Introduction au HTML</h3><p>Dans cette lecon, vous apprendrez les bases du HTML, le langage de balisage essentiel pour creer des pages web. Nous couvrirons les balises principales, la structure d un document HTML et les bonnes pratiques.</p><h4>Ce que vous allez apprendre :</h4><ul><li>Structure de base d une page HTML</li><li>Les balises essentielles</li><li>Les attributs HTML</li><li>Formulaires et inputs</li></ul>',
    video_duration = 600
WHERE id = 1;

UPDATE lessons SET 
    video_url = 'https://www.youtube.com/embed/UB1O30fR-EE',
    content = '<h3>Les bases du CSS</h3><p>Le CSS (Cascading Style Sheets) permet de styliser vos pages HTML. Dans cette lecon, vous apprendrez a utiliser les selecteurs, les proprietes de style et a creer des mises en page modernes.</p><h4>Points cles :</h4><ul><li>Selecteurs CSS</li><li>Box Model</li><li>Flexbox</li><li>Grid Layout</li></ul>',
    video_duration = 720
WHERE id = 2;

UPDATE lessons SET 
    video_url = 'https://www.youtube.com/embed/W6NZfCO5SIk',
    content = '<h3>JavaScript Fondamentaux</h3><p>JavaScript est le langage de programmation du web. Cette lecon couvre les variables, les fonctions, les boucles et les conditions.</p><h4>Contenu :</h4><ul><li>Variables et types de donnees</li><li>Fonctions et portee</li><li>Boucles et conditions</li><li>Tableaux et objets</li></ul>',
    video_duration = 900
WHERE id = 3;

UPDATE lessons SET 
    video_url = 'https://www.youtube.com/embed/Ke90Tje7VS0',
    content = '<h3>Introduction a React</h3><p>React est une bibliotheque JavaScript pour construire des interfaces utilisateur. Decouvrez les composants, le state et les props.</p><h4>Objectifs :</h4><ul><li>Comprendre les composants</li><li>Gerer le state</li><li>Utiliser les props</li><li>Cycle de vie des composants</li></ul>',
    video_duration = 1200
WHERE id = 4;

UPDATE lessons SET 
    video_url = 'https://www.youtube.com/embed/TlB_eWDSMt4',
    content = '<h3>Node.js et Express</h3><p>Apprenez a creer un serveur backend avec Node.js et Express. Nous aborderons les routes, les middlewares et les API REST.</p><h4>Competences :</h4><ul><li>Creer un serveur Express</li><li>Definir des routes</li><li>Utiliser les middlewares</li><li>Connecter une base de donnees</li></ul>',
    video_duration = 1500
WHERE id = 5;

UPDATE lessons SET 
    video_url = 'https://www.youtube.com/embed/pKd0Rpw7O48',
    content = '<h3>Base de donnees MySQL</h3><p>Decouvrez comment stocker et recuperer des donnees avec MySQL. Cette lecon couvre les requetes SQL de base.</p><h4>Points abordes :</h4><ul><li>CREATE, READ, UPDATE, DELETE</li><li>Jointures</li><li>Index et optimisation</li><li>Relations entre tables</li></ul>',
    video_duration = 1080
WHERE id = 6;

UPDATE lessons SET 
    video_url = 'https://www.youtube.com/embed/2eebpy71fXk',
    content = '<h3>Authentification et Securite</h3><p>Apprenez a securiser votre application avec JWT, le hashage des mots de passe et les bonnes pratiques de securite.</p><h4>Securite :</h4><ul><li>JWT Tokens</li><li>Hashage bcrypt</li><li>Protection XSS</li><li>CSRF</li></ul>',
    video_duration = 900
WHERE id = 7;

UPDATE lessons SET 
    video_url = 'https://www.youtube.com/embed/3aGSqasVPsA',
    content = '<h3>Deploiement et Production</h3><p>Derniere etape : deployer votre application en production. Nous verrons Heroku, Vercel et les bonnes pratiques.</p><h4>Deploiement :</h4><ul><li>Variables d environnement</li><li>CI/CD</li><li>Monitoring</li><li>Scaling</li></ul>',
    video_duration = 720
WHERE id = 8;

UPDATE lessons SET 
    video_url = 'https://www.youtube.com/embed/0pThnRneDjw',
    content = '<h3>Projet Final</h3><p>Mettez en pratique tout ce que vous avez appris en construisant une application web complete de A a Z.</p><h4>Projet :</h4><ul><li>Architecture MVC</li><li>API RESTful</li><li>Frontend React</li><li>Tests unitaires</li></ul>',
    video_duration = 1800
WHERE id = 9;

SELECT 'Videos mises a jour !' as message;
