// ===== EXAM =====
const examFormationId = window.location.pathname.split('/').pop();
let currentQuiz = null;
let selectedAnswers = {};
let timeLeft = 0;
let timerInterval = null;

async function loadExam() {
    try {
        const data = await apiFetch('/exams/formation/' + examFormationId);

        if (!data || !data.quiz) {
            document.getElementById('examContainer').innerHTML = `
                <div class="exam-result">
                    <div class="result-icon fail"><i class="fas fa-exclamation-circle"></i></div>
                    <h2>Aucun examen disponible</h2>
                    <p class="result-message">Cette formation ne possede pas encore d examen.</p>
                    <a href="/formation/${examFormationId}" class="btn btn-primary">Retour a la formation</a>
                </div>
            `;
            return;
        }

        currentQuiz = data.quiz;
        const questions = data.quiz.questions || [];

        // Demarrer le timer si time_limit est defini
        if (currentQuiz.time_limit) {
            timeLeft = currentQuiz.time_limit * 60; // convertir en secondes
            startTimer();
        }

        document.getElementById('examContainer').innerHTML = `
            <div class="exam-header">
                <h1><i class="fas fa-clipboard-check"></i> ${currentQuiz.title}</h1>
                <p>${currentQuiz.description || 'Testez vos connaissances'} • ${questions.length} questions • ${currentQuiz.passing_score}% pour reussir</p>
                ${currentQuiz.time_limit ? `<div id="examTimer" style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin-top: 0.5rem;">${currentQuiz.time_limit}:00</div>` : ''}
            </div>
            <div class="exam-card">
                ${questions.map((q, index) => `
                    <div class="question-item" id="question-${q.id}">
                        <span class="question-number">Question ${index + 1}</span>
                        <div class="question-text">${q.question}</div>
                        ${q.explanation ? `<p style="color: var(--gray-500); font-size: 0.9rem; margin-bottom: 1rem;">${q.explanation}</p>` : ''}
                        <div class="answers-list">
                            ${q.answers.map(a => `
                                <div class="answer-option" onclick="selectAnswer(${q.id}, ${a.id})" id="answer-${q.id}-${a.id}">
                                    <input type="radio" name="question_${q.id}" value="${a.id}" id="radio-${q.id}-${a.id}">
                                    <label for="radio-${q.id}-${a.id}">${a.text}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
                <button class="btn btn-primary btn-full" onclick="submitExam()" style="margin-top: 1rem;">
                    <i class="fas fa-paper-plane"></i> Soumettre l'examen
                </button>
            </div>
        `;
    } catch (err) {
        console.error('Erreur chargement examen:', err);
        document.getElementById('examContainer').innerHTML = '<p>Erreur de chargement de l examen</p>';
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timerEl = document.getElementById('examTimer');
        if (timerEl) {
            timerEl.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
            if (timeLeft <= 60) timerEl.style.color = 'var(--danger)';
        }
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitExam();
        }
    }, 1000);
}

function selectAnswer(questionId, answerId) {
    selectedAnswers[questionId] = answerId;

    // Update visual
    document.querySelectorAll('[id^="answer-' + questionId + '-"]').forEach(el => {
        el.classList.remove('selected');
    });
    document.getElementById('answer-' + questionId + '-' + answerId).classList.add('selected');
    document.getElementById('radio-' + questionId + '-' + answerId).checked = true;
}

async function submitExam() {
    if (timerInterval) clearInterval(timerInterval);

    const questions = currentQuiz.questions || [];

    if (Object.keys(selectedAnswers).length < questions.length) {
        const unanswered = questions.filter(q => !selectedAnswers[q.id]).length;
        if (!confirm('Vous n avez pas repondu a ' + unanswered + ' question(s). Voulez-vous quand meme soumettre ?')) {
            return;
        }
    }

    const btn = document.querySelector('.exam-card button');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Correction en cours...';
    btn.disabled = true;

    const result = await apiFetch('/exams/submit', {
        method: 'POST',
        body: JSON.stringify({
            quizId: currentQuiz.id,
            answers: selectedAnswers,
            formationId: examFormationId
        })
    });

    if (result) {
        showResult(result);
    }
}

function showResult(result) {
    const container = document.getElementById('examContainer');
    const icon = result.passed ? 'fa-check-circle' : 'fa-times-circle';
    const iconClass = result.passed ? 'success' : 'fail';
    const color = result.passed ? 'var(--secondary)' : 'var(--danger)';

    container.innerHTML = `
        <div class="exam-result">
            <div class="result-icon ${iconClass}"><i class="fas ${icon}"></i></div>
            <div class="result-score" style="color: ${color};">${result.percentage}%</div>
            <p class="result-message">${result.message}</p>
            <p style="color: var(--gray-500); margin-bottom: 2rem;">
                Score: ${result.score}/${result.totalPoints} points
            </p>
            <div class="certificate-actions">
                ${result.passed ? `
                    <a href="/certificate/${examFormationId}" class="btn btn-success btn-lg">
                        <i class="fas fa-certificate"></i> Voir mon certificat
                    </a>
                ` : `
                    <button class="btn btn-primary" onclick="loadExam()">
                        <i class="fas fa-redo"></i> Reessayer
                    </button>
                `}
                <a href="/formation/${examFormationId}" class="btn btn-outline">
                    <i class="fas fa-arrow-left"></i> Retour a la formation
                </a>
            </div>
        </div>
    `;
}

loadExam();
