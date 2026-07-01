// ===== PROFILE =====
async function loadProfile() {
    const user = getUser();
    if (!user) return;

    document.getElementById('profileAvatar').src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.first_name + ' ' + user.last_name) + '&background=6366f1&color=fff&size=150';
    document.getElementById('profileName').textContent = user.first_name + ' ' + user.last_name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileRole').textContent = user.role_id === 3 ? 'Etudiant' : (user.role || 'Utilisateur');

    document.getElementById('editFirstName').value = user.first_name;
    document.getElementById('editLastName').value = user.last_name;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editMemberSince').value = new Date().toLocaleDateString('fr-FR');

    // Load stats
    const progress = await apiFetch('/progress/my');
    const certificates = await apiFetch('/certificates/my');

    let formationsCount = 0;
    let completedCount = 0;
    let certificatesCount = 0;

    if (progress && progress.progress) {
        formationsCount = progress.progress.length;
        completedCount = progress.progress.filter(p => (p.progress_percent || p.progress || 0) === 100).length;

        const list = document.getElementById('profileFormationsList');
        if (list && progress.progress.length > 0) {
            list.innerHTML = progress.progress.map(p => {
                const title = p.formation_title || p.titre || p.title || 'Formation';
                const image = p.formation_image || p.image || 'https://via.placeholder.com/60';
                const prog = p.progress_percent || p.progress || 0;
                
                return `
                <div class="formation-list-item" onclick="window.location.href='/formation/${p.formation_id}'">
                    <img src="${image}" alt="${title}">
                    <div class="formation-list-info">
                        <h4>${title}</h4>
                        <span>${prog}% complete</span>
                    </div>
                </div>
            `}).join('');
        } else if (list) {
            list.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 1rem;">Aucune formation inscrite</p>';
        }
    }

    if (certificates && certificates.certificates) {
        certificatesCount = certificates.certificates.length;
    }

    document.getElementById('profileFormations').textContent = formationsCount;
    document.getElementById('profileCompleted').textContent = completedCount;
    document.getElementById('profileCertificates').textContent = certificatesCount;
}

loadProfile();