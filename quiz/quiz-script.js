document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const quizScreen = document.getElementById('quiz-screen');
    const nameEntryScreen = document.getElementById('name-entry-screen');
    const resultScreen = document.getElementById('result-screen');
    const questionText = document.getElementById('question-text');
    const questionCounter = document.getElementById('question-counter');
    const scoreDisplay = document.getElementById('score');
    const answerButtonsContainer = document.getElementById('answer-buttons');
    const nextButton = document.getElementById('next-btn');
    const restartButton = document.getElementById('restart-btn');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalScoreNameDisplay = document.getElementById('final-score-name');
    const playerNameInput = document.getElementById('player-name');
    const submitScoreBtn = document.getElementById('submit-score-btn');
    const leaderboardList = document.getElementById('leaderboard-list');
    
    // --- VARIÁVEIS DE ESTADO DO JOGO ---
    let currentQuestion = null;
    let score = 0;
    let questionIndex = 0;
    const TOTAL_QUESTIONS = 5; // Defina quantas perguntas o quiz terá
    let questionStartTime = 0; // timestamp do início da pergunta
    let totalElapsedMs = 0;    // acumulado de tempo de resposta

    // --- FUNÇÕES PRINCIPAIS ---

    // 1. Inicia ou Reinicia o Quiz
    function startQuiz() {
        score = 0;
        questionIndex = 0;
        totalElapsedMs = 0;
        resultScreen.classList.add('hidden');
        nameEntryScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        scoreDisplay.innerText = score;
        fetchAndDisplayQuestion();
    }

    // 2. Busca uma nova pergunta da nossa API de backend
    async function fetchAndDisplayQuestion() {
        resetState();
        questionCounter.innerText = `${questionIndex + 1} / ${TOTAL_QUESTIONS}`;
        questionText.innerText = 'Gerando uma nova pergunta com IA...';

        try {
            // Chama o nosso backend
            const response = await fetch('/api/generate-question');
            if (!response.ok) {
                throw new Error('Falha ao buscar pergunta. Tente novamente.');
            }
            const data = await response.json();
            currentQuestion = data;
            
            // Exibe a pergunta e as respostas
            questionText.innerText = currentQuestion.question;
            for (const key in currentQuestion.answers) {
                const button = document.createElement('button');
                button.innerText = currentQuestion.answers[key];
                button.classList.add('btn');
                button.dataset.answer = key;
                answerButtonsContainer.appendChild(button);
            }

            // marca início da pergunta para cálculo do bônus de tempo
            questionStartTime = performance.now();
        } catch (error) {
            questionText.innerText = 'Oops! Erro ao carregar a pergunta.';
            console.error(error);
        }
    }

    // 3. Reseta o estado para a próxima pergunta
    function resetState() {
        nextButton.classList.add('hidden');
        while (answerButtonsContainer.firstChild) {
            answerButtonsContainer.removeChild(answerButtonsContainer.firstChild);
        }
    }

    // 4. Seleciona e verifica a resposta
    function selectAnswer(e) {
        const selectedButton = e.target;
        const selectedAnswer = selectedButton.dataset.answer;
        
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

        if (isCorrect) {
            selectedButton.classList.add('correct');
            const answeredAt = performance.now();
            const elapsedMs = Math.max(0, answeredAt - questionStartTime);
            totalElapsedMs += elapsedMs;

            // Pontos: 100 fixos + bônus de tempo (mais rápido => mais pontos)
            // Ex.: bônus = max(0, 100 - floor(elapsedMs/100)) -> até +100 no instantâneo, decaindo 1 ponto a cada 100ms
            const timeBonus = Math.max(0, 100 - Math.floor(elapsedMs / 100));
            score += 100 + timeBonus;
            scoreDisplay.innerText = score;
        } else {
            selectedButton.classList.add('incorrect');
            // mesmo se errar, ainda somamos o tempo total para medianas
            const answeredAt = performance.now();
            const elapsedMs = Math.max(0, answeredAt - questionStartTime);
            totalElapsedMs += elapsedMs;
        }

        // Mostra qual era a resposta correta e desabilita os botões
        Array.from(answerButtonsContainer.children).forEach(button => {
            if (button.dataset.answer === currentQuestion.correctAnswer) {
                button.classList.add('correct');
            }
            button.disabled = true;
        });
        
        // Verifica se o quiz terminou ou mostra o botão de "próxima"
        if (questionIndex < TOTAL_QUESTIONS - 1) {
            nextButton.classList.remove('hidden');
        } else {
            setTimeout(showNameEntry, 800); // vai para tela de nome
        }
    }

    // 5. Tela de inserção de nome
    function showNameEntry() {
        quizScreen.classList.add('hidden');
        nameEntryScreen.classList.remove('hidden');
        finalScoreNameDisplay.innerText = score;
        playerNameInput.value = '';
        playerNameInput.focus();
    }

    // 6. Envia a pontuação e mostra leaderboard
    async function submitScore() {
        const name = (playerNameInput.value || '').trim();
        if (!name) return;
        try {
            const payload = { name, score, time: Math.floor(totalElapsedMs) };
            const resp = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) {
                const errorData = await resp.json().catch(() => ({}));
                console.error('Erro do servidor:', errorData);
                throw new Error(`Falha ao enviar pontuação: ${errorData.details || resp.statusText}`);
            }
            await loadLeaderboard();
            nameEntryScreen.classList.add('hidden');
            resultScreen.classList.remove('hidden');
            finalScoreDisplay.innerText = score;
        } catch (err) {
            console.error('Erro completo:', err);
            console.error('Mensagem:', err.message);
            alert(`Erro: ${err.message}`);
        }
    }

    async function loadLeaderboard() {
        leaderboardList.innerHTML = '';
        try {
            const resp = await fetch('/api/leaderboard');
            if (!resp.ok) throw new Error('Falha ao carregar leaderboard');
            const data = await resp.json();
            data.forEach((item, idx) => {
                const li = document.createElement('li');
                const timeSec = (item.time ?? 0) / 1000;
                li.textContent = `${idx + 1}. ${item.name} — ${item.score} pts — ${timeSec.toFixed(2)}s`;
                leaderboardList.appendChild(li);
            });
        } catch (e) {
            console.error(e);
            const li = document.createElement('li');
            li.textContent = 'Não foi possível carregar o ranking agora.';
            leaderboardList.appendChild(li);
        }
    }


    // --- EVENT LISTENERS ---

    // Delegação de evento para os botões de resposta
    answerButtonsContainer.addEventListener('click', (e) => {
        if (e.target.matches('.btn') && e.target.dataset.answer) {
            selectAnswer(e);
        }
    });
    
    // Botão de Próxima Pergunta
    nextButton.addEventListener('click', () => {
        questionIndex++;
        fetchAndDisplayQuestion();
    });

    // Botão de Reiniciar
    restartButton.addEventListener('click', startQuiz);

    // Enviar pontuação
    submitScoreBtn.addEventListener('click', submitScore);
    playerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitScore();
    });

    // --- INICIA O QUIZ ---
    startQuiz();
});