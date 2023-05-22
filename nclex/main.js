let questions = []; // This will hold your questions
let currentIndex = -1; // This will track the current question
let selectedOption = -1; // This will track the selected option
let correctAnswers = 0; // This will count the correct answers
let difficultyLevel = 1; // The initial difficulty level
let consecutiveCorrectAnswers = 0; // The counter for consecutive correct answers

let questionTimer; // This will hold the question timer
let overallTimer; // This will hold the overall timer
let questionTime; // This will hold the question time
let overallTime; // This will hold the overall time
let submittedAnswerCount;

function startTimers() {
    overallTime = 0;
    questionTime = 0;
    overallTimer = setInterval(() => {
        overallTime++;
        document.getElementById('overallTimer').textContent = 'Overall Timer: ' + overallTime;
    }, 1000);
}

function startQuestionTimer() {
    questionTime = 0;
    questionTimer = setInterval(() => {
        questionTime++;
        document.getElementById('questionTimer').textContent = 'Question Timer: ' + questionTime;
    }, 1000);
}

function stopQuestionTimer() {
    clearInterval(questionTimer);
}

// This function will load your JSON file
function loadJson() {
    fetch('data.json')
    .then(response => response.json())
    .then(data => {
        questions = data;
        // startTimers();
        nextQuestion();
    });
}

// This function will show a question
function showQuestion() {
    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');

    questionElement.textContent = questions[currentIndex].question;
    
    // Clear old options and add new ones
    optionsElement.innerHTML = '';
    for (let i = 0; i < questions[currentIndex].options.length; i++) {
        const li = document.createElement('li');
        li.style.color = 'black'; // Reset color
        li.textContent = questions[currentIndex].options[i].split(" - ")[0]; // Reset text
        li.addEventListener('click', () => selectOption(i));
        optionsElement.appendChild(li);
    }

    selectedOption = -1; // Reset selected option
}


// This function will handle the logic when an option is clicked
function selectOption(optionIndex) {
    // Remove the selected class from the previously selected option
    if (selectedOption != -1) {
        document.getElementById('options').children[selectedOption].classList.remove('selected');
    }

    selectedOption = optionIndex;
    // Add the selected class to the new selected option
    document.getElementById('options').children[selectedOption].classList.add('selected');
}

// This function will handle the logic when the answer is submitted
function submitAnswer() {
    const optionsElement = document.getElementById('options');
    const correctOption = optionsElement.children[questions[currentIndex].answer];
    const selectedOptionElement = optionsElement.children[selectedOption];
    submittedAnswerCount++;

    if (selectedOption === questions[currentIndex].answer) {
        correctAnswers++;
        consecutiveCorrectAnswers++;
        if (consecutiveCorrectAnswers === 10 && difficultyLevel === 5) {
            // The user has passed the test
            stopQuestionTimer();
            clearInterval(overallTimer);
            alert('Congratulations, you passed the test!');
            return;
        }
        if (difficultyLevel < 5) {
            difficultyLevel++;
        }
        correctOption.style.color = 'green';
        correctOption.textContent += " - Correct";
    } else {
        consecutiveCorrectAnswers = 0;
        if (difficultyLevel > 1) {
            difficultyLevel--;
        }
        correctOption.style.color = 'green';
        correctOption.textContent += " - Correct";
        selectedOptionElement.style.color = 'red';
        selectedOptionElement.textContent += " - Your Answer";
    }

    document.getElementById('rationale').textContent = questions[currentIndex].rationale;
    document.getElementById('rationaleContainer').style.display = 'block';
    document.getElementById('nextQuestionButton').style.display = 'inline-block';
    document.getElementById('submitAnswerButton').style.display = 'none';
}

// This function will handle the logic when the "Next Question" button is clicked
function nextQuestion() {
    currentIndex++;
    stopQuestionTimer();

    if (currentIndex < questions.length) {
        startQuestionTimer();
        showQuestion();
        document.getElementById('rationaleContainer').style.display = 'none';
        document.getElementById('nextQuestionButton').style.display = 'none';
        document.getElementById('submitAnswerButton').style.display = 'inline-block';
    } else {
        // The user has answered all the questions
        stopQuestionTimer();
        clearInterval(overallTimer);
        
        // Now we check the user's score to determine whether they passed or failed
        let score = correctAnswers / (submittedAnswerCount) * 100; // Update score calculation
        if (score >= 70) {
            alert('Congratulations, you passed the test with a score of ' + score + '%!');
        } else {
            alert('Sorry, you did not pass the test. Your score was ' + score + '%.');
        }
    }
}
    
    // Randomly select a question of the current difficulty level
//     let randomIndex = Math.floor(Math.random() * filteredQuestions.length);
//     currentIndex = questions.indexOf(filteredQuestions[randomIndex]);

//     startQuestionTimer();
//     showQuestion();
//     document.getElementById('rationaleContainer').style.display = 'none';
//     document.getElementById('nextQuestionButton').style.display = 'none';
//     document.getElementById('submitAnswerButton').style.display = 'inline-block';
// }

// This function will start the test
function startTest() {
    document.getElementById('startTestButton').style.display = 'none';
    document.getElementById('testContainer').style.display = 'block';
    submittedAnswerCount=0;
    startTimers();
    loadJson();
}

// Add a bar to show how many answers are correct so fat, and what percentage of questions are correct. I added a variable 

