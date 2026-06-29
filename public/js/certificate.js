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

    const opt = {
        margin:       0,
        filename:     'Certificat-Tweadup-' + certFormationId + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
}

loadCertificate();