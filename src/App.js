// react_frontend/src/App.js

import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // Make sure this line is present and your CSS is in App.css

const API_URL = "https://cipher-spry-backend-1.onrender.com/get_patterned_word";

const HINTS_MAP = {
      "alternating_shift_2_minus_2": "It's a dance of 'two steps forward, two steps back!' Check the rhythm of the letters.",
    "vowel_consonant_opposite_shift": "Vowels are going one way, consonants are marching to a different beat. Which direction for which?",
    "position_doubling_shift": "Each letter's position got an upgrade – it's twice as important! Think about its spot in the word.",
    "odd_even_position_shift": "Some letters are moving one way, others another, all based on if they're in an 'odd' or 'even' spot. Are you an oddball or an even-steven?",
    "reverse_alphabet_substitution": "It's a full-alphabet flip! A's become Z's, B's become Y's. Like looking in a mirror!",
    "position_plus_letter_shift": "The letters are getting a boost based on where they stand, plus a little extra for good measure!",
    "vowel_boost_shift": "Vowels got a massive power-up, while consonants just got a tiny nudge. Think 'vowel vortex'!",
    "cumulative_position_shift": "Each letter's shift is like a snowball rolling downhill – it just keeps adding up from previous positions!",
    "prime_position_shift": "Only the cool kids, the prime numbers (2, 3, 5, 7...), are dictating the shifts here!",
    "alternating_sign_shift": "It's a zig-zag! The shift amount grows, but the direction keeps flipping back and forth.",
    "letter_pair_swap": "Looks like some letters got a bit confused and swapped dance partners. Check for couples who switched!",
    "reverse_alphabet_cipher": "A classic! Each letter decided to become its exact opposite in the alphabet. Total flip-flop!", // Alias of reverse_alphabet_substitution
    "vowel_swap_0_2": "Hold on, did the first and third *vowels* just switch seats? Only if they're actually vowels, of course!",
    "double_index_mod_26": "Double the letter's secret number, then wrap it like a present around the alphabet!",
    "consonant_reverse_reflection_old": "Only the consonants are doing the alphabet mirror trick; vowels are just chilling.",
    "position_multiply_by_3": "Each letter's secret number got multiplied by its position. Hope it didn't break the alphabet!",
    "first_last_swap": "Simple but effective: the first and last letters played musical chairs!",
    "vowel_forward_2_consonant_backward_1": "Vowels skip two steps forward, but consonants are taking one step back. A little dance!",
    "middle_three_reverse": "The party in the middle just got a little wild – the three central letters spun around!",
    "constant_multiply_by_2": "Yep, it's the old 'double the letter's numerical value and loop the alphabet' trick again!", // Alias of double_index_mod_26
    "alphabet_reflect_by_position": "Some letters are looking at their reflection in the alphabet, but only if they're in the 'odd' spots!",
    "consonant_double_vowel_single_shift": "Consonants are taking two steps forward, while vowels are just taking one. Slow and steady wins the race for vowels!",
    "fibonacci_shift": "These shifts are based on a famous sequence of numbers: 1, 1, 2, 3, 5... Can you find the pattern within the pattern?",
    "character_order_reverse": "Someone just threw the letters into a blender and sorted them backwards. Think alphabetical, but inverted!"
};

const getPatternHint = (patternName) => {
    return HINTS_MAP[patternName] || "Hmm, this pattern is so tricky, even I'm stumped for a hint!";
};

