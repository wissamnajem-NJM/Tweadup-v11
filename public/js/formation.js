// ===== FORMATION DETAIL =====
const pathParts = window.location.pathname.split('/');
const formationId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

async function loadFormation() {
    try {
        // 1. Charger la formation (public, pas besoin de token)
        const data = await apiFetch('/formations/' + formationId);

        if (!data || !data.formation) {
            document.getElementById('formationDetail').innerHTML = '<p>Formation non trouvee</p>';
            return;
        }

        const formation = data.formation;
        const lessons = data.lessons || data.lecons || [];
        
        // Fallback pour le titre
        const title = formation.titre || formation.title || formation.name || 'Formation';
        const description = formation.description || formation.resume || 'Aucune description disponible.';
        const image = formation.image || formation.image_url || 'https://via.placeholder.com/1200x350/6366f1/ffffff?text=' + encodeURIComponent(title);
        const duration = formation.duree || formation.duration || 'N/A';
        const level = formation.niveau || formation.level || 'Tous niveaux';
        const hasCertificate = formation.certificat_active !== false && formation.certificate_enabled !== false;

        // 2. Charger la progression (si connecté)
        let progressData = null;
        let completedLessons = [];
        let progressPercent = 0;
        let isEnrolled = false;

        if (isLoggedIn()) {
            try {
                progressData = await apiFetch('/progress/formation/' + formationId);
                if (progressData) {
                    completedLessons = progressData?.lessonProgress?.map(lp => lp.lesson_id) || progressData?.leconsVues?.map(lv => lv.lecon_id) || [];
                    progressPercent = progressData?.enrollment?.progress_percent || progressData?.enrollment?.progression || progressData?.inscription?.progression || 0;
                    isEnrolled = !!(progressData?.enrollment || progressData?.inscription);
                }
            } catch (e) {
                console.log('Pas de progression (pas inscrit ou non connecté)');
            }
        }

        const allCompleted = lessons.length > 0 && lessons.every(l => completedLessons.includes(l.id));

        document.getElementById('formationDetail').innerHTML = `
            <div class="formation-hero">
                <img src="${image}" alt="${title}">
                <div class="formation-hero-overlay">
                    <h1>${title}</h1>
                    <p>${formation.category_name || formation.categorie || 'Formation'} • ${lessons.length} lecons • ${level}</p>
                </div>
            </div>
            <div class="formation-detail-content">
                <div class="formation-detail-main">
                    <h2>Description</h2>
                    <p>${description}</p>

                    ${!isLoggedIn() ? `
                        <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-lg); text-align: center; margin: 2rem 0;">
                            <h3 style="margin-bottom: 1rem;">Connectez-vous pour accéder à cette formation</h3>
                            <p style="color: var(--gray-500); margin-bottom: 1.5rem;">Créez un compte gratuit pour suivre les leçons et obtenir votre certificat.</p>
                            <a href="/login" class="btn btn-primary btn-lg">
                                <i class="fas fa-sign-in-alt"></i> Se connecter
                            </a>
                        </div>
                    ` : !isEnrolled ? `
                        <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-lg); text-align: center; margin: 2rem 0;">
                            <h3 style="margin-bottom: 1rem;">Rejoignez cette formation</h3>
                            <p style="color: var(--gray-500); margin-bottom: 1.5rem;">Inscrivez-vous gratuitement pour sauvegarder votre progression.</p>
                            <button class="btn btn-primary btn-lg" onclick="enrollFormation(${formation.id})">
                                <i class="fas fa-user-plus"></i> S'inscrire
                            </button>
                        </div>
                    ` : `
                        <div style="background: #dcfce7; padding: 1rem; border-radius: var(--radius); margin: 1rem 0; color: #16a34a;">
                            <i class="fas fa-check-circle"></i> Vous etes inscrit ! Progression: ${progressPercent}%
                        </div>
                    `}

                    <h2>Contenu du cours (${lessons.length} lecons)</h2>
                    <div class="lessons-list">
                        ${lessons.length === 0 ? '<p style="color: var(--gray-500);">Aucune lecon disponible.</p>' : ''}
                        ${lessons.map((lesson, index) => {
                            const lessonTitle = lesson.titre || lesson.title || lesson.name || `Leçon ${index + 1}`;
                            const isCompleted = completedLessons.includes(lesson.id);
                            const isLocked = !isEnrolled && isLoggedIn();
                            
                            return `
                            <div class="lesson-item ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}" 
                                 onclick="${isLocked ? '' : 'showLesson(' + lesson.id + ')'}"
                                 style="cursor: ${isLocked ? 'not-allowed' : 'pointer'}; opacity: ${isLocked ? '0.6' : '1'};">
                                <div class="lesson-number">${isLocked ? '<i class="fas fa-lock"></i>' : (index + 1)}</div>
                                <div class="lesson-info">
                                    <h4>${lessonTitle}</h4>
                                    <span>${lesson.duree || lesson.duration || lesson.video_duration || '10 min'}</span>
                                </div>
                                ${isCompleted ? '<i class="fas fa-check-circle lesson-status"></i>' : 
                                  isLocked ? '<i class="fas fa-lock" style="color: var(--gray-400);"></i>' : 
                                  '<i class="far fa-circle" style="color: var(--gray-400);"></i>'}
                            </div>

                            <div id="lesson-content-${lesson.id}" class="lesson-content" style="display: none; padding: 1.5rem; background: var(--gray-50); border-radius: var(--radius); margin-bottom: 1rem; border: 1px solid var(--gray-200);">
                                ${lesson.youtube_url || lesson.video_url ? `
                                    <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius); margin-bottom: 1rem; background: var(--gray-900);">
                                        <iframe src="${lesson.youtube_url || lesson.video_url}" 
                                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowfullscreen>
                                        </iframe>
                                    </div>
                                ` : '<p style="color: var(--gray-500); padding: 2rem; text-align: center;"><i class="fas fa-video-slash" style="font-size: 2rem; margin-bottom: 0.5rem;"></i><br>Aucune video disponible pour cette lecon.</p>'}
                                <div class="lesson-text" style="font-size: 1rem; line-height: 1.8; color: var(--gray-700); margin-bottom: 1.5rem;">
                                    ${lesson.description || lesson.content || '<p>Aucun contenu disponible pour cette lecon.</p>'}
                                </div>
                                ${isEnrolled ? `
                                <button class="btn btn-primary" onclick="completeLesson(${lesson.id}, ${formation.id}); event.stopPropagation();">
                                    <i class="fas fa-check"></i> ${isCompleted ? 'Deja terminee' : 'Marquer comme terminee'}
                                </button>
                                ` : ''}
                            </div>
                        `}).join('')}
                    </div>

                    ${allCompleted && isEnrolled ? `
                        <div style="margin-top: 2rem; text-align: center; padding: 2rem; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: var(--radius-lg);">
                            <h2>🎓 Examen final</h2>
                            <p style="color: var(--gray-600); margin-bottom: 1.5rem;">Vous avez termine toutes les lecons ! Passez l examen pour obtenir votre certificat.</p>
                            <a href="/exam/${formation.id}" class="btn btn-primary btn-lg" style="font-size: 1.1rem; padding: 1rem 2rem;">
                                <i class="fas fa-clipboard-check"></i> Passer l examen final
                            </a>
                        </div>
                    ` : ''}
                </div>
                <div class="formation-sidebar">
                    <div class="sidebar-card">
                        <h3>Progression</h3>
                        <div class="formation-progress" style="margin-bottom: 1rem;">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <span class="progress-text">${progressPercent}% complete</span>
                        </div>
                        ${allCompleted && isEnrolled ? `
                            <a href="/exam/${formation.id}" class="btn btn-primary btn-full">
                                <i class="fas fa-clipboard-check"></i> Passer l examen
                            </a>
                        ` : isEnrolled ? `
                            <button class="btn btn-outline btn-full" disabled>
                                <i class="fas fa-lock"></i> Examen verrouille
                            </button>
                        ` : `
                            <button class="btn btn-outline btn-full" disabled>
                                <i class="fas fa-lock"></i> Inscrivez-vous d'abord
                            </button>
                        `}
                    </div>
                    <div class="sidebar-card">
                        <h3>Details</h3>
                        <div class="sidebar-stat">
                            <span><i class="fas fa-book"></i> Lecons</span>
                            <span>${lessons.length}</span>
                        </div>
                        <div class="sidebar-stat">
                            <span><i class="fas fa-clock"></i> Duree</span>
                            <span>${duration}</span>
                        </div>
                        <div class="sidebar-stat">
                            <span><i class="fas fa-signal"></i> Niveau</span>
                            <span>${level}</span>
                        </div>
                        <div class="sidebar-stat">
                            <span><i class="fas fa-certificate"></i> Certificat</span>
                            <span>${hasCertificate ? 'Oui' : 'Non'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        document.getElementById('formationDetail').innerHTML = '<p>Erreur: ' + (err.message || 'Impossible de charger la formation') + '</p>';
    }
}

function showLesson(lessonId) {
    const content = document.getElementById('lesson-content-' + lessonId);
    if (content) {
        const isVisible = content.style.display === 'block';
        document.querySelectorAll('.lesson-content').forEach(el => el.style.display = 'none');
        if (!isVisible) {
            content.style.display = 'block';
            content.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

async function enrollFormation(formationId) {
    if (!isLoggedIn()) {
        showToast('Veuillez vous connecter d\'abord', 'error');
        window.location.href = '/login';
        return;
    }

    const result = await apiFetch('/progress/enroll', {
        method: 'POST',
        body: JSON.stringify({ formationId: formationId })
    });

    if (result) {
        showToast('Inscription reussie !', 'success');
        // RAFRAÎCHIR LA PAGE pour voir les leçons déverrouillées
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } else {
        showToast('Erreur inscription', 'error');
    }
}

async function completeLesson(lessonId, formationId) {
    const result = await apiFetch('/progress/lesson/' + lessonId + '/complete', {
        method: 'POST',
        body: JSON.stringify({ formationId: formationId })
    });

    if (result) {
        showToast('Lecon terminee !', 'success');
        loadFormation();
    } else {
        showToast('Erreur', 'error');
    }
}

loadFormation();