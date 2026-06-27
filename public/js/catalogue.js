// ===== CATALOGUE =====
let allFormations = [];

async function loadCatalogue() {
    try {
        const data = await apiFetch('/formations');
        console.log('Données reçues:', data);

        if (!data || !data.formations) {
            document.getElementById('formationsGrid').innerHTML = '<p style="text-align:center;padding:2rem;">Aucune formation disponible</p>';
            return;
        }

        allFormations = data.formations;
        displayFormations(allFormations);
        loadCategories(allFormations);
    } catch (err) {
        console.error('Erreur chargement catalogue:', err);
        document.getElementById('formationsGrid').innerHTML = '<p style="text-align:center;padding:2rem;color:var(--danger);">Erreur de chargement. Vérifiez la console.</p>';
    }
}

function displayFormations(formations) {
    const grid = document.getElementById('formationsGrid');

    if (formations.length === 0) {
        grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--gray-500);">Aucune formation trouvée</p>';
        return;
    }

    grid.innerHTML = formations.map(f => `
        <div class="formation-card" onclick="window.location.href='/formation/${f.id}'">
            <div class="formation-image">
                <img src="${f.image_url || f.image || 'https://via.placeholder.com/300x180/6366f1/ffffff?text=' + encodeURIComponent(f.title)}" alt="${f.title}">
                <span class="formation-badge" style="background: #6366f1;">${f.category || 'Formation'}</span>
            </div>
            <div class="formation-content">
                <div class="formation-category">${f.category || 'Formation'}</div>
                <div class="formation-title">${f.title}</div>
                <div class="formation-desc">${f.description || ''}</div>
                <div class="formation-meta">
                    <div class="formation-stats">
                        <span><i class="fas fa-book"></i> ${f.lessons_count || 0} leçons</span>
                        <span><i class="fas fa-users"></i> ${f.enrollments_count || 0}</span>
                        <span><i class="fas fa-signal"></i> ${f.level || 'Tous niveaux'}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function loadCategories(formations) {
    const categories = [...new Set(formations.map(f => f.category).filter(Boolean))];
    const container = document.getElementById('categoryFilters');

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-tag';
        btn.textContent = cat;
        btn.dataset.category = cat;
        btn.onclick = () => filterByCategory(cat, btn);
        container.appendChild(btn);
    });
}

function filterByCategory(category, btn) {
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    if (category === 'all') {
        displayFormations(allFormations);
    } else {
        const filtered = allFormations.filter(f => f.category === category);
        displayFormations(filtered);
    }
}

// Search
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allFormations.filter(f => 
        f.title.toLowerCase().includes(query) || 
        (f.description && f.description.toLowerCase().includes(query))
    );
    displayFormations(filtered);
});

// All filter
document.querySelector('[data-category="all"]')?.addEventListener('click', function() {
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    displayFormations(allFormations);
});

loadCatalogue();