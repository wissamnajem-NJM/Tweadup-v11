// ===== FORMATION DETAIL =====
const pathParts = window.location.pathname.split('/');
const formationId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

async function loadFormation() {
    try {
        const data = await apiFetch('/formations/' + formationId);

        if (!data || !data.formation) {
            document.getElementById('formationDetail').innerHTML = '<p>Formation non trouvée</p>';
            return;
        }

        const formation = data.formation;
        const lessons = data.lessons || [];

        // Load progress
        const progressData = await apiFetch('/progress/formation/' + formationId);
        const completedLessons = progressData?.lessonProgress?.map(lp => lp.lesson_id) || [];
        const progressPercent = progressData?.enrollment?.progress_percent || 0;
        const isEnrolled = !!progressData?.enrollment;

        const allCompleted = lessons.length > 0 && lessons.every(l => completedLessons.includes(l.id));

        // Si PAS inscrit, on cache les leçons et on montre le bouton d'inscription
        const lessonsHtml = isEnrolled ? lessons.map((lesson, index) => `
            <div class="lesson-item ${completedLessons.includes(lesson.id) ? 'completed' : ''}" 
                 onclick="showLesson(${lesson.id})"
                 style="cursor: pointer;">
                <div class="lesson-number">${index + 1}</div>
                <div class="lesson-info">
                    <h4>${lesson.title}</h4>
                    <span>${lesson.duration || lesson.video_duration || '10 min'}</span>
                </div>
                ${completedLessons.includes(lesson.id) ? '<i class="fas fa-check-circle lesson-status"></i>' : '<i class="far fa-circle" style="color: var(--gray-400);"></i>'}
            </div>

            <div id="lesson-content-${lesson.id}" class="lesson-content" style="display: none; padding: 1.5rem; background: var(--gray-50); border-radius: var(--radius); margin-bottom: 1rem; border: 1px solid var(--gray-200);">
                ${lesson.video_url ? `
                    <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius); margin-bottom: 1rem; background: var(--gray-900);">
                        <iframe src="${lesson.video_url}" 
                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen>
                        </iframe>
                    </div>
                ` : '<p style="color: var(--gray-500); padding: 2rem; text-align: center;"><i class="fas fa-video-slash" style="font-size: 2rem; margin-bottom: 0.5rem;"></i><br>Aucune vidéo disponible pour cette leçon.</p>'}
                <div class="lesson-text" style="font-size: 1rem; line-height: 1.8; color: var(--gray-700); margin-bottom: 1.5rem;">
                    ${lesson.content || lesson.description || '<p>Aucun contenu disponible pour cette leçon.</p>'}
                </div>
                <button class="btn btn-primary" onclick="completeLesson(${lesson.id}, ${formation.id}); event.stopPropagation();">
                    <i class="fas fa-check"></i> ${completedLessons.includes(lesson.id) ? 'Déjà terminée' : 'Marquer comme terminée'}
                </button>
            </div>
        `).join('') : '<p style="color: var(--gray-500); text-align: center; padding: 2rem;">Inscrivez-vous pour accéder au contenu du cours.</p>';

        document.getElementById('formationDetail').innerHTML = `
            <div class="formation-hero">
                <img src="${formation.image_url || formation.image || 'https://via.placeholder.com/1200x350/6366f1/ffffff?text=' + encodeURIComponent(formation.title)}" alt="${formation.title}">
                <div class="formation-hero-overlay">
                    <h1>${formation.title}</h1>
                    <p>${formation.category || 'Formation'} • ${lessons.length} leçons • ${formation.level || 'Tous niveaux'}</p>
                </div>
            </div>
            <div class="formation-detail-content">
                <div class="formation-detail-main">
                    <h2>Description</h2>
                    <p>${formation.description || 'Aucune description disponible.'}</p>

                    ${!isEnrolled ? `
                        <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--radius-lg); text-align: center; margin: 2rem 0;">
                            <h3 style="margin-bottom: 1rem;">Rejoignez cette formation</h3>
                            <p style="color: var(--gray-500); margin-bottom: 1.5rem;">Inscrivez-vous gratuitement pour accéder à toutes les leçons.</p>
                            <button class="btn btn-primary btn-lg" onclick="enrollFormation(${formation.id})">
                                <i class="fas fa-user-plus"></i> S'inscrire
                            </button>
                        </div>
                    ` : `
                        <div style="background: #dcfce7; padding: 1rem; border-radius: var(--radius); margin: 1rem 0; color: #16a34a;">
                            <i class="fas fa-check-circle"></i> Vous êtes inscrit ! Progression: ${progressPercent}%
                        </div>
                    `}

                    <h2>Contenu du cours (${lessons.length} leçons)</h2>
                    <div class="lessons-list">
                        ${lessonsHtml}
                    </div>

                    ${allCompleted && isEnrolled ? `
                        <div style="margin-top: 2rem; text-align: center; padding: 2rem; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: var(--radius-lg);">
                            <h2>🎓 Examen final</h2>
                            <p style="color: var(--gray-600); margin-bottom: 1.5rem;">Vous avez terminé toutes les leçons ! Passez l'examen pour obtenir votre certificat.</p>
                            <a href="/exam/${formation.id}" class="btn btn-primary btn-lg" style="font-size: 1.1rem; padding: 1rem 2rem;">
                                <i class="fas fa-clipboard-check"></i> Passer l'examen final
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
                            <span class="progress-text">${progressPercent}% complété</span>
                        </div>
                        ${allCompleted && isEnrolled ? `
                            <a href="/exam/${formation.id}" class="btn btn-primary btn-full">
                                <i class="fas fa-clipboard-check"></i> Passer l'examen
                            </a>
                        ` : `
                            <button class="btn btn-outline btn-full" disabled>
                                <i class="fas fa-lock"></i> ${isEnrolled ? 'Examen verrouillé' : 'Inscrivez-vous d abord'}
                            </button>
                        `}
                    </div>
                    <div class="sidebar-card">
                        <h3>Détails</h3>
                        <div class="sidebar-stat">
                            <span><i class="fas fa-book"></i> Leçons</span>
                            <span>${lessons.length}</span>
                        </div>
                        <div class="sidebar-stat">
                            <span><i class="fas fa-clock"></i> Durée</span>
                            <span>${formation.duration_hours ? formation.duration_hours + 'h' : 'N/A'}</span>
                        </div>
                        <div class="sidebar-stat">
                            <span><i class="fas fa-signal"></i> Niveau</span>
                            <span>${formation.level || 'Tous niveaux'}</span>
                        </div>
                        <div class="sidebar-stat">
                            <span><i class="fas fa-certificate"></i> Certificat</span>
                            <span>Oui</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        document.getElementById('formationDetail').innerHTML = '<p>Erreur: ' + err.message + '</p>';
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
    const result = await apiFetch('/progress/enroll', {
        method: 'POST',
        body: JSON.stringify({ formationId: formationId })
    });

    if (result) {
        showToast('Inscription réussie !', 'success');
        loadFormation();
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
        showToast('Leçon terminée !', 'success');
        loadFormation();
    } else {
        showToast('Erreur', 'error');
    }
}

loadFormation();