

(function() {
    
    function loadJson(url) {
        return new Promise((resolve, reject) => {
            let req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.onload = () => resolve(JSON.parse(req.responseText));
            req.onerror = err => reject(err);
            req.send();
        });
    }
    
    function loadCategories() {
        return loadJson(`https://opentdb.com/api_category.php`);
    }
    
    function loadQuestions(opts) {
        let count = opts.count || 10;
        let category = opts.category;
        let url = `https://opentdb.com/api.php?amount=${count}`;
        if (category) url += `&category=${category}`;
        return loadJson(url);
    }
    
    categories = [];
    difficulties = [{ id: '', name: 'Any' }, { id: 'easy', name: 'Easy' }, { id: 'medium', name: 'Medium' }, { id: 'hard', name: 'Hard' }];
    types = [{ id: '', name: 'Any' }, { id: 'multiple', name: 'Multiple Choice' }, { id: 'boolean', name: 'True or False' }];
    
    function addSelect(name, options, container) {
        let label = document.createElement('label');
        label.textContent = name;
        
        let select = document.createElement('select');
        for (let q = 0; q < options.length; q++) {
            let cat = options[q];
            let option = document.createElement('option');
            option.value = cat.id;
            option.text = cat.name;
            select.appendChild(option);
        }
        select.selectedIndex = 0;
        label.appendChild(select);
        
        container.appendChild(label);
        return select;
    }
    
    async function init() {
        let loadedCategories = (await loadCategories()).trivia_categories;
        let categories = [{ id: 0, name: 'Any' }, ...loadedCategories];
        
        let container = document.getElementById('gameContainer');
        container.innerHTML = '';
        
        let categorySelect = addSelect('Category', categories, container);
        let difficultySelect = addSelect('Difficulty', difficulties, container);
        let typeSelect = addSelect('Question Type', types, container);
        
        let submitButton = document.createElement('button');
        submitButton.type = 'button';
        submitButton.textContent = 'Retrieve Questions';
        submitButton.addEventListener('click', async () => {
            categorySelect.disabled = true;
            difficultySelect.disabled = true;
            typeSelect.disabled = true;
            submitButton.disabled = true;
            let questions = await loadQuestions({
                category: categorySelect.value,
                difficulty: difficultySelect.value,
                type: typeSelect.value
            });
            startGame(questions.results);
        });
        container.appendChild(submitButton);
    }
    init();
    
    async function startGame(questions) {
        let container = document.getElementById('gameContainer');
        container.innerHTML = '<div class="info">Your questions are ready.</div>';
        console.log(questions);
        
        let submitButton = document.createElement('button');
        submitButton.type = 'button';
        submitButton.textContent = 'Begin Game';
        submitButton.addEventListener('click', startTimer);
        container.appendChild(submitButton);
        
        timeLeft = 10 * questions.length;
        correctCount = 0;
        async function startTimer() {
            correctCount = 0;
            nextQuestion();
        }
        
        currentQuestionIdx = -1;
        correctAnswerIdx = -1;
        selectedAnswerIdx = -1;
        function nextQuestion() {
            if (++currentQuestionIdx === questions.length) {
                container.innerHTML = `<div class="info">You Got ${correctCount} Questions Right!</div>`;
                return;
            }
            let question = questions[currentQuestionIdx];
            
            let submitButton = document.createElement('button');
            submitButton.disabled = true;
            submitButton.type = 'button';
            submitButton.textContent = 'Begin Game';
            submitButton.addEventListener('click', () => {
                let isCorrect = selectedAnswerIdx === correctAnswerIdx;
                if (isCorrect) correctCount++;
                console.log(isCorrect ? 'Correct!' : 'Incorrect.');
                nextQuestion();
            });
            
            container.innerHTML = `<div class="info question">${question.question}</div>`;
            correctAnswerIdx = Math.floor(Math.random() * (question.incorrect_answers.length + 1));
            for (let q = 0; q < question.incorrect_answers.length + 1; q++) {
                let answer;
                if (q === correctAnswerIdx) {
                    answer = question.correct_answer;
                }
                else {
                    let iaidx = q > correctAnswerIdx ? q - 1 : q;
                    answer = question.incorrect_answers[iaidx];
                }
                let label = document.createElement('label');
                let radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'answer';
                radio.addEventListener('change', () => {
                    selectedAnswerIdx = q;
                    submitButton.disabled = false;
                });
                label.appendChild(radio);
                let span = document.createElement('span');
                span.innerHTML = answer;
                label.appendChild(span);
                container.appendChild(label);
            }
            container.appendChild(submitButton);
        }
    }
    
    
})();