function App() {
    // --- Game State ---
    const [currentPage, setCurrentPage] = useState('start'); // 'start', 'easy', 'medium', 'hard'
    const [sequence, setSequence] = useState(''); // The transformed word displayed
    const [originalWord, setOriginalWord] = useState(''); // The actual word from API
    const [answer, setAnswer] = useState(''); // User's input
    const [feedback, setFeedback] = useState(''); // Correct/Incorrect message
    const [score, setScore] = useState(0); // Player's score
    const [patternAppliedName, setPatternAppliedName] = useState(''); // Name of the pattern from backend
    const [hintMessage, setHintMessage] = useState(''); // Hint message displayed
    const [isHintDisabled, setIsHintDisabled] = useState(false); // Disable hint after use

    // --- Timer State ---
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const timerRef = useRef(null); // Ref to hold the timer interval ID

    // --- New Feature States ---
    const [showAlphabetReference, setShowAlphabetReference] = useState(false); // For alphabet values
    const [showAnswer, setShowAnswer] = useState(false); // For revealing the answer via button

    // Ref for focusing the input
    const answerInputRef = useRef(null);

    // --- API Call to fetch new sequence ---
    const fetchNewSequence = async () => {
        setIsTimerActive(false); // Stop timer immediately on new fetch
        setAnswer(''); // Clear previous answer
        setFeedback(''); // Clear feedback
        setHintMessage(''); // Clear hint
        setIsHintDisabled(false); // Re-enable hint for new round
        setShowAnswer(false); // Reset showAnswer for new round (important!)

        let initialTime;
        if (currentPage === 'easy') initialTime = 120;
        else if (currentPage === 'medium') initialTime = 90;
        else initialTime = 60;
        setTimeRemaining(initialTime);

        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            setSequence(data.transformed_word);
            setOriginalWord(data.original_word);
            setPatternAppliedName(data.pattern_applied);
            setIsTimerActive(true); // Start timer when sequence is ready
            answerInputRef.current && answerInputRef.current.focus(); // Focus input
        } catch (error) {
            setFeedback("Failed to load new sequence. Check backend server.");
            setSequence("ERROR");
            setOriginalWord("");
            setPatternAppliedName('');
            setIsTimerActive(false); // Ensure timer is off if error
        }
    };

    // --- Timer Logic (useEffect) ---
    useEffect(() => {
        if (isTimerActive && timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemaining((prevTime) => prevTime - 1);
            }, 1000);
        } else if (timeRemaining === 0) {
            clearInterval(timerRef.current);
            setIsTimerActive(false);
            if (currentPage !== 'start' && !feedback.includes('Correct!')) { // Only show timeout if not already correct
                setFeedback(`Time's up! The word was ${originalWord}.`);
            }
        }

        // Cleanup on unmount or when dependencies change
        return () => {
            clearInterval(timerRef.current);
        };
    }, [isTimerActive, timeRemaining, currentPage, originalWord, feedback]);


    // --- Initial Fetch on Page Load/Level Select ---
    useEffect(() => {
        if (currentPage !== 'start') {
            fetchNewSequence();
        }
    }, [currentPage]); // Re-fetch when level changes

    // --- Event Handlers ---
    const handleAnswerChange = (e) => {
        // Only allow typing if timer is active and answer not revealed
        if (isTimerActive && !showAnswer && timeRemaining > 0) {
            const value = e.target.value.toUpperCase();
            setAnswer(value);
        }
    };

    const handleKeyPress = (e) => {
        // Allow submission with Enter key
        if (e.key === 'Enter' && answer.length === 5 && isTimerActive && !showAnswer && timeRemaining > 0) {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        if (!answer || answer.length !== 5 || !isTimerActive || showAnswer || timeRemaining === 0 || feedback.includes('Correct!')) {
            setFeedback("Please enter a 5-letter word.");
            return;
        }

        setIsTimerActive(false); // Always stop timer on submit
        setHintMessage(''); // Clear hint after submission

        if (answer === originalWord) {
            setFeedback("Correct! 🎉");
            setScore(prevScore => prevScore + 1);
            answerInputRef.current && answerInputRef.current.blur(); // Remove focus
        } else {
            setFeedback(`Incorrect. The word was ${originalWord}.`);
            setScore(prevScore => Math.max(0, prevScore - 1));
            answerInputRef.current && answerInputRef.current.blur(); // Remove focus
        }
    };

    const handleNewSequence = () => {
        fetchNewSequence();
        answerInputRef.current && answerInputRef.current.focus(); // Re-focus after new sequence
    };

    const handleLevelSelect = (level) => {
        setCurrentPage(level);
        setScore(0); // Reset score for new game
        // fetchNewSequence will be called by useEffect due to currentPage change
    };

    const handleBackToStart = () => {
        setCurrentPage('start');
        setScore(0);
        setIsTimerActive(false);
        clearInterval(timerRef.current); // Ensure timer is fully stopped
        setSequence('');
        setOriginalWord('');
        setAnswer('');
        setFeedback('');
        setHintMessage('');
        setIsHintDisabled(false);
        setShowAlphabetReference(false);
        setShowAnswer(false); // Reset this
    };

    const handleGetHint = () => {
        setHintMessage(getPatternHint(patternAppliedName));
        setIsHintDisabled(true); // Disable hint after it's shown
        setScore(prevScore => Math.max(0, prevScore - 1)); // Deduct score for hint
    };

    const handleRevealAnswer = () => {
        setShowAnswer(true); // ONLY this button sets showAnswer to true
        setIsTimerActive(false); // Stop the timer
        setFeedback('The answer was revealed!'); // Provide feedback
        setScore(prevScore => Math.max(0, prevScore - 1)); // Deduct score for revealing
    };


    // --- Render Logic ---
    return (
        
        <div className="game-container">
            <h1 className="game-title">Cipher Spry</h1> 

            {currentPage === 'start' && (
                <div className="level-select">
                    <button onClick={() => handleLevelSelect('easy')}>Easy (120s)</button>
                    <button onClick={() => handleLevelSelect('medium')}>Medium (90s)</button>
                    <button onClick={() => handleLevelSelect('hard')}>Hard (60s)</button>
                </div>
            )}

            {currentPage !== 'start' && (
                <>
                    <div className="timer-display">
                        Time: {timeRemaining}s
                    </div>
                    <div className="score-display">Score: {score}</div>

                    <h2>Transformed Word:</h2>
                    <div className="sequence-display">
                        {sequence.split('').map((char, index) => (
                            <div key={index} className="answer-box">
                                {char}
                            </div>
                        ))}
                    </div>

                    <h2>Your Answer:</h2>
                    <div className="answer-boxes" onClick={() => answerInputRef.current.focus()}>
                        {Array.from({ length: 5 }).map((_, index) => {
                            const userAnswerLetter = answer[index] ? answer[index].toUpperCase() : ' '; // Get user's typed letter or a space
                            const originalWordLetter = originalWord[index] ? originalWord[index].toUpperCase() : ''; // Get original word letter

                            let displayLetter = userAnswerLetter; // Default: show user's typed letter
                            let boxClass = '';

                            // Determine if the game is in a 'game over' state (submission or timeout)
                            const isGameOverState = feedback.includes('Correct!') || feedback.includes('Incorrect.') || feedback.includes('Time\'s up!');

                            // Rule 1: If the answer is explicitly revealed (highest precedence)
                            if (showAnswer) {
                                displayLetter = originalWordLetter; // Display the correct letter
                                boxClass = 'revealed'; // Apply the revealed styling
                            }
                            // Rule 2: If the game has ended (due to submission or timeout)
                            // This state locks in the feedback for the user's final guess
                            else if (isGameOverState) {
                                if (userAnswerLetter === originalWordLetter) {
                                    boxClass = 'correct';
                                } else if (originalWord.includes(userAnswerLetter) && userAnswerLetter !== ' ') {
                                    boxClass = 'present';
                                } else if (userAnswerLetter !== ' ') { // Only mark absent if a letter was actually typed
                                    boxClass = 'absent';
                                }
                                // `displayLetter` remains `userAnswerLetter` to show their attempt
                            }
                            // Rule 3: Real-time feedback while typing (game is active, not over, and has a letter)
                            else if (userAnswerLetter !== ' ' && isTimerActive && timeRemaining > 0) {
                                // Only apply colors if there's a letter typed in this box
                                if (userAnswerLetter === originalWordLetter) {
                                    boxClass = 'correct';
                                } else if (originalWord.includes(userAnswerLetter)) {
                                    boxClass = 'present';
                                } else {
                                    boxClass = 'absent';
                                }
                            }
                            // If none of the above, boxClass remains empty, so default styling applies (e.g., for empty boxes)

                            return (
                                <div key={index} className={`answer-box ${boxClass}`}>
                                    {displayLetter}
                                </div>
                            );
                        })}
                        <input
                            ref={answerInputRef}
                            type="text"
                            className="answer-input"
                            value={answer}
                            onChange={handleAnswerChange}
                            onKeyDown={handleKeyPress}
                            maxLength={5}
                            disabled={
                                !isTimerActive ||
                                showAnswer ||
                                timeRemaining === 0 ||
                                feedback.includes('Correct!') ||
                                feedback.includes('Incorrect.') ||
                                feedback.includes("Time's up!")
                            }
                            autoFocus
                        />
                    </div>

                    <p className="feedback-message">{feedback}</p>

                    <div className="game-buttons">
                        <button
                            className="submit-button"
                            onClick={handleSubmit}
                            disabled={!answer || answer.length !== 5 || !isTimerActive || showAnswer || timeRemaining === 0 || feedback.includes('Correct!')}
                        >
                            Submit
                        </button>
                        <button
                            className="new-sequence-button"
                            onClick={handleNewSequence}
                        >
                            New Sequence
                        </button>
                        <button
                            className="hint-button"
                            onClick={handleGetHint}
                            disabled={isHintDisabled || showAnswer || timeRemaining === 0 || feedback.includes('Correct!')}
                        >
                            Get a Hint!
                        </button>
                        <button
                            className="back-button"
                            onClick={handleBackToStart}
                        >
                            Back to Level Select
                        </button>

                        {/* Reveal Answer Button (only show if not already revealed and time left, and not correct) */}
                        {currentPage !== 'start' && !showAnswer && timeRemaining > 0 && !feedback.includes('Correct!') && (
                            <button
                                className="reveal-answer-button"
                                onClick={handleRevealAnswer}
                            >
                                Reveal Answer
                            </button>
                        )}
                        <button
                            className="alphabet-reference-button"
                            onClick={() => setShowAlphabetReference(!showAlphabetReference)}
                        >
                            {showAlphabetReference ? 'Hide Alphabet Reference' : 'Show Alphabet Reference'}
                        </button>

                    </div>


                    {hintMessage && <p className="hint-message">{hintMessage}</p>}

                    {showAlphabetReference && (
                        <div className="alphabet-reference-container">
                            <h3>Alphabet Values (A=0, Z=25)</h3>
                            <div className="alphabet-grid">
                                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char, index) => (
                                    <div key={char} className="alphabet-item">
                                        <span className="alphabet-char">{char}</span>
                                        <span className="alphabet-value">{index}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default App;