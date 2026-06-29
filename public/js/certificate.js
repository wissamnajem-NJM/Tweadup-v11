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

    const element = document.getElementById('certificatePdf');

    if (!element) {
        showToast('Erreur: certificat non trouve', 'error');
        return;
    }

    // Utiliser html2canvas pour capturer le certificat exactement comme affiche
    html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');

        // Creer le PDF avec les dimensions exactes
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'px', [canvas.width, canvas.height]);

        doc.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        doc.save('Certificat-Tweadup-' + certFormationId + '.pdf');

        showToast('PDF telecharge avec succes !', 'success');
    }).catch(err => {
        console.error('Erreur generation PDF:', err);
        showToast('Erreur lors de la generation du PDF', 'error');
    });
}

loadCertificate();