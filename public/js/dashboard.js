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

    let formationsCount = 0;
    let completedCount = 0;
    let certificatesCount = 0;

    if (progress && progress.progress) {
        formationsCount = progress.progress.length;
        completedCount = progress.progress.filter(p => (p.progress_percent || p.progress || 0) === 100).length;
    }

    if (certificates && certificates.certificates) {
        certificatesCount = certificates.certificates.length;
    }

    document.getElementById('statFormations').textContent = formationsCount;
    document.getElementById('statCompleted').textContent = completedCount;
    document.getElementById('statCertificates').textContent = certificatesCount;
    
    // Calculer les heures (approximatif : 1 leçon = 15 min en moyenne)
    const totalLessons = progress?.progress?.reduce((acc, p) => acc + (p.completed_lessons || 0), 0) || 0;
    const hours = Math.round(totalLessons * 15 / 60);
    document.getElementById('statHours').textContent = hours + 'h';
}

async function loadContinueLearning() {
    const progress = await apiFetch('/progress/my');
    const section = document.getElementById('continueSection');
    const grid = document.getElementById('continueGrid');

    if (!progress || !progress.progress || progress.progress.length === 0) {
        section.style.display = 'none';
        return;
    }

    const inProgress = progress.progress.filter(p => {
        const prog = p.progress_percent || p.progress || 0;
        return prog > 0 && prog < 100;
    });

    if (inProgress.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = inProgress.map(p => {
        const title = p.formation_title || p.titre || p.title || 'Formation';
        const image = p.formation_image || p.image || 'https://via.placeholder.com/80';
        const prog = p.progress_percent || p.progress || 0;
        
        return `
        <div class="continue-card" onclick="window.location.href='/formation/${p.formation_id}'">
            <img src="${image}" alt="${title}">
            <div class="continue-info">
                <h3>${title}</h3>
                <p>Continuez où vous vous êtes arrêté</p>
                <div class="formation-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${prog}%"></div>
                    </div>
                    <span class="progress-text">${prog}% complété</span>
                </div>
            </div>
        </div>
    `}).join('');
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
    grid.innerHTML = progress.progress.map(p => {
        const title = p.formation_title || p.titre || p.title || 'Formation';
        const image = p.formation_image || p.image || 'https://via.placeholder.com/300x180';
        const prog = p.progress_percent || p.progress || 0;
        
        return `
        <div class="formation-card" onclick="window.location.href='/formation/${p.formation_id}'">
            <div class="formation-image">
                <img src="${image}" alt="${title}">
            </div>
            <div class="formation-content">
                <div class="formation-title">${title}</div>
                <div class="formation-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${prog}%"></div>
                    </div>
                    <span class="progress-text">${prog}% complété</span>
                </div>
            </div>
        </div>
    `}).join('');
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
    grid.innerHTML = certificates.certificates.map(c => {
        const title = c.formation_title || c.titre || c.title || 'Formation';
        return `
        <div class="certificate-card" onclick="window.location.href='/certificate/${c.formation_id}'">
            <i class="fas fa-award"></i>
            <h3>${title}</h3>
            <p>Obtenu le ${new Date(c.issued_at).toLocaleDateString('fr-FR')}</p>
            <button class="btn btn-sm btn-outline" style="color: white; border-color: rgba(255,255,255,0.3);">
                <i class="fas fa-download"></i> Télécharger
            </button>
        </div>
    `}).join('');
}

async function loadRecommended() {
    const formations = await apiFetch('/formations');
    const grid = document.getElementById('recommendedGrid');

    if (!formations || !formations.formations) {
        grid.innerHTML = '<p>Aucune formation disponible</p>';
        return;
    }

    const recommended = formations.formations.slice(0, 3);

    grid.innerHTML = recommended.map(f => {
        const title = f.titre || f.title || f.name || 'Formation';
        const desc = f.description || f.short_description || '';
        const image = f.image || f.image_url || 'https://via.placeholder.com/300x180';
        
        return `
        <div class="formation-card" onclick="window.location.href='/formation/${f.id}'">
            <div class="formation-image">
                <img src="${image}" alt="${title}">
                <span class="formation-badge" style="background: ${f.category_color || '#6366f1'};">${f.category_name || 'Formation'}</span>
            </div>
            <div class="formation-content">
                <div class="formation-category">${f.category_name || 'Formation'}</div>
                <div class="formation-title">${title}</div>
                <div class="formation-desc">${desc}</div>
                <div class="formation-meta">
                    <div class="formation-stats">
                        <span><i class="fas fa-book"></i> ${f.lessons_count || 0} leçons</span>
                        <span><i class="fas fa-users"></i> ${f.enrollments_count || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

loadDashboard();