-- ============================================
-- SCRIPT D'INSERTION DE DONNEES POUR TWEADUP (CORRIGE)
-- ============================================

-- D'abord, verifier si la table modules existe et inserer un module si necessaire
INSERT INTO modules (formation_id, title, description, sort_order, is_published, created_at) 
VALUES (1, 'Module 1 - Introduction', 'Premier module de la formation', 1, 1, NOW())
ON DUPLICATE KEY UPDATE title = 'Module 1 - Introduction';

-- Recuperer l'ID du module (supposons que c'est 1)
-- Inserer un QCM pour le module 1
INSERT INTO quizzes (module_id, title, description, passing_score, max_attempts, time_limit, is_published, created_at) 
VALUES (1, 'Examen Final - Developpement Web', 'Testez vos connaissances en HTML, CSS, JavaScript et React', 70, 3, 30, 1, NOW());

-- Questions pour le QCM
INSERT INTO quiz_questions (quiz_id, question, question_type, points, sort_order, created_at) VALUES
(LAST_INSERT_ID(), 'Quelle balise HTML est utilisee pour creer un lien hypertexte ?', 'qcm', 1, 1, NOW()),
(LAST_INSERT_ID(), 'Quelle propriete CSS permet de changer la couleur du texte ?', 'qcm', 1, 2, NOW()),
(LAST_INSERT_ID(), 'Quel mot-cle est utilise pour declarer une variable en JavaScript moderne ?', 'qcm', 1, 3, NOW()),
(LAST_INSERT_ID(), 'Quelle methode React est appelee apres le rendu initial du composant ?', 'qcm', 1, 4, NOW()),
(LAST_INSERT_ID(), 'Quel est le port par defaut de Node.js/Express ?', 'qcm', 1, 5, NOW()),
(LAST_INSERT_ID(), 'Quelle commande npm installe les dependances ?', 'qcm', 1, 6, NOW()),
(LAST_INSERT_ID(), 'Quel est le role de package.json ?', 'qcm', 1, 7, NOW()),
(LAST_INSERT_ID(), 'Quelle balise HTML5 est utilisee pour la navigation ?', 'qcm', 1, 8, NOW()),
(LAST_INSERT_ID(), 'Quelle unite CSS est relative a la taille de la police parent ?', 'qcm', 1, 9, NOW()),
(LAST_INSERT_ID(), 'Quel framework CSS est le plus populaire ?', 'qcm', 1, 10, NOW());

-- Reponses pour les questions (on utilise des IDs fixes pour simplifier)
-- Note: Les IDs des questions seront determines automatiquement
