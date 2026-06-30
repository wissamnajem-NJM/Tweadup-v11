const examFormationId = window.location.pathname.split('/').pop();
let currentQuiz = null;
let selectedAnswers = {};

async function loadExam() {
    try {
        const data = await apiFetch('/exams/formation/' + examFormationId);
        if (!data || !data.quiz) {
            document.getElementById('examContainer').innerHTML = '<h2>Aucun examen</h2>';
            return;
        }

        currentQuiz = data.quiz;
        const questions = data.quiz.questions || [];

        document.getElementById('examContainer').innerHTML = `
            <div class="exam-header">
                <h1>${currentQuiz.title}</h1>
                <p>${questions.length} questions • ${currentQuiz.passing_score}% pour réussir</p>
            </div>
            <div class="exam-card">
                ${questions.map((q, index) => `
                    <div class="question-item">
                        <span class="question-number">Question ${index + 1}</span>
                        <div class="question-text">${q.question}</div>
                        <div class="answers-list">
                            ${q.answers.map(a => `
                                <div class="answer-option" onclick="selectAnswer(${q.id}, ${a.id})" id="answer-${q.id}-${a.id}">
                                    <input type="radio" name="question_${q.id}" value="${a.id}">
                                    <label>${a.text}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
                <button class="btn btn-primary btn-full" onclick="submitExam()">
                    Soumettre
                </button>
            </div>
        `;
    } catch (err) {
        console.error('Erreur:', err);
    }
}

function selectAnswer(questionId, answerId) {
    selectedAnswers[questionId] = answerId;
    document.querySelectorAll(`[id^="answer-${questionId}-"]`).forEach(el => el.classList.remove('selected'));
    document.getElementById(`answer-${questionId}-${answerId}`).classList.add('selected');
}

async function submitExam() {
    if (!currentQuiz) return;

    const questions = currentQuiz.questions || [];
    
    if (Object.keys(selectedAnswers).length < questions.length) {
        if (!confirm('Questions non répondues. Soumettre quand même ?')) return;
    }

    console.log('ANSWERS TO SEND:', selectedAnswers);
    console.log('FORMATION ID:', examFormationId);

    const payload = {
        quizId: currentQuiz.id,
        answers: selectedAnswers,
        formationId: parseInt(examFormationId)
    };

    console.log('PAYLOAD:', JSON.stringify(payload));

    const result = await apiFetch('/exams/submit', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    console.log('RESULT:', result);

    if (result) showResult(result);
}

function showResult(result) {
    const container = document.getElementById('examContainer');
    container.innerHTML = `
        <div class="exam-result">
            <div class="result-icon ${result.passed ? 'success' : 'fail'}">
                <i class="fas ${result.passed ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            </div>
            <div class="result-score">${result.percentage}%</div>
            <p>Score: ${result.score}/${result.totalPoints}</p>
            <p>${result.message}</p>
            ${result.passed ? `
                <a href="/certificate/${examFormationId}" class="btn btn-success">Voir certificat</a>
            ` : '<button onclick="loadExam()" class="btn btn-primary">Réessayer</button>'}
        </div>
    `;
}

loadExam();