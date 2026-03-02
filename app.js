const state = {
    currentQuestion: 0,
    answers: {
        age: 0,
        income: 0,
        wealth: 0,
        workout: 0,
        books: 0
    },
    scores: {
        income: 0,
        wealth: 0,
        workout: 0,
        books: 0
    },
    finalPercentile: 0
};

const benchmarks = {
    income: {
        20: 2500,
        25: 4000,
        30: 5500,
        35: 7000,
        40: 8000,
        45: 9000,
        50: 9500,
        55: 10000,
        60: 9000
    },
    wealth: {
        20: 5000,
        25: 15000,
        30: 40000,
        35: 80000,
        40: 130000,
        45: 180000,
        50: 230000,
        55: 280000,
        60: 300000
    },
    workout: {
        20: 3,
        25: 3,
        30: 2,
        35: 2,
        40: 2,
        45: 2,
        50: 1,
        55: 1,
        60: 1
    },
    books: {
        20: 6,
        25: 5,
        30: 4,
        35: 3,
        40: 3,
        45: 2,
        50: 2,
        55: 2,
        60: 2
    }
};

const areaLabels = {
    income: 'renda',
    wealth: 'patrimônio',
    workout: 'rotina física',
    books: 'leitura'
};

function getBenchmark(age, type) {
    const ages = Object.keys(benchmarks[type]).map(Number).sort((a, b) => a - b);
    let lower = ages[0];
    let upper = ages[ages.length - 1];
    
    for (let i = 0; i < ages.length - 1; i++) {
        if (age >= ages[i] && age <= ages[i + 1]) {
            if (age - ages[i] < ages[i + 1] - age) {
                lower = ages[i];
                upper = ages[i];
            } else {
                lower = ages[i + 1];
                upper = ages[i + 1];
            }
            break;
        }
    }
    
    if (age < lower) return benchmarks[type][lower];
    if (age > upper) return benchmarks[type][upper];
    
    const ratio = (age - lower) / (upper - lower || 1);
    return Math.round(benchmarks[type][lower] + (benchmarks[type][upper] - benchmarks[type][lower]) * ratio);
}

function normalizeScore(value, benchmark, type) {
    if (type === 'workout' || type === 'books') {
        return Math.min(100, Math.round((value / benchmark) * 50));
    }
    const ratio = value / benchmark;
    return Math.min(100, Math.round(ratio * 50));
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showQuiz() {
    state.currentQuestion = 0;
    updateQuestion();
    showScreen('quiz');
}

function updateQuestion() {
    document.querySelectorAll('.question').forEach((q, i) => {
        q.classList.toggle('active', i === state.currentQuestion);
    });
    updateProgress();
}

function updateProgress() {
    const progress = ((state.currentQuestion + 1) / 5) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
}

function nextQuestion() {
    const inputs = ['age', 'income', 'wealth'];
    const inputId = inputs[state.currentQuestion];
    const input = document.getElementById(inputId);
    let value;
    
    if (inputId === 'income' || inputId === 'wealth') {
        value = parseCurrency(input.value);
    } else {
        value = parseNumber(input.value);
    }
    
    if (inputId === 'age' && value < 16) {
        alert('Idade mínima: 16 anos');
        return;
    }
    
    state.answers[inputId] = value;
    
    state.currentQuestion++;
    
    if (state.currentQuestion < 5) {
        updateQuestion();
    }
}

function selectOption(type, value) {
    state.answers[type] = value;
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    
    setTimeout(() => {
        state.currentQuestion++;
        if (state.currentQuestion < 5) {
            updateQuestion();
        }
    }, 300);
}

function calculateScores() {
    const age = state.answers.age;
    
    Object.keys(benchmarks).forEach(type => {
        const benchmark = getBenchmark(age, type);
        const score = normalizeScore(state.answers[type], benchmark, type);
        state.scores[type] = score;
    });
}

function getWeakestArea() {
    return Object.entries(state.scores).reduce((a, b) => a[1] < b[1] ? a : b)[0];
}

function calculateResult() {
    const booksValue = parseNumber(document.getElementById('books').value);
    state.answers.books = booksValue;
    
    calculateScores();
    
    const weights = {
        income: 0.35,
        wealth: 0.35,
        workout: 0.15,
        books: 0.15
    };
    
    let weightedScore = 0;
    Object.keys(weights).forEach(key => {
        weightedScore += state.scores[key] * weights[key];
    });
    
    const randomFactor = (Math.random() - 0.5) * 10;
    let percentile = Math.round(weightedScore + randomFactor);
    percentile = Math.max(1, Math.min(99, percentile));
    
    if (weightedScore > 60) {
        percentile = Math.max(percentile, 40 + Math.floor(Math.random() * 20));
        percentile = Math.min(99, percentile);
    } else if (weightedScore < 30) {
        percentile = Math.min(percentile, 30 + Math.floor(Math.random() * 20));
        percentile = Math.max(1, percentile);
    }
    
    state.finalPercentile = percentile;
    
    displayResult();
}

function displayResult() {
    const percentile = state.finalPercentile;
    const behindPercent = 100 - percentile;
    
    document.getElementById('percentile').textContent = percentile + '%';
    document.getElementById('resultMessage').textContent = 
        `Você está atrás de ${behindPercent}% das pessoas da sua idade.`;
    
    const weakestArea = getWeakestArea();
    document.getElementById('resultDetail').textContent = 
        `Seu maior atraso está em: ${areaLabels[weakestArea]}`;
    
    showScreen('result');
}

function shareResult() {
    const percentile = state.finalPercentile;
    const behindPercent = 100 - percentile;
    const text = `Descobri que estou atrás de ${behindPercent}% da minha idade no atrasado.app. Faça o teste.`;
    
    if (navigator.share) {
        navigator.share({
            title: 'atrasado.app',
            text: text
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.share-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Copiado!';
            setTimeout(() => btn.textContent = originalText, 2000);
        });
    }
}

function restart() {
    state.currentQuestion = 0;
    state.answers = {
        age: 0,
        income: 0,
        wealth: 0,
        workout: 0,
        books: 0
    };
    state.scores = {
        income: 0,
        wealth: 0,
        workout: 0,
        books: 0
    };
    
    document.querySelectorAll('input').forEach(input => input.value = '');
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('progressFill').style.width = '0%';
    
    showScreen('landing');
}

function parseNumber(value) {
    return parseInt(value.replace(/\D/g, '')) || 0;
}

function parseCurrency(value) {
    const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function applyCurrencyMask(input) {
    let value = input.value.replace(/\D/g, '');
    if (!value) {
        input.value = '';
        return;
    }
    value = parseInt(value);
    const formatted = value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    input.value = 'R$ ' + formatted;
}

function applyNumberMask(input, maxLength) {
    let value = input.value.replace(/\D/g, '');
    if (maxLength) {
        value = value.slice(0, maxLength);
    }
    input.value = value;
}

document.querySelectorAll('.currency').forEach(input => {
    input.addEventListener('input', (e) => {
        applyCurrencyMask(e.target);
    });
});

document.getElementById('age').addEventListener('input', (e) => {
    applyNumberMask(e.target, 3);
});

document.getElementById('books').addEventListener('input', (e) => {
    applyNumberMask(e.target, 3);
});

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const activeQuestion = document.querySelector('.question.active');
        if (activeQuestion) {
            const nextBtn = activeQuestion.querySelector('.next-btn');
            if (nextBtn && nextBtn.textContent === 'Ver Resultado') {
                calculateResult();
            } else if (nextBtn) {
                nextQuestion();
            }
        }
    }
});
