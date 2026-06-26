// ===== DASHBOARD =====
async function loadDashboard() {
    const user = getUser();
    if (!user) return;

    // Load stats
    await loadStats();

    // Load continue learning
    await loadContinueLearning();

    // Load my formations
    await loadMyFormations();

    // Load certificates
    await loadCertificates();

    // Load recommended
    await loadRecommended();
}

async function loadStats() {
    const progress = await apiFetch('/progress/my');
    const certificates = await apiFetch('/certificates/my');

    if (progress && progress.progress) {
        document.getElementById('statFormations').textContent = progress.progress.length;
        const completed = progress.progress.filter(p => p.progress === 100).length;
        document.getElementById('statCompleted').textContent = completed;
    }

    if (certificates && certificates.certificates) {
        document.getElementById('statCertificates').textContent = certificates.certificates.length;
    }

    document.getElementById('statHours').textContent = '0h';
}

async function loadContinueLearning() {
    const progress = await apiFetch('/progress/my');
    const section = document.getElementById('continueSection');
    const grid = document.getElementById('continueGrid');

    if (!progress || !progress.progress || progress.progress.length === 0) {
        section.style.display = 'none';
        return;
    }

    const inProgress = progress.progress.filter(p => p.progress > 0 && p.progress < 100);

    if (inProgress.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = inProgress.map(p => `
        <div class="continue-card" onclick="window.location.href='/formation/${p.formation_id}'">
            <img src="${p.formation_image || 'https://via.placeholder.com/80'}" alt="${p.formation_title}">
            <div class="continue-info">
                <h3>${p.formation_title}</h3>
                <p>Continuez où vous vous êtes arrêté</p>
                <div class="formation-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${p.progress}%"></div>
                    </div>
                    <span class="progress-text">${p.progress}% complété</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadMyFormations() {
    const progress = await apiFetch('/progress/my');
    const section = document.getElementById('myFormationsSection');
    const grid = document.getElementById('myFormationsGrid');

    if (!progress || !progress.progress || progress.progress.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = progress.progress.map(p => `
        <div class="formation-card" onclick="window.location.href='/formation/${p.formation_id}'">
            <div class="formation-image">
                <img src="${p.formation_image || 'https://via.placeholder.com/300x180'}" alt="${p.formation_title}">
            </div>
            <div class="formation-content">
                <div class="formation-title">${p.formation_title}</div>
                <div class="formation-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${p.progress}%"></div>
                    </div>
                    <span class="progress-text">${p.progress}% complété</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadCertificates() {
    const certificates = await apiFetch('/certificates/my');
    const section = document.getElementById('certificatesSection');
    const grid = document.getElementById('certificatesGrid');

    if (!certificates || !certificates.certificates || certificates.certificates.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = certificates.certificates.map(c => `
        <div class="certificate-card" onclick="window.location.href='/certificate/${c.formation_id}'">
            <i class="fas fa-award"></i>
            <h3>${c.formation_title}</h3>
            <p>Obtenu le ${new Date(c.issued_at).toLocaleDateString('fr-FR')}</p>
            <button class="btn btn-sm btn-outline" style="color: white; border-color: rgba(255,255,255,0.3);">
                <i class="fas fa-download"></i> Télécharger
            </button>
        </div>
    `).join('');
}

async function loadRecommended() {
    const formations = await apiFetch('/formations');
    const grid = document.getElementById('recommendedGrid');

    if (!formations || !formations.formations) {
        grid.innerHTML = '<p>Aucune formation disponible</p>';
        return;
    }

    const recommended = formations.formations.slice(0, 3);

    grid.innerHTML = recommended.map(f => `
        <div class="formation-card" onclick="window.location.href='/formation/${f.id}'">
            <div class="formation-image">
                <img src="${f.image || 'https://via.placeholder.com/300x180'}" alt="${f.title}">
                <span class="formation-badge" style="background: ${f.category_color || '#6366f1'};">${f.category_name || 'Formation'}</span>
            </div>
            <div class="formation-content">
                <div class="formation-category">${f.category_name || 'Formation'}</div>
                <div class="formation-title">${f.title}</div>
                <div class="formation-desc">${f.description || ''}</div>
                <div class="formation-meta">
                    <div class="formation-stats">
                        <span><i class="fas fa-book"></i> ${f.lessons_count || 0} leçons</span>
                        <span><i class="fas fa-users"></i> ${f.enrollments_count || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

loadDashboard();
