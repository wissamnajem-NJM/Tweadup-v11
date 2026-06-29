// ===== CERTIFICATE =====
const certFormationId = window.location.pathname.split('/').pop();

async function loadCertificate() {
    const data = await apiFetch('/certificates/' + certFormationId);

    if (!data || !data.certificate) {
        document.getElementById('certificateContainer').innerHTML = `
            <div style="text-align: center; padding: 4rem;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                <h2>Certificat non trouve</h2>
                <p style="color: var(--gray-500);">Vous devez reussir l examen pour obtenir ce certificat.</p>
                <a href="/formation/${certFormationId}" class="btn btn-primary" style="margin-top: 1rem;">
                    Retour a la formation
                </a>
            </div>
        `;
        return;
    }

    const cert = data.certificate;
    const firstName = cert.users?.first_name || 'Prenom';
    const lastName = cert.users?.last_name || 'Nom';
    const formationTitle = cert.formations?.title || 'Formation';

    document.getElementById('certificateContainer').innerHTML = `
        <div class="certificate-preview" id="certificatePdf">
            <div class="certificate-content">
                <i class="fas fa-award certificate-badge"></i>
                <h2>CERTIFICAT DE REUSSITE</h2>
                <p>Ce certificat est decerne a</p>
                <div class="certificate-name">${firstName} ${lastName}</div>
                <p>pour avoir complete avec succes la formation</p>
                <h3>${formationTitle}</h3>
                <p class="certificate-date">Delivre le ${new Date(cert.issued_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <div style="margin-top: 2rem; font-size: 0.8rem; opacity: 0.6;">
                    <i class="fas fa-shield-alt"></i> Certificat verifie par Tweadup
                </div>
            </div>
        </div>
        <div class="certificate-actions">
            <button class="btn btn-primary" onclick="downloadCertificate()">
                <i class="fas fa-download"></i> Telecharger le PDF
            </button>
            <a href="/dashboard" class="btn btn-outline">
                <i class="fas fa-home"></i> Tableau de bord
            </a>
        </div>
    `;
}

function downloadCertificate() {
    showToast('Generation du PDF en cours...', 'info');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Couleurs
    const darkColor = '#1a1a2e';
    const goldColor = '#ffd700';

    // Fond
    doc.setFillColor(darkColor);
    doc.rect(0, 0, 297, 210, 'F');

    // Bordure dorée
    doc.setDrawColor(goldColor);
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);

    // Logo/Titre
    doc.setTextColor(goldColor);
    doc.setFontSize(12);
    doc.text('Tweadup', 20, 25);

    // Badge
    doc.setFontSize(60);
    doc.text('★', 148, 60, { align: 'center' });

    // Titre
    doc.setFontSize(28);
    doc.setTextColor(goldColor);
    doc.text('CERTIFICAT DE REUSSITE', 148, 90, { align: 'center' });

    // Texte
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Ce certificat est decerne a', 148, 110, { align: 'center' });

    // Nom
    const cert = document.querySelector('.certificate-name');
    const name = cert ? cert.textContent : 'Nom Prenom';
    doc.setFontSize(24);
    doc.setTextColor(goldColor);
    doc.text(name, 148, 125, { align: 'center' });

    // Formation
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('pour avoir complete avec succes la formation', 148, 140, { align: 'center' });

    const formation = document.querySelector('h3');
    const formationTitle = formation ? formation.textContent : 'Formation';
    doc.setFontSize(18);
    doc.setTextColor(goldColor);
    doc.text(formationTitle, 148, 152, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text('Delivre le ' + date, 148, 170, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.text('Certificat verifie par Tweadup', 148, 185, { align: 'center' });

    // Sauvegarder
    doc.save('Certificat-Tweadup-' + certFormationId + '.pdf');

    showToast('PDF telecharge avec succes !', 'success');
}

loadCertificate();