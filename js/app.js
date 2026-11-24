// Magic World — Master Game App Controller & Router
window.MagicWorld = window.MagicWorld || {};

class MagicWorldApp {
  constructor() {
    this.currentScreen = 'world-map';
    this.previousScreen = 'world-map';

    // State
    this.alphabetIndex = 0;
    this.vocabDay = 1;
    this.vocabWordIndex = 0;
    this.spellingDay = 1;
    this.spellingWordIndex = 0;
    this.currentQuizSession = null;

    // Services
    this.audio = window.MagicWorld.AudioService;
    this.progress = window.MagicWorld.ProgressService;
    this.quiz = window.MagicWorld.QuizService;
    this.handwriting = window.MagicWorld.HandwritingService;
    this.story = window.MagicWorld.StoryService;
    this.matching = window.MagicWorld.MatchingGameService;

    // Data
    this.alphabetData = window.MagicWorld.Alphabet || [];
    this.vocabDaysData = window.MagicWorld.VocabDays || {};
    this.spellingDaysData = window.MagicWorld.SpellingDays || [];
    this.feedbackData = window.MagicWorld.Feedback || { praise: [], wrong: [] };
  }

  init() {
    this.setupSnowCanvas();
    this.bindEvents();
    this.updateHeaderStats();
    this.showScreen('world-map');

    // Init handwriting canvas when element available
    const hwCanvas = document.getElementById('handwritingCanvas');
    if (hwCanvas) {
      this.handwriting.init(hwCanvas, () => this.onHandwritingCompleted());
    }

    // Auto set child name to audio service
    if (this.audio && this.progress) {
      this.audio.setChildName(this.progress.getChildName());
    }
  }

  // --- SCREEN NAVIGATION ---
  showScreen(screenId) {
    this.previousScreen = this.currentScreen;
    this.currentScreen = screenId;

    // Stop ongoing speech when switching screens
    if (this.audio) this.audio.stopSpeaking();

    // Toggle active class on screen divs
    document.querySelectorAll('.screen-view').forEach(view => {
      view.classList.remove('active');
    });

    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
    }

