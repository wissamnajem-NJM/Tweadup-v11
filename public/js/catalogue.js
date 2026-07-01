// ===== CATALOGUE =====
let allFormations = [];

async function loadCatalogue() {
    try {
        const data = await apiFetch('/formations');
        console.log('Donnees recues:', data);

        if (!data || !data.formations) {
            document.getElementById('formationsGrid').innerHTML = '<p style="text-align:center;padding:2rem;">Aucune formation disponible</p>';
            return;
        }

        allFormations = data.formations;
        displayFormations(allFormations);
        loadCategories(allFormations);
    } catch (err) {
        console.error('Erreur chargement catalogue:', err);
        document.getElementById('formationsGrid').innerHTML = '<p style="text-align:center;padding:2rem;color:var(--danger);">Erreur de chargement. Verifiez la console.</p>';
    }
}

function displayFormations(formations) {
    const grid = document.getElementById('formationsGrid');

    if (formations.length === 0) {
        grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--gray-500);">Aucune formation trouvee</p>';
        return;
    }

    grid.innerHTML = formations.map(f => {
        // Fallback : utiliser titre OU title OU name
        const title = f.titre || f.title || f.name || 'Sans titre';
        const desc = f.short_description || f.description || f.resume || '';
        const image = f.image || f.image_url || 'https://via.placeholder.com/300x180/6366f1/ffffff?text=' + encodeURIComponent(title);
        const lessonsCount = f.lessons_count !== undefined ? f.lessons_count : (f.lessons?.length || 0);
        
        return `
        <div class="formation-card" onclick="window.location.href='/formation/${f.id}'">
            <div class="formation-image">
                <img src="${image}" alt="${title}" onerror="this.src='https://via.placeholder.com/300x180/6366f1/ffffff?text=${encodeURIComponent(title)}'">
                <span class="formation-badge" style="background: ${f.category_color || '#6366f1'};">${f.category_name || 'Formation'}</span>
            </div>
            <div class="formation-content">
                <div class="formation-category">${f.category_name || 'Formation'}</div>
                <div class="formation-title">${title}</div>
                <div class="formation-desc">${desc}</div>
                <div class="formation-meta">
                    <div class="formation-stats">
                        <span><i class="fas fa-book"></i> ${lessonsCount} lecons</span>
                        <span><i class="fas fa-users"></i> ${f.enrollments_count || 0}</span>
                        <span><i class="fas fa-signal"></i> ${f.level || 'Tous niveaux'}</span>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

function loadCategories(formations) {
    const categories = [...new Set(formations.map(f => f.category_name).filter(Boolean))];
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
        const filtered = allFormations.filter(f => f.category_name === category);
        displayFormations(filtered);
    }
}

// Search
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allFormations.filter(f => {
        const title = (f.titre || f.title || f.name || '').toLowerCase();
        const desc = (f.description || f.short_description || '').toLowerCase();
        return title.includes(query) || desc.includes(query);
    });
    displayFormations(filtered);
});

// All filter
document.querySelector('[data-category="all"]')?.addEventListener('click', function() {
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    displayFormations(allFormations);
});

loadCatalogue();