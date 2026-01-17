// AMC 8 Math Adventure - Main Application Logic

// State Management
let state = {
    currentTopic: null,
    currentProblem: null,
    problemIndex: 0,
    sessionStats: {
        attempted: 0,
        correct: 0
    },
    hintUsed: false,
    problems: []
};

// Problem Database - AMC 8 Style Questions
const problemDatabase = {
    counting: [
        {
            difficulty: 'easy',
            question: 'How many even numbers are there between 1 and 20 (not including 1 and 20)?',
            answer: 9,
            hint: 'List them out: 2, 4, 6, 8... What is the last even number before 20?',
            explanation: 'The even numbers between 1 and 20 are: 2, 4, 6, 8, 10, 12, 14, 16, 18. Count them and you get 9 numbers.'
        },
        {
            difficulty: 'medium',
            question: 'A classroom has 24 students. If they form groups of 4, how many groups will there be?',
            answer: 6,
            hint: 'Divide the total number of students by the group size.',
            explanation: '24 ÷ 4 = 6 groups. When you divide 24 students into groups of 4, you get 6 equal groups.'
        },
        {
            difficulty: 'medium',
            question: 'How many ways can you arrange the letters A, B, and C in a row?',
            answer: 6,
            hint: 'Try listing them: ABC, ACB, BAC... Keep going!',
            explanation: 'The arrangements are: ABC, ACB, BAC, BCA, CAB, CBA. That is 6 different ways. This is 3! (3 factorial) = 3 × 2 × 1 = 6.'
        },
        {
            difficulty: 'hard',
            question: 'How many rectangles are in a 2×2 grid? (Include squares as rectangles)',
            answer: 9,
            hint: 'Count the 1×1 squares, then 1×2 rectangles, then 2×1 rectangles, and finally the 2×2 square.',
            explanation: 'There are four 1×1 squares, two 1×2 rectangles, two 2×1 rectangles, and one 2×2 square. Total: 4 + 2 + 2 + 1 = 9 rectangles.'
        },
        {
            difficulty: 'easy',
            question: 'If today is Monday, what day will it be 10 days from now?',
            answer: 4,
            hint: 'There are 7 days in a week. What is 10 ÷ 7? The remainder tells you how many days forward from Monday. (Answer with the number: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun)',
            explanation: '10 days = 1 week + 3 days. Starting from Monday and adding 3 days: Tuesday (1), Wednesday (2), Thursday (3). So it will be Thursday. (Answer: 4)'
        }
    ],
    geometry: [
        {
            difficulty: 'easy',
            question: 'What is the perimeter of a square with side length 7 cm?',
            answer: 28,
            hint: 'A square has 4 equal sides. Add all four sides together.',
            explanation: 'Perimeter = 4 × side length = 4 × 7 = 28 cm. A square has 4 sides of equal length, so you multiply the side by 4.'
        },
        {
            difficulty: 'easy',
            question: 'What is the area of a rectangle that is 6 inches long and 4 inches wide?',
            answer: 24,
            hint: 'Area of a rectangle = length × width',
            explanation: 'Area = length × width = 6 × 4 = 24 square inches.'
        },
        {
            difficulty: 'medium',
            question: 'A triangle has angles measuring 50° and 70°. What is the measure of the third angle?',
            answer: 60,
            hint: 'The sum of all angles in a triangle is always 180°.',
            explanation: 'The sum of angles in a triangle = 180°. So the third angle = 180° - 50° - 70° = 60°.'
        },
        {
            difficulty: 'medium',
            question: 'What is the area of a triangle with base 10 cm and height 6 cm?',
            answer: 30,
            hint: 'Area of triangle = (base × height) ÷ 2',
            explanation: 'Area = (base × height) ÷ 2 = (10 × 6) ÷ 2 = 60 ÷ 2 = 30 square cm.'
        },
        {
            difficulty: 'hard',
            question: 'A circle has a diameter of 14 cm. What is its radius?',
            answer: 7,
            hint: 'The radius is half the diameter.',
            explanation: 'Radius = diameter ÷ 2 = 14 ÷ 2 = 7 cm. The radius is always half of the diameter.'
        },
        {
            difficulty: 'hard',
            question: 'What is the sum of the interior angles of a pentagon (5-sided shape)?',
            answer: 540,
            hint: 'Use the formula: (n - 2) × 180°, where n is the number of sides.',
            explanation: 'Sum of interior angles = (n - 2) × 180° = (5 - 2) × 180° = 3 × 180° = 540°.'
        }
    ],
    algebra: [
        {
            difficulty: 'easy',
            question: 'If x + 5 = 12, what is x?',
            answer: 7,
            hint: 'Subtract 5 from both sides of the equation.',
            explanation: 'x + 5 = 12, so x = 12 - 5 = 7. Check: 7 + 5 = 12 ✓'
        },
        {
            difficulty: 'easy',
            question: 'What is 3 × n if n = 8?',
            answer: 24,
            hint: 'Replace n with 8 and multiply.',
            explanation: '3 × n = 3 × 8 = 24. Just substitute 8 for n and multiply.'
        },
        {
            difficulty: 'medium',
            question: 'If 2x = 18, what is x?',
            answer: 9,
            hint: 'Divide both sides by 2.',
            explanation: '2x = 18, so x = 18 ÷ 2 = 9. Check: 2 × 9 = 18 ✓'
        },
        {
            difficulty: 'medium',
            question: 'What is the value of y in the equation y - 8 = 15?',
            answer: 23,
            hint: 'Add 8 to both sides.',
            explanation: 'y - 8 = 15, so y = 15 + 8 = 23. Check: 23 - 8 = 15 ✓'
        },
        {
            difficulty: 'hard',
            question: 'If 3x + 4 = 19, what is x?',
            answer: 5,
            hint: 'First subtract 4 from both sides, then divide by 3.',
            explanation: '3x + 4 = 19. Subtract 4: 3x = 15. Divide by 3: x = 5. Check: 3(5) + 4 = 15 + 4 = 19 ✓'
        },
        {
            difficulty: 'hard',
            question: 'If a number plus twice itself equals 24, what is the number?',
            answer: 8,
            hint: 'Let the number be n. Then n + 2n = 24. Combine like terms!',
            explanation: 'Let the number be n. Then n + 2n = 3n = 24. So n = 24 ÷ 3 = 8. Check: 8 + 2(8) = 8 + 16 = 24 ✓'
        }
    ],
    number: [
        {
            difficulty: 'easy',
            question: 'What is the smallest prime number?',
            answer: 2,
            hint: 'A prime number has exactly 2 factors: 1 and itself. What is the smallest number like this?',
            explanation: '2 is the smallest prime number. It is also the only even prime number! Its only factors are 1 and 2.'
        },
        {
            difficulty: 'easy',
            question: 'What is the sum of all factors of 6? (Include 1 and 6)',
            answer: 12,
            hint: 'The factors of 6 are: 1, 2, 3, and 6. Add them up!',
            explanation: 'Factors of 6: 1, 2, 3, 6. Sum = 1 + 2 + 3 + 6 = 12.'
        },
        {
            difficulty: 'medium',
            question: 'How many prime numbers are there between 10 and 20?',
            answer: 4,
            hint: 'Check each number from 11 to 19. Remember: a prime number only has factors 1 and itself.',
            explanation: 'The prime numbers between 10 and 20 are: 11, 13, 17, 19. That is 4 prime numbers.'
        },
        {
            difficulty: 'medium',
            question: 'What is the greatest common factor (GCF) of 12 and 18?',
            answer: 6,
            hint: 'List the factors of each number and find the largest number that appears in both lists.',
            explanation: 'Factors of 12: 1, 2, 3, 4, 6, 12. Factors of 18: 1, 2, 3, 6, 9, 18. The greatest common factor is 6.'
        },
        {
            difficulty: 'hard',
            question: 'What is the least common multiple (LCM) of 4 and 6?',
            answer: 12,
            hint: 'List the multiples of each number until you find the smallest one that appears in both lists.',
            explanation: 'Multiples of 4: 4, 8, 12, 16... Multiples of 6: 6, 12, 18... The smallest common multiple is 12.'
        },
        {
            difficulty: 'hard',
            question: 'How many divisors does 24 have? (Include 1 and 24)',
            answer: 8,
            hint: 'Find all numbers that divide evenly into 24: 1, 2, 3, 4, ...',
            explanation: 'The divisors of 24 are: 1, 2, 3, 4, 6, 8, 12, 24. That is 8 divisors total.'
        }
    ],
    probability: [
        {
            difficulty: 'easy',
            question: 'If you flip a fair coin, what is the probability of getting heads? (Express as a fraction: use 1 for 1/1, 2 for 1/2, 3 for 1/3, 4 for 1/4, etc. For 1/2, answer 2)',
            answer: 2,
            hint: 'There are 2 possible outcomes: heads or tails. Only 1 of them is heads.',
            explanation: 'Probability = 1/2 (answer: 2). There is 1 favorable outcome (heads) out of 2 total possible outcomes.'
        },
        {
            difficulty: 'easy',
            question: 'A bag contains 3 red balls and 2 blue balls. How many balls are in the bag total?',
            answer: 5,
            hint: 'Add the red and blue balls together.',
            explanation: 'Total balls = 3 red + 2 blue = 5 balls.'
        },
        {
            difficulty: 'medium',
            question: 'A die has 6 faces numbered 1-6. How many faces show an even number?',
            answer: 3,
            hint: 'The even numbers on a die are 2, 4, and 6.',
            explanation: 'The even numbers are 2, 4, and 6. That is 3 faces.'
        },
        {
            difficulty: 'medium',
            question: 'If you roll a fair six-sided die, how many outcomes are greater than 4?',
            answer: 2,
            hint: 'Which numbers on the die are greater than 4?',
            explanation: 'The numbers greater than 4 are 5 and 6. That is 2 outcomes.'
        },
        {
            difficulty: 'hard',
            question: 'A spinner is divided into 8 equal sections numbered 1-8. How many sections show a prime number?',
            answer: 4,
            hint: 'The prime numbers less than or equal to 8 are: 2, 3, 5, 7.',
            explanation: 'The prime numbers from 1-8 are: 2, 3, 5, 7. That is 4 sections.'
        },
        {
            difficulty: 'hard',
            question: 'In a deck of 52 cards, how many cards are hearts?',
            answer: 13,
            hint: 'There are 4 suits in a deck, each with the same number of cards.',
            explanation: 'A standard deck has 4 suits: hearts, diamonds, clubs, spades. Each suit has 13 cards, so there are 13 hearts.'
        }
    ]
};