    // Update bottom nav active state
    document.querySelectorAll('.nav-tab').forEach(tab => {
      const tabTarget = tab.getAttribute('data-screen');
      if (tabTarget === screenId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Render screen specific content
    switch (screenId) {
      case 'world-map':
        this.renderWorldMap();
        break;
      case 'alphabet':
        this.renderAlphabetScreen();
        break;
      case 'vocab':
        this.renderVocabScreen();
        break;
      case 'spelling':
        this.renderSpellingScreen();
        break;
      case 'quiz':
        this.renderQuizQuestion();
        break;
      case 'handwriting':
        this.renderHandwritingScreen();
        break;
      case 'story':
        this.renderStoryScreen();
        break;
      case 'matching':
        this.renderMatchingGameScreen();
        break;
    }

    this.updateHeaderStats();
  }

  updateHeaderStats() {
    const starCountEl = document.getElementById('headerStarCount');
    const snowCountEl = document.getElementById('headerSnowCount');
    if (starCountEl) starCountEl.textContent = this.progress.data.totalStars || 0;
    if (snowCountEl) snowCountEl.textContent = this.progress.data.snowflakes || 0;
  }

  // --- WORLD MAP ---
  renderWorldMap() {
    const totalStars = this.progress.data.totalStars || 0;
    const bannerEl = document.getElementById('mapGreeting');
    if (bannerEl) {
      bannerEl.textContent = `Xin chào ${this.progress.getChildName()}! Bé đã có ${totalStars} ⭐ lấp lánh!`;
    }
  }

  // --- MODULE 1: ALPHABET ---
  renderAlphabetScreen() {
    const letter = this.alphabetData[this.alphabetIndex] || this.alphabetData[0];
    if (!letter) return;

    // Header letter crystals
    const crystalsContainer = document.getElementById('alphabetCrystals');
    if (crystalsContainer) {
      crystalsContainer.innerHTML = '';
      this.alphabetData.slice(0, 8).forEach((l, idx) => {
        const slot = document.createElement('span');
        slot.className = `crystal-slot ${this.progress.isLetterComplete(l.id) ? 'active' : ''}`;
        slot.textContent = '💎';
        crystalsContainer.appendChild(slot);
      });
    }

    // Top picker button text
    const pickerTextEl = document.getElementById('alphaPickerText');
    if (pickerTextEl) {
      pickerTextEl.textContent = `Chữ ${letter.lower} (${letter.upper})`;
    }

    // Displays
    document.getElementById('alphabetUpper').textContent = letter.upper;
    document.getElementById('alphabetLower').textContent = letter.lower;
    document.getElementById('alphabetEmoji').textContent = letter.emoji || '✨';
    document.getElementById('alphabetWord').textContent = letter.word;
    document.getElementById('alphabetSentence').textContent = letter.sentence;

    // Auto read letter on enter
    if (this.audio) {
      this.audio.speak(letter.lower);
    }
  }

  nextLetter() {
    this.alphabetIndex = (this.alphabetIndex + 1) % this.alphabetData.length;
    this.renderAlphabetScreen();
  }

  prevLetter() {
    this.alphabetIndex = (this.alphabetIndex - 1 + this.alphabetData.length) % this.alphabetData.length;
    this.renderAlphabetScreen();
  }

  // --- MODULE 2: VOCABULARY ---
  renderVocabScreen() {
    const words = this.vocabDaysData[this.vocabDay] || [];
    if (words.length === 0) return;

    const currentWord = words[this.vocabWordIndex] || words[0];

    // Day title & topic
    const badgeTextEl = document.getElementById('vocabDayBadgeText');
    if (badgeTextEl) {
      badgeTextEl.textContent = `Ngày ${this.vocabDay} (${currentWord.group})`;
    } else {
      const badge = document.getElementById('vocabDayBadge');
      if (badge) badge.textContent = `Ngày ${this.vocabDay} (${currentWord.group}) ▾`;
    }
    document.getElementById('vocabTopicBadge').textContent = currentWord.topic;

    // 8 Crystals Bar
    const progressObj = this.progress.getVocabDayProgress(this.vocabDay);
    const crystalsContainer = document.getElementById('vocabCrystals');
    if (crystalsContainer) {
      crystalsContainer.innerHTML = '';
      words.forEach((w) => {
        const slot = document.createElement('span');
        const isRead = progressObj.completedWords.includes(w.id);
        slot.className = `crystal-slot ${isRead ? 'active' : ''}`;
        slot.textContent = '💎';
        crystalsContainer.appendChild(slot);
      });
    }

    // Word display
    document.getElementById('vocabEmoji').textContent = currentWord.emoji || '✨';
    document.getElementById('vocabText').textContent = currentWord.text;
    document.getElementById('vocabSentence').textContent = currentWord.example;

    // Auto read word
    if (this.audio) {
      this.audio.speak(currentWord.text);
    }
  }

  onVocabReadConfirmed() {
    const words = this.vocabDaysData[this.vocabDay] || [];
    const currentWord = words[this.vocabWordIndex];
    if (!currentWord) return;

    this.progress.markVocabWordRead(this.vocabDay, currentWord.id);
    this.audio.playChime();
    this.showRandomPraise();

    // Advance to next word or trigger quiz if all 8 completed
    if (this.vocabWordIndex < words.length - 1) {
      this.vocabWordIndex++;
      this.renderVocabScreen();
    } else {
      // 8 words finished -> Show Choice Modal
      this.openGameChoiceModal('vocab', this.vocabDay, words);
    }
  }

  nextVocabWord() {
    const words = this.vocabDaysData[this.vocabDay] || [];
    if (this.vocabWordIndex < words.length - 1) {
      this.vocabWordIndex++;
      this.renderVocabScreen();
    } else {
      // Smoothly advance to Next Day!
      this.nextVocabDay();
    }
  }

  prevVocabWord() {
    if (this.vocabWordIndex > 0) {
      this.vocabWordIndex--;
      this.renderVocabScreen();
    } else {
      // Step back to Previous Day (last word)
      const totalDays = Object.keys(this.vocabDaysData).length;
      this.vocabDay = this.vocabDay > 1 ? this.vocabDay - 1 : totalDays;
      const prevWords = this.vocabDaysData[this.vocabDay] || [];
      this.vocabWordIndex = Math.max(0, prevWords.length - 1);
      this.audio.playPop();
      this.renderVocabScreen();
    }
  }

  nextVocabDay() {
    const totalDays = Object.keys(this.vocabDaysData).length;
    this.vocabDay = this.vocabDay < totalDays ? this.vocabDay + 1 : 1;
    this.vocabWordIndex = 0;
    this.audio.playPop();
    this.renderVocabScreen();
  }

  prevVocabDay() {
    const totalDays = Object.keys(this.vocabDaysData).length;
    this.vocabDay = this.vocabDay > 1 ? this.vocabDay - 1 : totalDays;
    this.vocabWordIndex = 0;
    this.audio.playPop();
    this.renderVocabScreen();
  }

  // --- MODULE 3: SPELLING ---
  renderSpellingScreen() {
    const dayObj = this.spellingDaysData.find(d => d.day === this.spellingDay) || this.spellingDaysData[0];
    if (!dayObj || !dayObj.words) return;

    const currentWord = dayObj.words[this.spellingWordIndex] || dayObj.words[0];

    const badgeTextEl = document.getElementById('spellingDayBadgeText');
    if (badgeTextEl) {
      badgeTextEl.textContent = `Ngày ${this.spellingDay}: ${dayObj.title}`;
    } else {
      const badge = document.getElementById('spellingDayBadge');
      if (badge) badge.textContent = `Ngày ${this.spellingDay}: ${dayObj.title} ▾`;
    }

    // 8 Crystals Bar
    const progressObj = this.progress.getSpellingDayProgress(this.spellingDay);
    const crystalsContainer = document.getElementById('spellingCrystals');
    if (crystalsContainer) {
      crystalsContainer.innerHTML = '';
      dayObj.words.forEach(w => {
        const slot = document.createElement('span');
        const isRead = progressObj.completedWords.includes(w.id);
        slot.className = `crystal-slot ${isRead ? 'active' : ''}`;
        slot.textContent = '💎';
        crystalsContainer.appendChild(slot);
      });
    }

    // Displays
    document.getElementById('spellingEmoji').textContent = currentWord.emoji || '✨';
    document.getElementById('spellingText').textContent = currentWord.text;
    document.getElementById('spellingSentence').textContent = currentWord.example;

    // Render 3-Group Karaoke Chips
    const chipsContainer = document.getElementById('spellingChipsContainer');
    if (chipsContainer) {
      chipsContainer.innerHTML = '';
      let currentGroup = 1;

      currentWord.chips.forEach(chip => {
        if (chip.group !== currentGroup) {
          const divider = document.createElement('span');
          divider.className = 'spelling-group-divider';
          divider.textContent = '➔';
          chipsContainer.appendChild(divider);
          currentGroup = chip.group;
        }

        const chipBtn = document.createElement('button');
        chipBtn.className = `spell-chip ${chip.role}`;
        chipBtn.textContent = chip.text;
        chipBtn.addEventListener('click', () => {
          if (this.audio) this.audio.speak(chip.text);
        });
        chipsContainer.appendChild(chipBtn);
      });
    }

    // Auto read word
    if (this.audio) {
      this.audio.speak(currentWord.text);
    }
  }

  async playSpellingKaraoke() {
    const dayObj = this.spellingDaysData.find(d => d.day === this.spellingDay);
    if (!dayObj) return;
    const currentWord = dayObj.words[this.spellingWordIndex];
    if (!currentWord) return;

    const chipEls = document.querySelectorAll('#spellingChipsContainer .spell-chip');

    for (let i = 0; i < currentWord.chips.length; i++) {
      chipEls.forEach(el => el.classList.remove('karaoke-active'));
      if (chipEls[i]) {
        chipEls[i].classList.add('karaoke-active');
      }
      const tok = currentWord.chips[i].text;
      await this.audio.speak(tok);
      await new Promise(r => setTimeout(r, 220));
    }

    chipEls.forEach(el => el.classList.remove('karaoke-active'));
    await new Promise(r => setTimeout(r, 180));
    await this.audio.speak(currentWord.text);
    this.audio.playChime();
  }

  onSpellingReadConfirmed() {
    const dayObj = this.spellingDaysData.find(d => d.day === this.spellingDay);
    if (!dayObj) return;
    const currentWord = dayObj.words[this.spellingWordIndex];
    if (!currentWord) return;

    this.progress.markSpellingWordRead(this.spellingDay, currentWord.id);
    this.audio.playChime();
    this.showRandomPraise();

    if (this.spellingWordIndex < dayObj.words.length - 1) {
      this.spellingWordIndex++;
      this.renderSpellingScreen();
    } else {
      // 8 words finished -> Show Choice Modal
      this.openGameChoiceModal('spelling', this.spellingDay, dayObj.words);
    }
  }

  nextSpellingWord() {
    const dayObj = this.spellingDaysData.find(d => d.day === this.spellingDay);
    if (!dayObj) return;
    if (this.spellingWordIndex < dayObj.words.length - 1) {
      this.spellingWordIndex++;
      this.renderSpellingScreen();
    } else {
      // Smoothly advance to Next Day!
      this.nextSpellingDay();
    }
  }

  prevSpellingWord() {
    if (this.spellingWordIndex > 0) {
      this.spellingWordIndex--;
      this.renderSpellingScreen();
    } else {
      // Step back to previous Day (last word)
      const totalDays = this.spellingDaysData.length;
      this.spellingDay = this.spellingDay > 1 ? this.spellingDay - 1 : totalDays;
      const prevDayObj = this.spellingDaysData.find(d => d.day === this.spellingDay);
      this.spellingWordIndex = prevDayObj && prevDayObj.words ? prevDayObj.words.length - 1 : 0;
      this.audio.playPop();
      this.renderSpellingScreen();
    }
  }

  nextSpellingDay() {
    const totalDays = this.spellingDaysData.length;
    this.spellingDay = this.spellingDay < totalDays ? this.spellingDay + 1 : 1;
    this.spellingWordIndex = 0;
    this.audio.playPop();
    this.renderSpellingScreen();
  }

  prevSpellingDay() {
    const totalDays = this.spellingDaysData.length;
    this.spellingDay = this.spellingDay > 1 ? this.spellingDay - 1 : totalDays;
    this.spellingWordIndex = 0;
    this.audio.playPop();
    this.renderSpellingScreen();
  }

  // --- MODULE 4: FINAL QUIZ (10 QUESTIONS) ---
  startQuizForSession(moduleName, dayNumber, sessionWords) {
    this.currentQuizSession = { module: moduleName, day: dayNumber };
    const allPool = moduleName === 'vocab' ? window.MagicWorld.VocabList : sessionWords;
    this.quiz.buildFinalGame(sessionWords, allPool);
    this.showScreen('quiz');
  }

  renderQuizQuestion() {
    const q = this.quiz.getCurrentQuestion();
    if (!q) {
      this.onQuizFinished();
      return;
    }

    // Top counters: Question N/10 and Correct count
    document.getElementById('quizProgressTag').textContent = `Câu ${this.quiz.currentIndex + 1}/10`;
    document.getElementById('quizScoreTag').textContent = `⭐ Đúng: ${this.quiz.correctCount}/10`;

    // Type prompt
    const promptHeader = document.getElementById('quizPromptHeader');
    const targetBox = document.getElementById('quizTargetBox');
    const targetWord = document.getElementById('quizTargetWord');
    const targetSoundBtn = document.getElementById('quizSoundBtn');

    if (q.type === 'word-pick-emoji') {
      promptHeader.textContent = "Bé Mây hãy tự đọc chữ và chọn đúng hình nhé:";
      targetWord.textContent = q.targetText;
      targetWord.style.display = 'block';
      targetSoundBtn.style.display = 'inline-flex';
    } else if (q.type === 'listen-pick-emoji') {
      promptHeader.textContent = "Bé Mây hãy lắng nghe và chọn đúng hình nhé:";
      targetWord.textContent = '🔊 ???';
      targetWord.style.display = 'block';
      targetSoundBtn.style.display = 'inline-flex';
      // Auto speak for listening question
      if (this.audio) this.audio.speak(q.targetText);
    } else {
      // Type C: listen-pick-word
      promptHeader.textContent = "Bé Mây hãy lắng nghe và chọn đúng chữ nhé:";
      targetWord.textContent = '🔊 ???';
      targetWord.style.display = 'block';
      targetSoundBtn.style.display = 'inline-flex';
      if (this.audio) this.audio.speak(q.targetText);
    }

    // Render 3 Cards
    const optionsGrid = document.getElementById('quizOptionsGrid');
    optionsGrid.innerHTML = '';

    q.options.forEach((opt, optIdx) => {
      const card = document.createElement('div');
      card.className = 'quiz-card';
      card.id = `quizCard_${optIdx}`;

      if (q.type === 'listen-pick-word') {
        card.innerHTML = `<span class="card-word">${opt.text}</span>`;
      } else {
        card.innerHTML = `<span class="card-emoji">${opt.emoji}</span>`;
      }

      card.addEventListener('click', () => this.handleQuizAnswer(optIdx, card));
      optionsGrid.appendChild(card);
    });

    // Reset Next Button
    const nextBtn = document.getElementById('quizNextBtn');
    nextBtn.style.display = 'none';
  }

  handleQuizAnswer(optIdx, cardElement) {
    if (this.quiz.isAnswered) return;

    const result = this.quiz.submitAnswer(optIdx);
    if (!result) return;

    if (result.correct) {
      cardElement.classList.add('correct');
      this.audio.playChime();
      this.showRandomPraise();

      // Show Next button or auto advance
      const nextBtn = document.getElementById('quizNextBtn');
      nextBtn.style.display = 'flex';
      document.getElementById('quizScoreTag').textContent = `⭐ Đúng: ${this.quiz.correctCount}/10`;

      setTimeout(() => {
        if (this.quiz.isAnswered) {
          this.advanceQuiz();
        }
      }, 1600);
    } else {
      cardElement.classList.add('wrong');
      this.audio.playBuBu();
      this.showRandomEncouragement();

      if (result.lumiHelp && result.distractorToBlur !== -1) {
        const blurredCard = document.getElementById(`quizCard_${result.distractorToBlur}`);
        if (blurredCard) {
          blurredCard.classList.add('lumi-blurred');
        }
      }
    }
  }

  advanceQuiz() {
    this.quiz.nextQuestion();
    if (this.quiz.isFinished()) {
      this.onQuizFinished();
    } else {
      this.renderQuizQuestion();
    }
  }

  onQuizFinished() {
    const res = this.quiz.getResults();
    const session = this.currentQuizSession || { module: 'vocab', day: 1 };
    const outcome = this.progress.recordQuizResult(session.module, session.day, res.correct, res.total, res.firstTryCount);

    this.audio.playFanfare();
    this.showVictoryModal(outcome.stars, res.correct, outcome.newSticker);
  }

  showVictoryModal(stars, correctCount, sticker) {
    const modal = document.getElementById('victoryModal');
    if (!modal) return;

    let starEmojis = '⭐';
    if (stars === 2) starEmojis = '⭐⭐';
    if (stars === 3) starEmojis = '⭐⭐⭐';

    document.getElementById('victoryStarsDisplay').textContent = starEmojis;
    document.getElementById('victoryScoreText').textContent = `Bé Mây đã trả lời đúng ${correctCount}/10 câu hỏi!`;

    const stickerBox = document.getElementById('victoryStickerBox');
    if (sticker) {
      stickerBox.style.display = 'block';
      document.getElementById('victoryStickerEmoji').textContent = sticker.emoji;
      document.getElementById('victoryStickerName').textContent = sticker.name;
    } else {
      stickerBox.style.display = 'none';
    }

    modal.style.display = 'flex';
  }

  closeVictoryModal() {
    document.getElementById('victoryModal').style.display = 'none';
    this.showScreen('world-map');
  }

  // --- HANDWRITING SCREEN ---
  renderHandwritingScreen() {
    const letter = this.alphabetData[this.alphabetIndex] || this.alphabetData[0];
    const wordEl = document.getElementById('hwLetterWord');
    if (wordEl) wordEl.textContent = `Ví dụ: ${letter.word} (${letter.emoji})`;
    
    // Render authentic cursive preview SVG
    const svgContainer = document.getElementById('hwLetterSvgPreview');
    if (svgContainer) {
      const strokesData = window.MagicWorld.Strokes || {};
      const guides = strokesData[letter.id] || strokesData['a'] || [];
      const pathsHtml = guides.map(st => `<path d="${st.d}" fill="none" stroke="#2563EB" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />`).join('');
      svgContainer.innerHTML = `
        <svg viewBox="0 0 100 160" width="84" height="116" style="background:#FAFDFE; border-radius:12px; border:1px solid #BAE6FD; box-shadow:inset 0 1px 4px rgba(0,0,0,0.05);">
          <!-- 4 ruling lines -->
          <line x1="0" y1="40" x2="100" y2="40" stroke="#E2E8F0" stroke-width="0.8" stroke-dasharray="2,2" />
          <line x1="0" y1="64" x2="100" y2="64" stroke="#7DD3FC" stroke-width="1.2" stroke-dasharray="3,2" />
          <line x1="0" y1="88" x2="100" y2="88" stroke="#BAE6FD" stroke-width="0.8" stroke-dasharray="2,2" />
          <line x1="0" y1="112" x2="100" y2="112" stroke="#0284C7" stroke-width="2.2" />
          ${pathsHtml}
        </svg>
      `;
    }

    // Give browser a frame to layout canvas before measuring resolution
    requestAnimationFrame(() => {
      if (this.handwriting) {
        this.handwriting.setupResolution();
        this.handwriting.loadLetter(letter.id);
      }
    });
  }

  onHandwritingCompleted() {
    const letter = this.alphabetData[this.alphabetIndex];
    if (letter) {
      this.progress.markLetterWritten(letter.id);
    }
    this.showRandomPraise();
  }

  // --- MODULE: MATCHING PUZZLE GAME (Game Ghép Hình) ---
  renderMatchingGameScreen() {
    const dayWords = this.vocabDaysData[this.vocabDay] || [];
    const pool = dayWords.length >= 4 ? dayWords : (window.MagicWorld.VocabList || []);
    const cards = this.matching.startNewGame(pool, 4);

    document.getElementById('matchingScoreText').textContent = `0/${this.matching.totalPairs}`;
    const grid = document.getElementById('matchingCardsGrid');
    grid.innerHTML = '';

    cards.forEach((card, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'matching-card';
      cardEl.id = `matchCard_${idx}`;

      cardEl.innerHTML = `
        <div class="matching-card-inner">
          <div class="matching-face matching-back">
            <span class="back-pattern">❄️✨</span>
          </div>
          <div class="matching-face matching-front">
            ${card.type === 'picture' 
              ? `<span class="front-emoji">${card.emoji}</span>` 
              : `<span class="front-word">${card.text}</span>`}
          </div>
        </div>
      `;

      cardEl.addEventListener('click', () => this.handleMatchingCardClick(idx));
      grid.appendChild(cardEl);
    });
  }

  handleMatchingCardClick(cardIndex) {
    const cardEl = document.getElementById(`matchCard_${cardIndex}`);
    if (!cardEl || cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

    const res = this.matching.flipCard(cardIndex);
    if (!res) return;

    cardEl.classList.add('flipped');

    if (res.status === 'match') {
      const card1El = document.getElementById(`matchCard_${res.card1}`);
      const card2El = document.getElementById(`matchCard_${res.card2}`);
      if (card1El) card1El.classList.add('matched');
      if (card2El) card2El.classList.add('matched');

      this.audio.playChime();
      this.showRandomPraise();

      document.getElementById('matchingScoreText').textContent = `${this.matching.matchedPairs}/${this.matching.totalPairs}`;

      if (res.isWin) {
        setTimeout(() => {
          this.audio.playFanfare();
          this.progress.addSnowflakes(6);
          const sticker = this.progress.awardRandomSticker();
          this.updateHeaderStats();
          this.showVictoryModal(3, 10, sticker);
        }, 800);
      }
    } else if (res.status === 'mismatch') {
      this.audio.playBuBu();
      setTimeout(() => {
        const card1El = document.getElementById(`matchCard_${res.card1}`);
        const card2El = document.getElementById(`matchCard_${res.card2}`);
        if (card1El) card1El.classList.remove('flipped');
        if (card2El) card2El.classList.remove('flipped');
        this.matching.resetMismatched();
      }, 1200);
    }
  }

  openGameChoiceModal(moduleName, dayNumber, sessionWords) {
    this.currentQuizSession = { module: moduleName, day: dayNumber, words: sessionWords };
    const modal = document.getElementById('gameChoiceModal');
    if (modal) modal.style.display = 'flex';
  }

  // --- STORY THEATER SCREEN ---
  openStory(storyId) {
    this.story.loadStory(storyId);
    this.showScreen('story');
    this.story.play(null, (state, payload) => {
      this.updateStoryUI(state, payload);
    });
  }

  renderStoryScreen() {
    this.updateStoryUI('render');
  }

  updateStoryUI(state, payload) {
    const story = this.story.currentStory;
    if (!story) return;

    document.getElementById('storyTitleHeader').textContent = story.title;

    const scene = this.story.getCurrentScene();
    const line = this.story.getCurrentLine();

    // Scene Art Emoji Cluster
    const artEmoji = (window.MagicWorld.StoryArtEmoji && window.MagicWorld.StoryArtEmoji.art[scene ? scene.art : '']) || '🏰✨❄️';
    document.getElementById('storyArtDisplay').textContent = artEmoji;

    // Line Subtitle & Speaker
    const bubble = document.getElementById('storyBubble');
    const speakerEl = document.getElementById('storySpeaker');
    const textEl = document.getElementById('storyText');

    if (line) {
      bubble.className = `dialog-bubble ${line.who}`;
      speakerEl.innerHTML = line.who === 'co' ? '🌠 Cô Sao Băng' : '🦄 Lumi';

      // Karaoke word highlighting
      const fullText = this.audio.replaceTokens(line.text);
      if (this.story.highlightCharIndex >= 0) {
        const start = this.story.highlightCharIndex;
        const len = this.story.highlightCharLength || 1;
        const before = fullText.slice(0, start);
        const word = fullText.slice(start, start + len);
        const after = fullText.slice(start + len);
        textEl.innerHTML = `${before}<span class="karaoke-word-highlight">${word}</span>${after}`;
      } else {
        textEl.textContent = fullText;
      }
    }

    if (state === 'completed') {
      const sticker = payload && payload.sticker;
      if (sticker) {
        alert(`Bé Mây đã hoàn thành truyện và nhận được sticker: ${sticker.emoji} ${sticker.name}!`);
      }
      this.showScreen('world-map');
    }
  }

  // --- PRAISE & ENCOURAGEMENT HELPERS ---
  showRandomPraise() {
    const list = this.feedbackData.praise;
    const phrase = list[Math.floor(Math.random() * list.length)] || "Bé Mây giỏi quá!";
    if (this.audio) this.audio.speak(phrase);
  }

  showRandomEncouragement() {
    const list = this.feedbackData.wrong;
    const phrase = list[Math.floor(Math.random() * list.length)] || "Bé Mây cố lên nhé!";
    if (this.audio) this.audio.speak(phrase);
  }

  // --- SNOW CANVAS BACKGROUND ---
  setupSnowCanvas() {
    const canvas = document.getElementById('snowCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const flakes = [];
    for (let i = 0; i < 50; i++) {
      flakes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 3 + 1.5,
        d: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.7 + 0.3
      });
    }

    const drawSnow = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
        f.y += f.d;
        f.x += Math.sin(f.y * 0.02) * 0.6;
        if (f.y > h) {
          f.y = -5;
          f.x = Math.random() * w;
        }
      }
      ctx.fill();
      requestAnimationFrame(drawSnow);
    };

    drawSnow();
  }

