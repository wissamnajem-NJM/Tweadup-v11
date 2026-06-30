const certFormationId = window.location.pathname.split('/').pop();

async function loadCertificate() {
    const data = await apiFetch('/certificates/' + certFormationId);

    if (!data || !data.certificate) {
        document.getElementById('certificateContainer').innerHTML = `
            <div style="text-align: center; padding: 4rem;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                <h2>Certificat non trouvé</h2>
                <p style="color: var(--gray-500);">Vous devez réussir l'examen pour obtenir ce certificat.</p>
                <a href="/formation/${certFormationId}" class="btn btn-primary" style="margin-top: 1rem;">
                    Retour à la formation
                </a>
            </div>
        `;
        return;
    }

    const cert = data.certificate;

    document.getElementById('certificateContainer').innerHTML = `
        <div class="certificate-preview" id="certificatePdf">
            <div class="certificate-content">
                <i class="fas fa-award certificate-badge"></i>
                <h2>CERTIFICAT DE RÉUSSITE</h2>
                <p>Ce certificat est décerné à</p>
                <div class="certificate-name">${cert.first_name} ${cert.last_name}</div>
                <p>pour avoir complété avec succès la formation</p>
                <h3>${cert.formation_title}</h3>
                <p class="certificate-date">Délivré le ${new Date(cert.issued_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <div style="margin-top: 2rem; font-size: 0.8rem; opacity: 0.6;">
                    <i class="fas fa-shield-alt"></i> Certificat vérifié par Tweadup
                </div>
            </div>
        </div>
        <div class="certificate-actions">
            <button class="btn btn-primary" onclick="downloadCertificate()">
                <i class="fas fa-download"></i> Télécharger le PDF
            </button>
            <a href="/dashboard" class="btn btn-outline">
                <i class="fas fa-home"></i> Tableau de bord
            </a>
        </div>
    `;
}

function downloadCertificate() {
    // Cacher les boutons avant d'imprimer
    const actions = document.querySelector('.certificate-actions');
    const navbar = document.querySelector('.navbar');
    
    if (actions) actions.style.display = 'none';
    if (navbar) navbar.style.display = 'none';
    
    // Imprimer la page (l'utilisateur choisit "Enregistrer en PDF")
    window.print();
    
    // Remontrer les éléments après
    if (actions) actions.style.display = 'flex';
    if (navbar) navbar.style.display = 'flex';
}

loadCertificate();