// ===== CERTIFICATE =====
const certFormationId = window.location.pathname.split('/').pop();

// Logo Tweadup en base64
const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD0AAAA5CAYAAACF8yP/AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAAPaSURBVGhD7ZhNTBxVHMB/82bY6S6FwB74CrElBKnBrwge2uhBIwKNqZ8H44VIemqs0TSNieeGxJjGS1PjyY+zLVbTFLpYvbTUCFoVIzQ1wiZQygHo1v2anXnPw4p2dymwzG6Lzvxu++bte+/3/vP+77+rKaUUHkPkN3gBX9or+NJewZf2Cr60V/ClvYIv7RU8Ka1tl5+Wi4uSqWkbITTub9OpqytfPO6pdCymuDSW4cI3FkvLMudZuFbw9FMB9u2toLpay3nmlrsubVmKiR9sRiIW8/MOMte1ACGgqUmnpztA52MGgYD7Dbgr0lLCb1M2kVGLqWkb287vsTkMA/a0G3Q/E+CBPQZiiyegbNJKwY1FyfBImu/HbdLpO0+jadDYKOjrMZmNOox+beV3KcA0NR7vMujtMamvE2hFvAAll1YKLo1lOPNluuCc5rO68P29JnV1AtuGU0MpIqMbS99OuFbw/AGTfXsrNiVfcumlJcnge3FWVtYedjWq+3tNujor0HWIRh3OnkszOWljZfK/sTlqajTefaeScHjjd77k0neKtBDQ1VnBCweyUU2mFBcvZjgfKczcxXLPI72KUjA35/Dxpynm5h1ee3UHTz4RIBp1GDqTdpXQ2G5n+nYWFiTvH4/T0WHwen+Q8YkMn3yWWjeprce2z94AwyMWX51N89bhEG1tOgC2DeMTGS58azEz8z+8pz/8KMn16w5Hj1RSVaXxx4zDwoL8Z/HxuGLs8trnOr8iWy1qGhoELbuzG7hVyip94mSCeELx9pshAgGN4RGLz0+nMAxoadF5rs+kvd3AMNauvdcqal55aQe9PYH8qYqi7NJSweFDITQNTg2lOTeczuljmhoPP2TwbHeAXfdlIzgbdTgfsfj5l8Kipq/X5OUXzZy2YimbdDKpOP5BguVlydEjlTQ0CE6cTHDlJxcpG3j0EYM3DoXym4tii/lvY1IpRSymiN1SzMw6KAWyBNsrVfY6dEPZpOfmJbf+lCgF1353sptw0+VqgdhNRSrlbpyySCsFl7/LkPm7pFxZkVgWxBPuFgvZMaziSvMCyiI9fdXmxyu5Z1fTsneuW4TIjuWGEiwjl2RScfqLdEHWra7WGOgPEq7d+pThWsFAf9D1PylbX8E6VFdpGMa/n+vrs9O0tuoMHtvJwYEgzc36piIvBDQ36xwcCDJ4bCetre4KE8p5ZUkJCzckk7/aPNhh0NRYaChl9rzPzDokEpDJKHQdhNAIhWD3Lp2aGrGpzSmGsklvZ0q8h/8NfGmv4Et7BV/aK/jSXsGX9gq+tFfwpb2CL+0VfGmv8BdsrsiBzsHA+gAAAABJRU5ErkJggg==';

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

    // Logo Tweadup
    doc.addImage(LOGO_BASE64, 'PNG', 20, 15, 15, 15);
    doc.setFontSize(16);
    doc.setTextColor(goldColor);
    doc.text('Tweadup', 40, 25);

    // Ligne décorative
    doc.setDrawColor(goldColor);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 277, 35);

    // Badge étoile
    doc.setFontSize(60);
    doc.setTextColor(goldColor);
    doc.text('★', 148, 70, { align: 'center' });

    // Titre
    doc.setFontSize(28);
    doc.setTextColor(goldColor);
    doc.text('CERTIFICAT DE REUSSITE', 148, 95, { align: 'center' });

    // Texte
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Ce certificat est decerne a', 148, 115, { align: 'center' });

    // Nom
    const cert = document.querySelector('.certificate-name');
    const name = cert ? cert.textContent : 'Nom Prenom';
    doc.setFontSize(24);
    doc.setTextColor(goldColor);
    doc.text(name, 148, 130, { align: 'center' });

    // Formation
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('pour avoir complete avec succes la formation', 148, 145, { align: 'center' });

    const formation = document.querySelector('h3');
    const formationTitle = formation ? formation.textContent : 'Formation';
    doc.setFontSize(18);
    doc.setTextColor(goldColor);
    doc.text(formationTitle, 148, 158, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text('Delivre le ' + date, 148, 175, { align: 'center' });

    // Footer avec logo
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text('Certificat verifie par Tweadup', 148, 190, { align: 'center' });

    // Sauvegarder
    doc.save('Certificat-Tweadup-' + certFormationId + '.pdf');

    showToast('PDF telecharge avec succes !', 'success');
}

loadCertificate();