  // --- EVENT LISTENERS ---
  bindEvents() {
    // Safari & iPad Unlock Audio on first interaction anywhere
    const unlockHandler = () => {
      if (this.audio) this.audio.unlockAudio();
    };
    ['touchstart', 'touchend', 'click', 'pointerdown'].forEach(evt => {
      document.addEventListener(evt, unlockHandler, { passive: true });
    });

    // Bottom Navigation Bar tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const screen = tab.getAttribute('data-screen');
        if (screen) {
          this.audio.playPop();
          this.showScreen(screen);
        }
      });
    });

    // Home / Map button
    const homeBtn = document.getElementById('headerHomeBtn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        this.audio.playPop();
        this.showScreen('world-map');
      });
    }

    // Parent Settings Button
    const parentBtn = document.getElementById('headerParentBtn');
    if (parentBtn) {
      parentBtn.addEventListener('click', () => this.openParentModal());
    }

    // Stickers Collection Button
    const stickersBtn = document.getElementById('headerStickersBtn');
    if (stickersBtn) {
      stickersBtn.addEventListener('click', () => this.openStickersModal());
    }

    // Story Prologue button on map
    const prologueBtn = document.getElementById('mapStoryBtn');
    if (prologueBtn) {
      prologueBtn.addEventListener('click', () => this.openStory('story-prologue'));
    }

    // World Map Zones
    document.querySelectorAll('.zone-card').forEach(card => {
      card.addEventListener('click', () => {
        const target = card.getAttribute('data-target');
        this.audio.playPop();
        if (target === 'alphabet') {
          this.showScreen('alphabet');
        } else if (target === 'vocab') {
          this.showScreen('vocab');
        } else if (target === 'spelling') {
          this.showScreen('spelling');
        } else if (target === 'matching') {
          this.showScreen('matching');
        } else if (target === 'story-bedtime') {
          this.openStory('story-bedtime');
        }
      });
    });

    // Alphabet Buttons
    document.getElementById('alphaPrevBtn').addEventListener('click', () => this.prevLetter());
    document.getElementById('alphaNextBtn').addEventListener('click', () => this.nextLetter());
    document.getElementById('alphaPrevLetterStepBtn')?.addEventListener('click', () => this.prevLetter());
    document.getElementById('alphaNextLetterStepBtn')?.addEventListener('click', () => this.nextLetter());
    document.getElementById('alphaPickerBtn')?.addEventListener('click', () => this.openDaySelectorModal('alphabet'));

    document.getElementById('btnListenLetter').addEventListener('click', () => {
      const letter = this.alphabetData[this.alphabetIndex];
      if (letter) this.audio.speak(letter.lower);
    });
    document.getElementById('btnListenExample').addEventListener('click', () => {
      const letter = this.alphabetData[this.alphabetIndex];
      if (letter) this.audio.speak(letter.sentence);
    });
    document.getElementById('btnWriteLetter').addEventListener('click', () => {
      this.showScreen('handwriting');
    });
    document.getElementById('alphabetSentence').addEventListener('click', () => {
      const letter = this.alphabetData[this.alphabetIndex];
      if (letter) this.audio.speak(letter.sentence);
    });

    // Vocab Buttons
    document.getElementById('vocabPrevBtn').addEventListener('click', () => this.prevVocabWord());
    document.getElementById('vocabNextBtn').addEventListener('click', () => this.nextVocabWord());
    document.getElementById('vocabPrevDayBtn')?.addEventListener('click', () => this.prevVocabDay());
    document.getElementById('vocabNextDayBtn')?.addEventListener('click', () => this.nextVocabDay());

    document.getElementById('btnVocabListen').addEventListener('click', () => {
      const words = this.vocabDaysData[this.vocabDay] || [];
      const currentWord = words[this.vocabWordIndex];
      if (currentWord) this.audio.speak(currentWord.text);
    });
    document.getElementById('btnVocabListenSentence')?.addEventListener('click', () => {
      const words = this.vocabDaysData[this.vocabDay] || [];
      const currentWord = words[this.vocabWordIndex];
      if (currentWord) this.audio.speak(currentWord.example);
    });
    document.getElementById('btnVocabPlayMatching')?.addEventListener('click', () => {
      this.showScreen('matching');
    });
    document.getElementById('vocabSentence').addEventListener('click', () => {
      const words = this.vocabDaysData[this.vocabDay] || [];
      const currentWord = words[this.vocabWordIndex];
      if (currentWord) this.audio.speak(currentWord.example);
    });
    document.getElementById('btnVocabDone').addEventListener('click', () => this.onVocabReadConfirmed());
    document.getElementById('vocabDayBadge').addEventListener('click', () => this.openDaySelectorModal('vocab'));

    // Spelling Buttons
    document.getElementById('spellingPrevBtn').addEventListener('click', () => this.prevSpellingWord());
    document.getElementById('spellingNextBtn').addEventListener('click', () => this.nextSpellingWord());
    document.getElementById('spellingPrevDayBtn')?.addEventListener('click', () => this.prevSpellingDay());
    document.getElementById('spellingNextDayBtn')?.addEventListener('click', () => this.nextSpellingDay());

    document.getElementById('btnSpellingListen').addEventListener('click', () => {
      const dayObj = this.spellingDaysData.find(d => d.day === this.spellingDay);
      if (dayObj && dayObj.words[this.spellingWordIndex]) {
        this.audio.speak(dayObj.words[this.spellingWordIndex].text);
      }
    });
    document.getElementById('btnSpellingSpell').addEventListener('click', () => this.playSpellingKaraoke());
    document.getElementById('btnSpellingPlayMatching')?.addEventListener('click', () => {
      this.showScreen('matching');
    });
    document.getElementById('btnSpellingDone').addEventListener('click', () => this.onSpellingReadConfirmed());
    document.getElementById('spellingDayBadge').addEventListener('click', () => this.openDaySelectorModal('spelling'));
    document.getElementById('spellingSentence').addEventListener('click', () => {
      const dayObj = this.spellingDaysData.find(d => d.day === this.spellingDay);
      if (dayObj && dayObj.words[this.spellingWordIndex]) {
        this.audio.speak(dayObj.words[this.spellingWordIndex].example);
      }
    });

    // Quiz Buttons
    document.getElementById('quizSoundBtn').addEventListener('click', () => {
      const q = this.quiz.getCurrentQuestion();
      if (q && this.audio) this.audio.speak(q.spellingRead || q.targetText);
    });
    document.getElementById('quizSkipBtn').addEventListener('click', () => {
      this.quiz.skipCurrent();
      this.renderQuizQuestion();
    });
    document.getElementById('quizNextBtn').addEventListener('click', () => this.advanceQuiz());
    document.getElementById('quizExitBtn').addEventListener('click', () => this.showScreen('world-map'));

    // Handwriting Buttons
    document.getElementById('hwClearBtn').addEventListener('click', () => this.handwriting.clear());
    document.getElementById('hwDemoBtn').addEventListener('click', () => this.handwriting.playDemo());
    document.getElementById('hwSkipBtn').addEventListener('click', () => {
      this.handwriting.skip();
      this.showScreen('alphabet');
    });
    document.getElementById('hwBackBtn').addEventListener('click', () => this.showScreen('alphabet'));

    // Story Controls
    document.getElementById('storyCloseBtn').addEventListener('click', () => {
      this.story.stop();
      this.showScreen('world-map');
    });
    document.getElementById('storyRepeatBtn').addEventListener('click', () => this.story.repeatScene());
    document.getElementById('storyPlayPauseBtn').addEventListener('click', () => {
      if (this.story.isPaused) {
        this.story.resume();
      } else {
        this.story.pause();
      }
    });
    document.getElementById('storyNextBtn').addEventListener('click', () => this.story.nextScene());

    // Victory Modal close
    document.getElementById('victoryCloseBtn').addEventListener('click', () => this.closeVictoryModal());

    // Parent Modal handlers
    document.getElementById('parentCloseBtn').addEventListener('click', () => this.closeParentModal());
    document.getElementById('parentSaveBtn').addEventListener('click', () => this.saveParentSettings());
    document.getElementById('parentResetBtn').addEventListener('click', () => {
      if (confirm('Bé Mây có chắc chắn muốn đặt lại toàn bộ tiến độ không?')) {
        this.progress.reset();
        this.updateHeaderStats();
        this.closeParentModal();
        alert('Đã đặt lại tiến độ ban đầu!');
      }
    });
    document.getElementById('parentTestVoiceBtn').addEventListener('click', () => {
      const input = document.getElementById('parentChildNameInput');
      const testName = input.value || "Bé Mây";
      this.audio.speak(`Chào ${testName}! Cô Sao Băng và Lumi chúc ${testName} học thật vui nhé!`);
    });

    // Matching Game Buttons
    const matchBack = document.getElementById('matchingBackBtn');
    if (matchBack) matchBack.addEventListener('click', () => this.showScreen('world-map'));
    const matchReset = document.getElementById('matchingResetBtn');
    if (matchReset) matchReset.addEventListener('click', () => this.renderMatchingGameScreen());

    // Game Choice Modal Buttons
    const choiceNext = document.getElementById('choiceNextDayBtn');
    if (choiceNext) {
      choiceNext.addEventListener('click', () => {
        document.getElementById('gameChoiceModal').style.display = 'none';
        const s = this.currentQuizSession || { module: 'vocab', day: this.vocabDay };
        if (s.module === 'vocab') {
          this.nextVocabDay();
          this.showScreen('vocab');
        } else {
          this.nextSpellingDay();
          this.showScreen('spelling');
        }
      });
    }

    const choiceMatch = document.getElementById('choiceMatchingBtn');
    if (choiceMatch) {
      choiceMatch.addEventListener('click', () => {
        document.getElementById('gameChoiceModal').style.display = 'none';
        this.showScreen('matching');
      });
    }
    const choiceQuiz = document.getElementById('choiceQuizBtn');
    if (choiceQuiz) {
      choiceQuiz.addEventListener('click', () => {
        document.getElementById('gameChoiceModal').style.display = 'none';
        const s = this.currentQuizSession || { module: 'vocab', day: this.vocabDay, words: this.vocabDaysData[this.vocabDay] };
        this.startQuizForSession(s.module, s.day, s.words || this.vocabDaysData[this.vocabDay]);
      });
    }
    const choiceMap = document.getElementById('choiceMapBtn');
    if (choiceMap) {
      choiceMap.addEventListener('click', () => {
        document.getElementById('gameChoiceModal').style.display = 'none';
        this.showScreen('world-map');
      });
    }

    // Victory Next Day button
    const victoryNext = document.getElementById('victoryNextDayBtn');
    if (victoryNext) {
      victoryNext.addEventListener('click', () => {
        document.getElementById('victoryModal').style.display = 'none';
        const s = this.currentQuizSession || { module: 'vocab', day: this.vocabDay };
        if (s.module === 'vocab') {
          this.nextVocabDay();
          this.showScreen('vocab');
        } else {
          this.nextSpellingDay();
          this.showScreen('spelling');
        }
      });
    }

    // Day Selector Modal Close buttons
    const dayModal = document.getElementById('daySelectorModal');
    const dayClose = document.getElementById('daySelectorCloseBtn');
    if (dayClose) {
      dayClose.addEventListener('click', () => {
        if (dayModal) dayModal.style.display = 'none';
      });
    }
    if (dayModal) {
      dayModal.addEventListener('click', (e) => {
        if (e.target === dayModal) dayModal.style.display = 'none';
      });
    }
  }

  // Day & Lesson Selector Modal (Visual, Touch-Friendly for iPad & Desktop)
  openDaySelectorModal(moduleType = 'vocab') {
    const modal = document.getElementById('daySelectorModal');
    const titleEl = document.getElementById('daySelectorTitle');
    const subEl = document.getElementById('daySelectorSubtitle');
    const gridEl = document.getElementById('daySelectorGrid');
    if (!modal || !gridEl) return;

    gridEl.innerHTML = '';

    if (moduleType === 'vocab') {
      titleEl.textContent = '📅 Thung Lũng Từ Vựng — 38 Ngày Học';
      subEl.textContent = 'Chạm vào ngày bất kỳ để cùng Bé Mây học 8 từ vựng mới';

      const daysList = Object.keys(this.vocabDaysData).map(k => parseInt(k, 10)).sort((a, b) => a - b);
      daysList.forEach(day => {
        const words = this.vocabDaysData[day] || [];
        const firstWord = words[0] || {};
        const progress = this.progress.getVocabDayProgress(day);
        const isComplete = progress.completedWords && progress.completedWords.length >= words.length;
        const isActive = (day === this.vocabDay);

        const card = document.createElement('div');
        card.className = `day-card-item ${isActive ? 'active' : ''}`;
        card.innerHTML = `
          <div class="day-card-badge">Ngày ${day}</div>
          <div class="day-card-topic">${firstWord.topic || 'Từ vựng'}</div>
          <div class="day-card-sub">${firstWord.group || `${words.length} từ`}</div>
          <div class="day-card-status">${isComplete ? '💎 Xong' : (progress.completedWords.length > 0 ? `⭐ ${progress.completedWords.length}/${words.length}` : '🌱 Mới')}</div>
        `;

        card.addEventListener('click', () => {
          this.vocabDay = day;
          this.vocabWordIndex = 0;
          this.audio.playPop();
          modal.style.display = 'none';
          this.showScreen('vocab');
        });

        gridEl.appendChild(card);
      });
    } else if (moduleType === 'spelling') {
      titleEl.textContent = '🏰 Lâu Đài Đánh Vần — 14 Ngày Học';
      subEl.textContent = 'Chạm vào ngày bất kỳ để cùng Bé Mây ghép vần diệu kỳ';

      this.spellingDaysData.forEach(d => {
        const progress = this.progress.getSpellingDayProgress(d.day);
        const isComplete = progress.completedWords && progress.completedWords.length >= d.words.length;
        const isActive = (d.day === this.spellingDay);

        const card = document.createElement('div');
        card.className = `day-card-item ${isActive ? 'active' : ''}`;
        card.innerHTML = `
          <div class="day-card-badge">Ngày ${d.day}</div>
          <div class="day-card-topic">${d.title}</div>
          <div class="day-card-sub">${d.words.length} từ ghép</div>
          <div class="day-card-status">${isComplete ? '💎 Xong' : (progress.completedWords.length > 0 ? `⭐ ${progress.completedWords.length}/${d.words.length}` : '🌱 Mới')}</div>
        `;

        card.addEventListener('click', () => {
          this.spellingDay = d.day;
          this.spellingWordIndex = 0;
          this.audio.playPop();
          modal.style.display = 'none';
          this.showScreen('spelling');
        });

        gridEl.appendChild(card);
      });
    } else if (moduleType === 'alphabet') {
      titleEl.textContent = '🔤 Rừng Chữ Lung Linh — 29 Chữ Cái';
      subEl.textContent = 'Chạm vào chữ cái bất kỳ để xem tranh và tập viết';

      this.alphabetData.forEach((letter, idx) => {
        const isComplete = this.progress.isLetterComplete(letter.id);
        const isActive = (idx === this.alphabetIndex);

        const card = document.createElement('div');
        card.className = `day-card-item ${isActive ? 'active' : ''}`;
        card.innerHTML = `
          <div class="day-card-badge" style="font-size:22px;">${letter.lower} <span style="font-size:16px; opacity:0.8;">${letter.upper}</span></div>
          <div class="day-card-topic">${letter.emoji || '✨'} ${letter.word}</div>
          <div class="day-card-sub">Âm "${letter.name}"</div>
          <div class="day-card-status">${isComplete ? '💎 Đã học' : '🌱 Mới'}</div>
        `;

        card.addEventListener('click', () => {
          this.alphabetIndex = idx;
          this.audio.playPop();
          modal.style.display = 'none';
          this.showScreen('alphabet');
        });

        gridEl.appendChild(card);
      });
    }

    modal.style.display = 'flex';
    setTimeout(() => {
      const activeCard = gridEl.querySelector('.day-card-item.active');
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  // Parent Settings Modal
  openParentModal() {
    const modal = document.getElementById('parentModal');
    if (!modal) return;
    document.getElementById('parentChildNameInput').value = this.progress.getChildName();
    modal.style.display = 'flex';
  }

  saveParentSettings() {
    const name = document.getElementById('parentChildNameInput').value;
    if (name && name.trim()) {
      this.progress.setChildName(name.trim());
      if (this.audio) this.audio.setChildName(name.trim());
    }
    this.closeParentModal();
  }

  closeParentModal() {
    document.getElementById('parentModal').style.display = 'none';
  }

  // Stickers Showcase Modal
  openStickersModal() {
    const modal = document.getElementById('stickersModal');
    if (!modal) return;
    const grid = document.getElementById('stickersGrid');
    grid.innerHTML = '';

    const unlocked = this.progress.getUnlockedStickers();
    this.progress.stickersPool.forEach(stk => {
      const isUnlocked = unlocked.some(u => u.id === stk.id);
      const card = document.createElement('div');
      card.style.cssText = 'background:#F0F9FF; border-radius:18px; padding:12px; text-align:center; border:2px solid #BAE6FD;';
      card.innerHTML = `
        <div style="font-size:48px; filter:${isUnlocked ? 'none' : 'grayscale(100%) opacity(0.3)'};">${stk.emoji}</div>
        <div style="font-weight:700; font-size:14px; margin-top:6px; color:#1B2B4B;">${isUnlocked ? stk.name : 'Chưa mở khóa'}</div>
      `;
      grid.appendChild(card);
    });

    modal.style.display = 'flex';
  }
}

// Instantiate and launch robustly across all browsers & load states
function launchMagicWorldApp() {
  if (!window.MagicWorldAppInstance) {
    window.MagicWorldAppInstance = new MagicWorldApp();
    window.MagicWorldAppInstance.init();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', launchMagicWorldApp);
} else {
  launchMagicWorldApp();
}