// Initialize the app
function init() {
    loadStats();
    updateStatsDisplay();
}

// Load statistics from localStorage
function loadStats() {
    const saved = localStorage.getItem('amc8Stats');
    if (saved) {
        const stats = JSON.parse(saved);
        document.getElementById('totalSolved').textContent = stats.totalSolved || 0;
        document.getElementById('correctRate').textContent = stats.correctRate || '0%';
        document.getElementById('streak').textContent = stats.streak || 0;
    }
}

// Save statistics to localStorage
function saveStats() {
    const stats = {
        totalSolved: parseInt(document.getElementById('totalSolved').textContent),
        correctRate: document.getElementById('correctRate').textContent,
        streak: parseInt(document.getElementById('streak').textContent)
    };
    localStorage.setItem('amc8Stats', JSON.stringify(stats));
}

// Update statistics display
function updateStatsDisplay() {
    const totalSolved = parseInt(document.getElementById('totalSolved').textContent) || 0;
    const correctAttempts = parseInt(localStorage.getItem('correctAttempts') || '0');

    if (totalSolved > 0) {
        const rate = Math.round((correctAttempts / totalSolved) * 100);
        document.getElementById('correctRate').textContent = rate + '%';
    }
    saveStats();
}

// Start a topic
function startTopic(topic) {
    state.currentTopic = topic;
    state.problemIndex = 0;
    state.sessionStats = { attempted: 0, correct: 0 };

    // Get problems for the topic
    if (topic === 'mixed') {
        // Mix problems from all topics
        state.problems = [];
        Object.keys(problemDatabase).forEach(key => {
            state.problems.push(...problemDatabase[key]);
        });
        shuffleArray(state.problems);
        state.problems = state.problems.slice(0, 10); // Take 10 random problems
    } else {
        state.problems = [...problemDatabase[topic]];
        shuffleArray(state.problems);
    }

    showScreen('problemScreen');
    loadProblem();
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Load current problem
function loadProblem() {
    if (state.problemIndex >= state.problems.length) {
        showResults();
        return;
    }

    state.currentProblem = state.problems[state.problemIndex];
    state.hintUsed = false;

    // Update UI
    const topicNames = {
        counting: 'Counting & Logic',
        geometry: 'Geometry',
        algebra: 'Algebra',
        number: 'Number Theory',
        probability: 'Probability',
        mixed: 'Mixed Practice'
    };

    document.getElementById('topicName').textContent = topicNames[state.currentTopic];
    document.getElementById('problemNumber').textContent = `Problem ${state.problemIndex + 1}/${state.problems.length}`;
    document.getElementById('problemText').textContent = state.currentProblem.question;

    // Set difficulty badge
    const badge = document.getElementById('difficultyBadge');
    badge.textContent = state.currentProblem.difficulty.toUpperCase();
    badge.className = 'difficulty-badge ' + state.currentProblem.difficulty;

    // Reset input and feedback
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').disabled = false;
    document.querySelector('.submit-btn').disabled = false;
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('explanation').style.display = 'none';
    document.getElementById('hintText').style.display = 'none';
    document.getElementById('hintBtn').style.display = 'inline-block';

    // Focus on input
    document.getElementById('answerInput').focus();
}

// Show hint
function showHint() {
    if (!state.hintUsed) {
        state.hintUsed = true;
        document.getElementById('hintText').textContent = state.currentProblem.hint;
        document.getElementById('hintText').style.display = 'block';
        document.getElementById('hintBtn').style.display = 'none';
    }
}

// Check answer
function checkAnswer() {
    const userAnswer = parseFloat(document.getElementById('answerInput').value);
    const correctAnswer = state.currentProblem.answer;

    if (isNaN(userAnswer)) {
        alert('Please enter a valid number!');
        return;
    }

    state.sessionStats.attempted++;
    const isCorrect = Math.abs(userAnswer - correctAnswer) < 0.01;

    if (isCorrect) {
        state.sessionStats.correct++;
        showFeedback(true);
        updateGlobalStats(true);
    } else {
        showFeedback(false);
        updateGlobalStats(false);
    }

    // Disable input and show explanation
    document.getElementById('answerInput').disabled = true;
    document.querySelector('.submit-btn').disabled = true;
    document.getElementById('explanationText').textContent = state.currentProblem.explanation;
    document.getElementById('explanation').style.display = 'block';
}

// Show feedback
function showFeedback(correct) {
    const feedback = document.getElementById('feedback');
    const messages = {
        correct: [
            '🎉 Excellent! You got it right!',
            '⭐ Perfect! Great job!',
            '🌟 Awesome! That\'s correct!',
            '🎯 Brilliant! Well done!',
            '✨ Fantastic! You\'re doing great!'
        ],
        incorrect: [
            '❌ Not quite. Try the next one!',
            '💪 Don\'t worry, keep practicing!',
            '🔄 That\'s okay, learn from this one!',
            '📚 Good try! Check the explanation.'
        ]
    };

    const messageList = correct ? messages.correct : messages.incorrect;
    const message = messageList[Math.floor(Math.random() * messageList.length)];

    feedback.textContent = message;
    feedback.className = 'feedback ' + (correct ? 'correct' : 'incorrect');
}

// Update global statistics
function updateGlobalStats(correct) {
    const totalSolved = parseInt(document.getElementById('totalSolved').textContent) + 1;
    const correctAttempts = parseInt(localStorage.getItem('correctAttempts') || '0') + (correct ? 1 : 0);
    const currentStreak = correct ? parseInt(document.getElementById('streak').textContent) + 1 : 0;

    document.getElementById('totalSolved').textContent = totalSolved;
    document.getElementById('streak').textContent = currentStreak;

    localStorage.setItem('correctAttempts', correctAttempts.toString());

    updateStatsDisplay();
}

// Next problem
function nextProblem() {
    state.problemIndex++;
    loadProblem();
}

// Show results
function showResults() {
    const accuracy = state.sessionStats.attempted > 0
        ? Math.round((state.sessionStats.correct / state.sessionStats.attempted) * 100)
        : 0;

    document.getElementById('sessionSolved').textContent = state.sessionStats.attempted;
    document.getElementById('sessionAccuracy').textContent = accuracy + '%';

    // Encouraging message based on performance
    const encouragement = document.getElementById('encouragement');
    if (accuracy >= 90) {
        encouragement.textContent = '🏆 Outstanding performance! You\'re an AMC 8 star!';
    } else if (accuracy >= 70) {
        encouragement.textContent = '🌟 Great work! Keep practicing and you\'ll master this!';
    } else if (accuracy >= 50) {
        encouragement.textContent = '💪 Good effort! Practice makes perfect!';
    } else {
        encouragement.textContent = '📚 Keep learning! Every problem helps you improve!';
    }

    showScreen('resultsScreen');
}

// Back to menu
function backToMenu() {
    showScreen('mainMenu');
}

// Show screen
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Handle Enter key in answer input
document.addEventListener('DOMContentLoaded', function() {
    init();

    const answerInput = document.getElementById('answerInput');
    if (answerInput) {
        answerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !this.disabled) {
                checkAnswer();
            }
        });
    }
});
