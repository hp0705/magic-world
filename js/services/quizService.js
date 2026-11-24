// Magic World Quiz Engine (SPEC-07: 10 Questions, Type A/B/C, Lumi Hints, Star Calculation)
window.MagicWorld = window.MagicWorld || {};

class QuizService {
  constructor() {
    this.currentQuestions = [];
    this.currentIndex = 0;
    this.correctCount = 0;
    this.firstTryCount = 0;
    this.wrongTriesForCurrent = 0;
    this.skippedQuestions = [];
    this.isAnswered = false;
  }

  // Shuffle helper
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Generate 10 questions for the session
  buildFinalGame(sessionWords, allWordsPool = []) {
    this.currentIndex = 0;
    this.correctCount = 0;
    this.firstTryCount = 0;
    this.wrongTriesForCurrent = 0;
    this.skippedQuestions = [];
    this.isAnswered = false;

    const questions = [];
    const pool = (allWordsPool.length > 0) ? allWordsPool : sessionWords;

    // 1. Take up to 8 words from current session
    const targetWords = this.shuffle(sessionWords).slice(0, 8);

    // 2. Add 2 review words from the pool or repeat from session
    const remainingNeeded = 10 - targetWords.length;
    const reviewCandidates = pool.filter(w => !targetWords.some(tw => tw.text === w.text));
    const reviewWords = this.shuffle(reviewCandidates.length >= remainingNeeded ? reviewCandidates : pool).slice(0, remainingNeeded);
    
    const combined10 = [...targetWords, ...reviewWords];

    // Build each question
    combined10.forEach((item, idx) => {
      // Determine question type:
      // If item has no clear emoji (quiz === false or emoji === '✨'), must be Type C: 'listen-pick-word'
      // Otherwise: 70% Type A ('word-pick-emoji'), 30% Type B ('listen-pick-emoji')
      let qType = 'word-pick-emoji';
      if (!item.quiz || item.emoji === '✨' || !item.emoji) {
        qType = 'listen-pick-word';
      } else {
        qType = Math.random() < 0.3 ? 'listen-pick-emoji' : 'word-pick-emoji';
      }

      // Pick 2 distractor options (no duplicate emoji or text with target)
      const distractors = pool.filter(p => p.text !== item.text && (qType === 'listen-pick-word' || (p.emoji && p.emoji !== item.emoji)));
      const shuffledDistractors = this.shuffle(distractors).slice(0, 2);

      // If we don't have enough distinct distractors, fallback to generic safe words
      while (shuffledDistractors.length < 2) {
        shuffledDistractors.push({ text: 'hoa', emoji: '🌸', quiz: true });
      }

      const options = this.shuffle([
        { text: item.text, emoji: item.emoji || '✨', isCorrect: true },
        { text: shuffledDistractors[0].text, emoji: shuffledDistractors[0].emoji || '⭐', isCorrect: false },
        { text: shuffledDistractors[1].text, emoji: shuffledDistractors[1].emoji || '💎', isCorrect: false }
      ]);

      const correctIndex = options.findIndex(o => o.isCorrect);

      questions.push({
        id: `q_${idx + 1}`,
        type: qType,
        targetText: item.text,
        targetEmoji: item.emoji || '✨',
        spellingRead: item.spellingRead || item.text,
        example: item.example || '',
        options: options,
        correctIndex: correctIndex,
        isReview: idx >= targetWords.length
      });
    });

    this.currentQuestions = questions;
    return this.currentQuestions;
  }

  getCurrentQuestion() {
    if (this.currentIndex < this.currentQuestions.length) {
      return this.currentQuestions[this.currentIndex];
    }
    return null;
  }

  // Answer attempt
  submitAnswer(optionIndex) {
    const q = this.getCurrentQuestion();
    if (!q || this.isAnswered) return null;

    const isCorrect = (optionIndex === q.correctIndex);
    if (isCorrect) {
      this.isAnswered = true;
      this.correctCount++;
      if (this.wrongTriesForCurrent === 0) {
        this.firstTryCount++;
      }
      return {
        correct: true,
        firstTry: (this.wrongTriesForCurrent === 0),
        correctIndex: q.correctIndex
      };
    } else {
      this.wrongTriesForCurrent++;
      const shouldLumiHelp = (this.wrongTriesForCurrent >= 2);
      let distractorToBlur = -1;
      if (shouldLumiHelp) {
        // find an incorrect option that is not optionIndex
        distractorToBlur = q.options.findIndex((opt, idx) => !opt.isCorrect && idx !== optionIndex);
      }
      return {
        correct: false,
        tries: this.wrongTriesForCurrent,
        lumiHelp: shouldLumiHelp,
        distractorToBlur: distractorToBlur
      };
    }
  }

  // Skip current question to end of queue
  skipCurrent() {
    const q = this.getCurrentQuestion();
    if (!q || this.isAnswered) return;
    // Move to end once
    this.currentQuestions.splice(this.currentIndex, 1);
    this.currentQuestions.push(q);
    this.wrongTriesForCurrent = 0;
    this.isAnswered = false;
  }

  // Next question
  nextQuestion() {
    this.currentIndex++;
    this.wrongTriesForCurrent = 0;
    this.isAnswered = false;
    return this.getCurrentQuestion();
  }

  isFinished() {
    return this.currentIndex >= this.currentQuestions.length;
  }

  getResults() {
    return {
      total: this.currentQuestions.length,
      correct: this.correctCount,
      firstTryCount: this.firstTryCount
    };
  }
}

window.MagicWorld.QuizService = new QuizService();
