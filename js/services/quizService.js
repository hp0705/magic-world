// Magic World Quiz Engine (8 Questions for the 8 learned words, Reading-first Type A)
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

  // Generate questions ONLY for the learned words in the session (up to 8 words)
  buildFinalGame(sessionWords, allWordsPool = []) {
    this.currentIndex = 0;
    this.correctCount = 0;
    this.firstTryCount = 0;
    this.wrongTriesForCurrent = 0;
    this.skippedQuestions = [];
    this.isAnswered = false;

    const questions = [];
    const pool = (allWordsPool.length > 0) ? allWordsPool : sessionWords;

    // Take ONLY the words from the current session (e.g. 8 learned words, no unlearned words added)
    const targetWords = this.shuffle(sessionWords).slice(0, 8);

    // Build each question
    targetWords.forEach((item, idx) => {
      // Reading-first: show the word text so the child practices reading and picks the matching emoji
      const emEntry = window.MagicWorld.EmojiMap && window.MagicWorld.EmojiMap[item.text];
      let qType = 'word-pick-emoji';
      if (!item.emoji || item.emoji === '✨' || item.noPictureQuiz || (emEntry && emEntry.quiz === false)) {
        qType = 'listen-pick-word';
      }

      // Prefer distractors from the learned sessionWords first; fallback to pool only if needed
      const sameSessionDistractors = sessionWords.filter(
        p => p.text !== item.text && (qType === 'listen-pick-word' || (p.emoji && p.emoji !== item.emoji))
      );
      let shuffledDistractors = this.shuffle(sameSessionDistractors).slice(0, 2);

      if (shuffledDistractors.length < 2) {
        const extraPool = pool.filter(
          p => p.text !== item.text &&
               !shuffledDistractors.some(d => d.text === p.text) &&
               (qType === 'listen-pick-word' || (p.emoji && p.emoji !== item.emoji))
        );
        shuffledDistractors = shuffledDistractors.concat(this.shuffle(extraPool).slice(0, 2 - shuffledDistractors.length));
      }

      // If still not enough distinct distractors, fallback to generic safe words
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
        isReview: false
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
