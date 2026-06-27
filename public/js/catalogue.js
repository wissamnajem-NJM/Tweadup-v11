function displayFormations(formations) {
    const grid = document.getElementById('formationsGrid');
    if (formations.length === 0) {
        grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--gray-500);">Aucune formation trouvée</p>';
        return;
    }

    grid.innerHTML = formations.map(f => {
        const img = f.image_url || f.image || 'https://via.placeholder.com/300x180/6366f1/ffffff?text=' + encodeURIComponent(f.title);
        const lessons = f.lessons_count !== undefined ? f.lessons_count : 0;
        
        return `
        <div class="formation-card" onclick="window.location.href='/formation/${f.id}'">
            <div class="formation-image">
                <img src="${img}" alt="${f.title}" onerror="this.src='https://via.placeholder.com/300x180/6366f1/ffffff?text=${encodeURIComponent(f.title)}'">
                <span class="formation-badge" style="background: #6366f1;">${f.category || 'Formation'}</span>
            </div>
            <div class="formation-content">
                <div class="formation-category">${f.category || 'Formation'}</div>
                <div class="formation-title">${f.title}</div>
                <div class="formation-desc">${f.description || ''}</div>
                <div class="formation-meta">
                    <div class="formation-stats">
                        <span><i class="fas fa-book"></i> ${lessons} leçons</span>
                        <span><i class="fas fa-users"></i> ${f.enrollments_count || 0}</span>
                        <span><i class="fas fa-signal"></i> ${f.level || 'Tous niveaux'}</span>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}