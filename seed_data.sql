-- ============================================
-- SCRIPT D'INSERTION DE DONNEES POUR TWEADUP
-- ============================================

-- Inserer un QCM pour la formation 1 (Developpement Web Full Stack)
INSERT INTO quizzes (formation_id, title, description, passing_score, max_attempts, time_limit, is_published, created_at) 
VALUES (1, 'Examen Final - Developpement Web', 'Testez vos connaissances en HTML, CSS, JavaScript et React', 70, 3, 30, 1, NOW());

-- Questions pour le QCM
INSERT INTO quiz_questions (quiz_id, question, question_type, points, sort_order, created_at) VALUES
(1, 'Quelle balise HTML est utilisee pour creer un lien hypertexte ?', 'qcm', 1, 1, NOW()),
(1, 'Quelle propriete CSS permet de changer la couleur du texte ?', 'qcm', 1, 2, NOW()),
(1, 'Quel mot-cle est utilise pour declarer une variable en JavaScript moderne ?', 'qcm', 1, 3, NOW()),
(1, 'Quelle methode React est appelee apres le rendu initial du composant ?', 'qcm', 1, 4, NOW()),
(1, 'Quel est le port par defaut de Node.js/Express ?', 'qcm', 1, 5, NOW()),
(1, 'Quelle commande npm installe les dependances ?', 'qcm', 1, 6, NOW()),
(1, 'Quel est le role de package.json ?', 'qcm', 1, 7, NOW()),
(1, 'Quelle balise HTML5 est utilisee pour la navigation ?', 'qcm', 1, 8, NOW()),
(1, 'Quelle unite CSS est relative a la taille de la police parent ?', 'qcm', 1, 9, NOW()),
(1, 'Quel framework CSS est le plus populaire ?', 'qcm', 1, 10, NOW());

-- Reponses pour la question 1
INSERT INTO quiz_answers (question_id, answer_text, is_correct, sort_order, created_at) VALUES
(1, '<a>', 1, 1, NOW()), (1, '<link>', 0, 2, NOW()), (1, '<href>', 0, 3, NOW()), (1, '<url>', 0, 4, NOW());

-- Reponses pour la question 2
INSERT INTO quiz_answers (question_id, answer_text, is_correct, sort_order, created_at) VALUES
(2, 'text-color', 0, 1, NOW()), (2, 'color', 1, 2, NOW()), (2, 'font-color', 0, 3, NOW()), (2, 'text-style', 0, 4, NOW());

-- Reponses pour la question 3
INSERT INTO quiz_answers (question_id, answer_text, is_correct, sort_order, created_at) VALUES
(3, 'var', 0, 1, NOW()), (3, 'let', 1, 2, NOW()), (3, 'const', 1, 3, NOW()), (3, 'variable', 0, 4, NOW());

-- Reponses pour la question 4
INSERT INTO quiz_answers (question_id, answer_text, is_correct, sort_order, created_at) VALUES
(4, 'componentDidMount', 1, 1, NOW()), (4, 'render', 0, 2, NOW()), (4, 'constructor', 0, 3, NOW()), (4, 'init', 0, 4, NOW());

-- Reponses pour la question 5
INSERT INTO quiz_answers (question_id, answer_text, is_correct, sort_order, created_at) VALUES
(5, '3000', 1, 1, NOW()), (5, '8080', 0, 2, NOW()), (5, '5000', 0, 3, NOW()), (5, '8000', 0, 4, NOW());

-- Reponses pour la question 6
INSERT INTO quiz_answers (question_id, answer_text, is_correct, sort_order, created_at) VALUES
(6, 'npm install', 1, 1, NOW()), (6, 'npm get', 0, 2, NOW()), (6, 'npm download', 0, 3, NOW()), (6, 'npm fetch', 0, 4, NOW());

-- Reponses pour la question 7
INSERT INTO quiz_answers (question_id, answer_text, is_correct, sort_order, created_at) VALUES
(7, 'Gerer les dependances et scripts', 1, 1, NOW()), (7, 'Stocker les images', 0, 2, NOW()), (7, 'Configurer le serveur', 0, 3, NOW()), (7, 'Creer la base de donnees', 0, 4, NOW());

-- Reponses pour la question 8
INSERT INTO quiz_answers (question_id, answer_text, is_correct, sort_order, created_at) VALUES
(8, '<nav>', 1, 1, NOW()), (8, '<menu>', 0, 2, NOW()), (8, '<navbar>', 0, 3, NOW()), (8, '<navigation>', 0, 4, NOW());

-- Reponses pour la question 9
INSERT INTO quiz_answers (question_id, answer_text, is_correct, sort_order, created_at) VALUES
(9, 'px', 0, 1, NOW()), (9, 'em', 1, 2, NOW()), (9, 'cm', 0, 3, NOW()), (9, 'pt', 0, 4, NOW());

-- Reponses pour la question 10
INSERT INTO quiz_answers (question_id, answer_text, is_correct, sort_order, created_at) VALUES
(10, 'Bootstrap', 1, 1, NOW()), (10, 'jQuery', 0, 2, NOW()), (10, 'React', 0, 3, NOW()), (10, 'Angular', 0, 4, NOW());

-- Mise a jour des lecons avec du contenu
UPDATE lessons SET video_url = 'https://www.youtube.com/watch?v=UB1O30fR-EE', content = '<h3>Introduction au HTML</h3><p>Dans cette lecon, vous apprendrez les bases du HTML.</p>', video_duration = 600 WHERE id = 1;
UPDATE lessons SET video_url = 'https://www.youtube.com/watch?v=yfoY53QX3L8', content = '<h3>Les bases du CSS</h3><p>Le CSS permet de styliser vos pages HTML.</p>', video_duration = 720 WHERE id = 2;
UPDATE lessons SET video_url = 'https://www.youtube.com/watch?v=hdI2bqOjy3c', content = '<h3>JavaScript Fondamentaux</h3><p>JavaScript est le langage de programmation du web.</p>', video_duration = 900 WHERE id = 3;
UPDATE lessons SET video_url = 'https://www.youtube.com/watch?v=Ke90Tje7VS0', content = '<h3>Introduction a React</h3><p>React est une bibliotheque JavaScript pour construire des interfaces.</p>', video_duration = 1200 WHERE id = 4;
UPDATE lessons SET video_url = 'https://www.youtube.com/watch?v=TlB_eWDSMt4', content = '<h3>Node.js et Express</h3><p>Apprenez a creer un serveur backend avec Node.js et Express.</p>', video_duration = 1500 WHERE id = 5;
UPDATE lessons SET video_url = 'https://www.youtube.com/watch?v=pKd0Rpw7O48', content = '<h3>Base de donnees MySQL</h3><p>Decouvrez comment stocker et recuperer des donnees avec MySQL.</p>', video_duration = 1080 WHERE id = 6;
UPDATE lessons SET video_url = 'https://www.youtube.com/watch?v=9zBsdzdEiA', content = '<h3>Authentification et Securite</h3><p>Apprenez a securiser votre application.</p>', video_duration = 900 WHERE id = 7;
UPDATE lessons SET video_url = 'https://www.youtube.com/watch?v=3aGSqasVPsA', content = '<h3>Deploiement et Production</h3><p>Derniere etape : deployer votre application en production.</p>', video_duration = 720 WHERE id = 8;
UPDATE lessons SET video_url = 'https://www.youtube.com/watch?v=0pThnRneDjw', content = '<h3>Projet Final</h3><p>Mettez en pratique tout ce que vous avez appris.</p>', video_duration = 1800 WHERE id = 9;

SELECT 'Donnees inserees avec succes !' as message;
