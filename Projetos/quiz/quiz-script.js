document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do HTML
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    const questionText = document.getElementById('question-text');
    const questionCounterText = document.getElementById('question-counter');
    const scoreText = document.getElementById('score');
    const answerButtonsElement = document.getElementById('answer-buttons');
    const nextButton = document.getElementById('next-btn');
    const restartButton = document.getElementById('restart-btn');
    const finalScoreText = document.getElementById('final-score');

    let currentQuestionIndex, score;

    // BANCO DE PERGUNTAS
    const questions = [
        {
            question: 'Qual é o principal objetivo do "Posicionamento de Marca"?',
            answers: [
                { text: 'Criar um logotipo memorável', correct: false },
                { text: 'Ocupar um lugar único na mente do consumidor', correct: true },
                { text: 'Ter os preços mais baixos do mercado', correct: false },
                { text: 'Vender para o maior número de pessoas', correct: false }
            ]
        },
        {
            question: 'No design, o princípio da "Gestalt" se refere a:',
            answers: [
                { text: 'A teoria das cores primárias e secundárias', correct: false },
                { text: 'O uso correto da tipografia em um layout', correct: false },
                { text: 'Como a mente humana percebe o todo antes das partes', correct: true },
                { text: 'A criação de designs responsivos para web', correct: false }
            ]
        },
        {
            question: 'Qual destes elementos é mais associado à estética "Minimalista"?',
            answers: [
                { text: 'Uso de texturas complexas e ornamentos', correct: false },
                { text: 'Paleta de cores vibrantes e saturadas', correct: false },
                { text: 'Ênfase em espaços negativos e simplicidade', correct: true },
                { text: 'Combinação de várias fontes diferentes', correct: false }
            ]
        },
        {
            question: 'O que define o "Tom de Voz" de uma marca?',
            answers: [
                { text: 'A personalidade e o estilo da sua comunicação escrita', correct: true },
                { text: 'O volume do áudio em seus anúncios de vídeo', correct: false },
                { text: 'As cores principais usadas no seu logotipo', correct: false },
                { text: 'O slogan principal da empresa', correct: false }
            ]
        },
        {
            question: 'A "Regra dos Terços" é uma técnica usada principalmente para:',
            answers: [
                { text: 'Definir a hierarquia de tamanho das fontes', correct: false },
                { text: 'Escolher uma paleta de cores com três tons', correct: false },
                { text: 'Melhorar a composição e o equilíbrio visual', correct: true },
                { text: 'Dividir o orçamento de um projeto de design', correct: false }
            ]
        }
    ];

    // Inicia o Quiz
    function startQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        resultScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        nextButton.classList.add('hidden');
        scoreText.innerText = score;
        showNextQuestion();
    }

    // Mostra a próxima pergunta
    function showNextQuestion() {
        resetState();
        const question = questions[currentQuestionIndex];
        questionText.innerText = question.question;
        questionCounterText.innerText = `${currentQuestionIndex + 1} / ${questions.length}`;
        
        question.answers.forEach(answer => {
            const button = document.createElement('button');
            button.innerText = answer.text;
            button.classList.add('btn');
            if (answer.correct) {
                button.dataset.correct = answer.correct;
            }
            button.addEventListener('click', selectAnswer);
            answerButtonsElement.appendChild(button);
        });
    }

    // Limpa o estado anterior (cores dos botões, etc.)
    function resetState() {
        nextButton.classList.add('hidden');
        while (answerButtonsElement.firstChild) {
            answerButtonsElement.removeChild(answerButtonsElement.firstChild);
        }
    }

    // Função chamada ao clicar em uma resposta
    function selectAnswer(e) {
        const selectedButton = e.target;
        const isCorrect = selectedButton.dataset.correct === 'true';

        if (isCorrect) {
            score += 15;
            scoreText.innerText = score;
            selectedButton.classList.add('correct');
        } else {
            selectedButton.classList.add('incorrect');
        }

        // Mostra qual era a resposta correta
        Array.from(answerButtonsElement.children).forEach(button => {
            if (button.dataset.correct === 'true') {
                button.classList.add('correct');
            }
            button.disabled = true; // Desabilita todos os botões
        });

        // Mostra o botão "Próxima Pergunta"
        nextButton.classList.remove('hidden');
    }

    // Função para mostrar os resultados finais
    function showResults() {
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        finalScoreText.innerText = score;
    }

    // Event Listeners
    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showNextQuestion();
        } else {
            showResults();
        }
    });

    restartButton.addEventListener('click', startQuiz);

    // Inicia o quiz ao carregar a página
    startQuiz();
});