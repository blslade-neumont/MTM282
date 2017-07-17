

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
        let difficulty = opts.difficulty;
        let type = opts.type;
        let url = `https://opentdb.com/api.php?amount=${count}`;
        if (category) url += `&category=${category}`;
        if (difficulty) url += `&difficulty=${difficulty}`;
        if (type) url += `&type=${type}`;
        return loadJson(url);
    }
    
    categories = null;
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
    
    function writeCookie(name, value) {
        document.cookie = `${name}=${escape(JSON.stringify(value))}; path=/`;
    }
    function readCookie(name) {
        if (!document.cookie) return null;
        let start = document.cookie.indexOf(name + '=');
        if (start === -1) return null;
        let end = document.cookie.indexOf(';', start);
        if (end === -1) end = document.cookie.length;
        return JSON.parse(unescape(document.cookie.substring(start + name.length + 1, end)));
    }
    function setHighscore(score) {
        writeCookie('highscore', score);
    }
    function getHighscore() {
        return readCookie('highscore');
    }
    
    function getDifficultyValue(difficulty) {
        if (difficulty === 'easy') return 1;
        else if (difficulty === 'medium') return 2;
        else return 4;
    }
    
    async function init() {
        if (!categories) {
            let loadedCategories = (await loadCategories()).trivia_categories;
            categories = [{ id: 0, name: 'Any' }, ...loadedCategories];
        }
        
        let container = document.getElementById('gameContainer');
        container.innerHTML = '<div class="info">Welcome to Trivia!</div>' +
            `<p>The current highscore is ${getHighscore() || 0}.</p>` +
            `<p>You gain score by answering harder questions correctly. ` +
            `Correct streaks are worth more than individual answers. ` +
            `Multiple choice are worth more than true/false questions.</p>` +
            `<p>Select your game options to continue.</p>`;
        
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
        let msg = questions.length === 10 ? 'Your questions are ready.' :
                        !questions.length ? `Could not find questions with those specs. Try again!` :
                                            `Only found ${questions.length} question${questions.length > 1 ? 's' : ''}`;
        container.innerHTML = `<div class="info">${msg}</div>`;
        console.log(questions);
        
        if (questions.length !== 10) {
            let backButton = document.createElement('button');
            backButton.type = 'button';
            backButton.textContent = 'Modify Search';
            backButton.addEventListener('click', init);
            container.appendChild(backButton);
        }
        if (questions.length) {
            let submitButton = document.createElement('button');
            submitButton.type = 'button';
            submitButton.textContent = 'Begin Game';
            submitButton.addEventListener('click', startTimer);
            container.appendChild(submitButton);
        }
        
        timeLeft = 10 * questions.length;
        correctCount = 0;
        difficultySum = 0;
        longestCorrectStreak = 0;
        correctStreak = 0;
        trueFalseTotal = 0;
        async function startTimer() {
            correctCount = 0;
            nextQuestion();
        }
        
        currentQuestionIdx = -1;
        correctAnswerIdx = -1;
        selectedAnswerIdx = -1;
        function nextQuestion() {
            if (++currentQuestionIdx === questions.length) {
                endGame();
                return;
            }
            let question = questions[currentQuestionIdx];
            container.innerHTML = '';
            
            let questionEl = document.createElement('div');
            questionEl.classList.add('info');
            questionEl.classList.add('question');
            questionEl.innerHTML = question.question;
            container.appendChild(questionEl);
            
            let submitButton = document.createElement('button');
            submitButton.disabled = true;
            submitButton.type = 'button';
            submitButton.textContent = 'Submit Answer';
            submitButton.addEventListener('click', () => {
                submitButton.disabled = true;
                let isCorrect = selectedAnswerIdx === correctAnswerIdx;
                if (isCorrect) {
                    correctCount++;
                    difficultySum += getDifficultyValue(question.difficulty);
                    correctStreak++;
                    if (longestCorrectStreak < correctStreak) longestCorrectStreak = correctStreak;
                    if (question.incorrect_answers.length === 1) trueFalseTotal++;
                }
                else correctStreak = 0;
                console.log(isCorrect ? 'Correct!' : 'Incorrect.');
                questionEl.classList.add('done');
                submitButton.disabled = true;
                setTimeout(() => nextQuestion(), 2000);
            });
            
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
                label.className = q === correctAnswerIdx ? 'correct' : 'incorrect';
                let radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'answer';
                radio.addEventListener('change', () => {
                    if (questionEl.classList.contains('done')) return;
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
        
        function endGame() {
            let score = Math.ceil(difficultySum * (((questions.length * 2) - trueFalseTotal) / (questions.length * 2)) * (1 + (longestCorrectStreak / 10)));
            container.innerHTML = `<div class="info">You Got ${correctCount} Question${correctCount !== 1 ? 's' : ''} Right!</div>` +
                `<p>Base Score: ${correctCount}</p>` +
                `<p>* Difficulty Modifier: ${Math.floor((difficultySum / correctCount) * 100)}%</p>` +
                `<p>* True/False Modifier: ${Math.floor((((questions.length * 2) - trueFalseTotal) / (questions.length * 2)) * 100)}%</p>` +
                `<p>* Longest Streak (${longestCorrectStreak}) Modifier: ${1 + (longestCorrectStreak / 10)}</p>` +
                `<p>= Final Score: <strong>${score}</strong> (rounded up)</p>`;
            
            let previousScore = getHighscore() || 0;
            let p = document.createElement('p');
            if (previousScore === score) p.innerText = 'You matched your previous high score!';
            else if (previousScore < score) {
                p.innerText = `You beat your previous hich score by ${score - previousScore} points!`;
                setHighscore(score);
            }
            else p.innerText = `You fell short of your previous high score by ${previousScore - score} points.`;
            container.appendChild(p);
            
            let backButton = document.createElement('button');
            backButton.type = 'button';
            backButton.textContent = 'Play Again';
            backButton.addEventListener('click', init);
            container.appendChild(backButton);
        }
    }
    
})();
