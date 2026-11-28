// Magic World — Master Game App Controller & Router
const HOLD_BACK_MS = 3000;   // Back (lâu đài), vương miện, cài đặt
const HOLD_ACTION_MS = 1000; // Tập viết, Bài tập, Con đã đọc ✓, ◀ ▶ lớn dưới cùng

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
    this.currentExerciseContext = null;
    this.currentLessonListModule = 'alphabet';
    this.alphabetListMode = 'read';
    this.hwContext = { mode: 'alphabet', returnScreen: 'alphabet' };
    this.parentProgressTab = 'alphabet';

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

  renderEmojiHtml(val) {
    if (!val) return '✨';
    if (/\.(svg|png|jpe?g|webp)$/i.test(val)) {
      return `<img src="${val}" alt="" class="emoji-img" draggable="false">`;
    }
    return val;
  }

  init() {
    this.setupSnowCanvas();
    this.bindEvents();
    this.updateHeaderStats();
    const urlParams = new URLSearchParams(window.location.search);
    const initialScreen = urlParams.get('screen') || 'world-map';
    this.showScreen(initialScreen);

    // Init handwriting canvas when element available
    const hwCanvas = document.getElementById('handwritingCanvas');
    if (hwCanvas) {
      this.handwriting.init(
        hwCanvas,
        () => this.onHandwritingCompleted(),
        () => this.onHandwritingReset()
      );
    }

    // Auto set child name & handwriting difficulty
    if (this.audio && this.progress) {
      this.audio.setChildName(this.progress.getChildName());
    }
    if (this.handwriting && this.progress) {
      this.handwriting.setDifficulty(this.progress.getHandwritingDifficulty());
    }

    // Trap browser/hardware Back button so kids don't accidentally exit the app
    this.setupBackTrap();
  }

  setupBackTrap() {
    if (!window.history || !window.history.pushState) return;
    this._lastMapBackAt = 0;
    this._exitingBack = false;
    window.history.pushState({ app: true }, '', window.location.href);

    window.addEventListener('popstate', () => {
      if (this._exitingBack) return;
      if (this.currentScreen !== 'world-map') {
        window.history.pushState({ app: true }, '', window.location.href);
        this.showHoldHint('Giữ 🏰 3 giây để quay lại');
        return;
      }

      const now = Date.now();
      if (now - this._lastMapBackAt <= 2000) {
        this._lastMapBackAt = 0;
        this._exitingBack = true;
        window.history.back(); // Leave initial entry so Back actually exits
        return;
      }

      this._lastMapBackAt = now;
      window.history.pushState({ app: true }, '', window.location.href);
      this.showHoldHint('Vuốt Back lần nữa để thoát');
    });
  }

  // --- SCREEN NAVIGATION ---
  showScreen(screenId) {
    this.previousScreen = this.currentScreen;
    this.currentScreen = screenId;

    // Stop ongoing speech when switching screens
    if (this.audio) this.audio.stopSpeaking();

    // Hide bottom navbar in all lesson/game/handwriting screens; show on world-map & list screens
    const showNavbarScreens = ['world-map', 'lesson-list', 'story-list'];
    const appContainer = document.getElementById('appContainer');
    if (appContainer) {
      appContainer.classList.toggle('hide-navbar', !showNavbarScreens.includes(screenId));
    }

    // Toggle active class on screen divs
    document.querySelectorAll('.screen-view').forEach(view => {
      view.classList.remove('active');
    });

    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
    }

    // Update bottom nav active state
    const activeTabKey = (screenId === 'lesson-list') ? this.currentLessonListModule : screenId;
    document.querySelectorAll('.nav-tab').forEach(tab => {
      const tabTarget = tab.getAttribute('data-screen');
      if (tabTarget === activeTabKey) {
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
      case 'lesson-list':
        this.renderLessonListScreen();
        break;
      case 'story-list':
        this.renderStoryListScreen();
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
      case 'exercise':
        this.renderExerciseHub();
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
  getModuleCounts() {
    const alphaTotal = this.alphabetData.length || 29;
    const alphaDone = this.alphabetData.filter(l => this.progress.getLessonStatus('alphabet', l.id, 1) === 'done').length;

    const vocabDays = Object.keys(this.vocabDaysData);
    const vocabTotal = vocabDays.length || 38;
    const vocabDone = vocabDays.filter(d => {
      const words = this.vocabDaysData[d] || [];
      return this.progress.getLessonStatus('vocab', d, words.length) === 'done';
    }).length;

    const spellTotal = this.spellingDaysData.length || 14;
    const spellDone = this.spellingDaysData.filter(d => this.progress.getLessonStatus('spelling', d.day, d.words.length) === 'done').length;

    const stories = window.MagicWorld.Stories || [];
    const storyTotal = stories.length || 10;
    const listened = this.progress.data.listenedStories || [];
    const storyDone = stories.filter(s => listened.includes(s.id)).length;

    return { alphaDone, alphaTotal, vocabDone, vocabTotal, spellDone, spellTotal, storyDone, storyTotal };
  }

  renderWorldMap() {
    const totalStars = this.progress.data.totalStars || 0;
    const bannerEl = document.getElementById('mapGreeting');
    if (bannerEl) {
      bannerEl.textContent = `Xin chào ${this.progress.getChildName()}! Bé đã có ${totalStars} ⭐ lấp lánh!`;
    }

    const c = this.getModuleCounts();
    const setBar = (barId, textId, done, total, unit) => {
      const bar = document.getElementById(barId);
      const txt = document.getElementById(textId);
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      if (bar) bar.style.width = `${pct}%`;
      if (txt) txt.textContent = `Đã học ${done}/${total} ${unit}`;
    };
    setBar('mapProgressAlphabetBar', 'mapProgressAlphabetText', c.alphaDone, c.alphaTotal, 'chữ');
    setBar('mapProgressVocabBar', 'mapProgressVocabText', c.vocabDone, c.vocabTotal, 'ngày');
    setBar('mapProgressSpellingBar', 'mapProgressSpellingText', c.spellDone, c.spellTotal, 'ngày');

    const sBar = document.getElementById('mapProgressStoryBar');
    const sTxt = document.getElementById('mapProgressStoryText');
    if (sBar) sBar.style.width = `${c.storyTotal > 0 ? Math.round((c.storyDone / c.storyTotal) * 100) : 0}%`;
    if (sTxt) sTxt.textContent = `Đã nghe ${c.storyDone}/${c.storyTotal} bài`;
  }

  // --- SHARED LESSON LIST SCREEN (29 Chữ / 38 Ngày Từ Vựng / 14 Ngày Đánh Vần) ---
  openLessonList(moduleType = 'alphabet') {
    this.currentLessonListModule = moduleType;
    this.showScreen('lesson-list');
  }

  renderLessonListScreen() {
    const mod = this.currentLessonListModule || 'alphabet';
    const titleEl = document.getElementById('lessonListTitle');
    const countEl = document.getElementById('lessonListProgressCount');
    const gridEl = document.getElementById('lessonListGrid');
    const modeBarEl = document.getElementById('lessonListModeBar');
    if (!gridEl) return;

    gridEl.innerHTML = '';
    if (modeBarEl) {
      modeBarEl.innerHTML = '';
      modeBarEl.style.display = 'none';
    }
    const counts = this.getModuleCounts();
    let markedNextUp = false;

    const createTile = (title, sub, status, statusLabel, onClick) => {
      const tile = document.createElement('div');
      const statusClass = status === 'done' ? 'status-done' : (status === 'in_progress' ? 'status-in-progress' : 'status-todo');
      const isNext = status !== 'done' && !markedNextUp;
      if (isNext) markedNextUp = true;

      tile.className = `lesson-tile ${statusClass} ${isNext ? 'is-next-up' : ''}`;
      tile.innerHTML = `
        <div class="lesson-tile-title">${title}</div>
        <div class="lesson-tile-sub">${sub}</div>
        <div class="lesson-tile-status">${statusLabel}</div>
      `;
      tile.addEventListener('click', () => {
        this.audio.playPop();
        onClick();
      });
      gridEl.appendChild(tile);
    };

    if (mod === 'alphabet') {
      if (titleEl) titleEl.textContent = '🌲 Rừng Chữ Lung Linh';
      if (countEl) countEl.textContent = `Đã học ${counts.alphaDone}/${counts.alphaTotal} chữ`;

      if (modeBarEl) {
        modeBarEl.style.display = 'inline-flex';
        modeBarEl.innerHTML = `
          <button type="button" class="lesson-mode-btn ${this.alphabetListMode === 'read' ? 'active' : ''}" data-alpha-mode="read">📖 Học đọc</button>
          <button type="button" class="lesson-mode-btn ${this.alphabetListMode === 'write' ? 'active' : ''}" data-alpha-mode="write">✍️ Tập viết</button>
        `;
        modeBarEl.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => {
            this.audio.playPop();
            this.alphabetListMode = btn.dataset.alphaMode;
            this.renderLessonListScreen();
          });
        });
      }

      const isWriteMode = this.alphabetListMode === 'write';
      this.alphabetData.forEach((letter, idx) => {
        const isWritten = !!(this.progress.data.letters[letter.id] && this.progress.data.letters[letter.id].written);
        const status = isWriteMode ? (isWritten ? 'done' : 'todo') : this.progress.getLessonStatus('alphabet', letter.id, 1);
        const statusLabel = isWriteMode
          ? (isWritten ? '✓ ⭐ Đã viết' : '✍️ Tập viết')
          : (status === 'done' ? '✓ ⭐ Đã học' : '🌱 Chưa học');
        createTile(
          `${letter.lower} ${letter.upper}`,
          `${this.renderEmojiHtml(letter.emoji)} ${letter.word}`,
          status,
          statusLabel,
          () => {
            this.alphabetIndex = idx;
            if (isWriteMode) {
              this.hwContext = { mode: 'alphabet-direct', returnScreen: 'lesson-list' };
              this.showScreen('handwriting');
            } else {
              this.showScreen('alphabet');
            }
          }
        );
      });
    } else if (mod === 'vocab') {
      if (titleEl) titleEl.textContent = '🏞️ Thung Lũng Từ Vựng';
      if (countEl) countEl.textContent = `Đã học ${counts.vocabDone}/${counts.vocabTotal} ngày`;

      if (modeBarEl) {
        modeBarEl.style.display = 'inline-flex';
        modeBarEl.innerHTML = `
          <button type="button" class="lesson-mode-btn active" id="vocabListReadJumpBtn">📖 Học đọc</button>
          <button type="button" class="lesson-mode-btn" id="vocabListWriteJumpBtn">✍️ Tập viết từ vựng</button>
        `;
        document.getElementById('vocabListReadJumpBtn')?.addEventListener('click', () => {
          this.audio.playPop();
          gridEl.scrollTo({ top: 0, behavior: 'smooth' });
        });
        document.getElementById('vocabListWriteJumpBtn')?.addEventListener('click', () => {
          this.audio.playPop();
          const sec = document.getElementById('vocabWriteSectionDivider');
          if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      const days = Object.keys(this.vocabDaysData).map(k => parseInt(k, 10)).sort((a, b) => a - b);
      days.forEach(day => {
        const words = this.vocabDaysData[day] || [];
        const firstW = words[0] || {};
        const prog = this.progress.getVocabDayProgress(day);
        const readCount = (prog.completedWords || []).length;
        const status = this.progress.getLessonStatus('vocab', day, words.length);
        const statusLabel = status === 'done'
          ? '✓ ⭐ Đã học'
          : (status === 'in_progress' ? `💎 ${readCount}/${words.length}` : '🌱 Chưa học');

        createTile(
          `Ngày ${day}`,
          firstW.group || firstW.topic || `${words.length} từ`,
          status,
          statusLabel,
          () => {
            this.vocabDay = day;
            this.vocabWordIndex = 0;
            this.showScreen('vocab');
          }
        );
      });

      // Section "✍️ Tập viết từ vựng" inside the same list
      const divider = document.createElement('div');
      divider.id = 'vocabWriteSectionDivider';
      divider.className = 'lesson-section-divider';
      divider.innerHTML = '<span>✍️ Tập viết từ vựng (viết từng chữ cái)</span><span style="font-size:13px; font-weight:700;">Chọn bài để tập viết</span>';
      gridEl.appendChild(divider);

      days.forEach(day => {
        const words = this.vocabDaysData[day] || [];
        const firstW = words[0] || {};
        const writtenList = this.progress.getVocabDayWriteProgress(day);
        const writtenCount = writtenList.length;
        const status = writtenCount >= words.length && words.length > 0
          ? 'done'
          : (writtenCount > 0 ? 'in_progress' : 'todo');
        const statusLabel = status === 'done'
          ? '✓ ⭐ Đã viết'
          : (status === 'in_progress' ? `✍️ ${writtenCount}/${words.length}` : '✍️ Tập viết');

        createTile(
          `Viết Ngày ${day}`,
          firstW.group || firstW.topic || `${words.length} từ`,
          status,
          statusLabel,
          () => this.startVocabWordWriting(day, 0, 0)
        );
      });
    } else if (mod === 'spelling') {
      if (titleEl) titleEl.textContent = '🏰 Lâu Đài Đánh Vần';
      if (countEl) countEl.textContent = `Đã học ${counts.spellDone}/${counts.spellTotal} ngày`;

      this.spellingDaysData.forEach(d => {
        const prog = this.progress.getSpellingDayProgress(d.day);
        const readCount = (prog.completedWords || []).length;
        const status = this.progress.getLessonStatus('spelling', d.day, d.words.length);
        const statusLabel = status === 'done'
          ? '✓ ⭐ Đã học'
          : (status === 'in_progress' ? `💎 ${readCount}/${d.words.length}` : '🌱 Chưa học');

        createTile(
          `Ngày ${d.day}`,
          d.title,
          status,
          statusLabel,
          () => {
            this.spellingDay = d.day;
            this.spellingWordIndex = 0;
            this.showScreen('spelling');
          }
        );
      });
    }
  }

  // --- STORY & BEDTIME LIST SCREEN (Góc Kể Chuyện) ---
  renderStoryListScreen() {
    const stories = window.MagicWorld.Stories || [];
    const listened = this.progress.data.listenedStories || [];
    const countEl = document.getElementById('storyListProgressCount');
    const gridEl = document.getElementById('storyListGrid');
    if (!gridEl) return;

    const doneCount = stories.filter(s => listened.includes(s.id)).length;
    if (countEl) countEl.textContent = `Đã nghe ${doneCount}/${stories.length} bài`;

    gridEl.innerHTML = '';
    const artMap = (window.MagicWorld.StoryArtEmoji && window.MagicWorld.StoryArtEmoji.art) || {};

    stories.forEach(s => {
      const isBedtime = s.mood === 'calm';
      const isListened = listened.includes(s.id);
      const lineCount = (s.scenes || []).reduce((acc, sc) => acc + (sc.lines ? sc.lines.length : 0), 0);
      const artStr = artMap[s.art] || (isBedtime ? '🌙⭐' : '🌠📖');
      const iconChar = Array.from(artStr)[0] || (isBedtime ? '🌙' : '📖');

      const card = document.createElement('div');
      card.className = `story-list-card ${isListened ? 'is-listened' : ''}`;
      card.innerHTML = `
        <div class="story-list-icon">${iconChar}</div>
        <div class="story-list-meta">
          <div class="story-list-title">${s.title}</div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="story-type-badge ${isBedtime ? 'bedtime' : ''}">${isBedtime ? '🌙 Ru ngủ' : '📖 Truyện'}</span>
            <span style="font-size:12px; font-weight:700; color:#64748B;">${lineCount} đoạn</span>
            ${isListened ? '<span style="font-size:12px; font-weight:800; color:#15803D;">✓ Đã nghe</span>' : ''}
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        this.audio.playPop();
        this.openStory(s.id);
      });
      gridEl.appendChild(card);
    });
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
    document.getElementById('alphabetEmoji').innerHTML = this.renderEmojiHtml(letter.emoji);
    document.getElementById('alphabetWord').textContent = letter.word;
    document.getElementById('alphabetSentence').textContent = this.audio ? this.audio.replaceTokens(letter.sentence) : letter.sentence;

    // Auto read letter on enter
    if (this.audio) {
      this.audio.speak(letter.lower);
    }
  }

  nextLetter() {
    if (this.alphabetIndex >= this.alphabetData.length - 1) {
      this.openGameChoiceModal('alphabet', this.alphabetData.length, this.alphabetData);
      return;
    }
    this.alphabetIndex++;
    this.renderAlphabetScreen();
  }

  prevLetter() {
    this.alphabetIndex = (this.alphabetIndex - 1 + this.alphabetData.length) % this.alphabetData.length;
    this.renderAlphabetScreen();
  }

  onAlphabetReadConfirmed() {
    const letter = this.alphabetData[this.alphabetIndex];
    if (!letter) return;
    this.progress.markLetterRead(letter.id);
    this.audio.playChime();
    this.showRandomPraise();
    this.nextLetter();
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
    document.getElementById('vocabEmoji').innerHTML = this.renderEmojiHtml(currentWord.emoji);
    document.getElementById('vocabText').textContent = currentWord.text;
    document.getElementById('vocabSentence').textContent = this.audio ? this.audio.replaceTokens(currentWord.example) : currentWord.example;

    // Show end-of-lesson popup button on the last word
    const vocabEndBtn = document.getElementById('btnVocabEndModal');
    if (vocabEndBtn) {
      vocabEndBtn.style.display = (this.vocabWordIndex === words.length - 1) ? 'inline-flex' : 'none';
    }

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
      // Finished today's words -> prompt child to do end-of-lesson exercises!
      this.openGameChoiceModal('vocab', this.vocabDay, words);
    }
  }

  prevVocabWord() {
    if (this.vocabWordIndex > 0) {
      this.vocabWordIndex--;
      this.renderVocabScreen();
    } else {
      this.audio.playPop();
      this.showHoldHint('📌 Đây là từ đầu tiên của bài hôm nay rồi nhé!');
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
    document.getElementById('spellingEmoji').innerHTML = this.renderEmojiHtml(currentWord.emoji);
    document.getElementById('spellingText').textContent = currentWord.text;
    document.getElementById('spellingSentence').textContent = this.audio ? this.audio.replaceTokens(currentWord.example) : currentWord.example;
    this.renderSpellingRimeBar(currentWord);

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
          this.speakWithBtn(null, chip.text);
        });
        chipsContainer.appendChild(chipBtn);
      });
    }

    // Show end-of-lesson popup button on the last word
    const spellingEndBtn = document.getElementById('btnSpellingEndModal');
    if (spellingEndBtn) {
      spellingEndBtn.style.display = (this.spellingWordIndex === dayObj.words.length - 1) ? 'inline-flex' : 'none';
    }

    // Auto read word
    if (this.audio) {
      this.audio.speak(currentWord.text);
    }
  }

  renderSpellingRimeBar(currentWord) {
    const bar = document.getElementById('spellingRimeBar');
    if (!bar || !currentWord) return;
    bar.innerHTML = '';

    const rime = currentWord.rime || '';
    const g1Chips = (currentWord.chips || []).filter(c => c.group === 1);
    const chipTexts = (rime.length >= 2 && g1Chips.length > 0)
      ? g1Chips.map(c => c.text)
      : (rime ? [rime] : []);

    if (chipTexts.length === 0) {
      bar.style.display = 'none';
      return;
    }
    bar.style.display = 'inline-flex';

    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'rime-chips-mini';
    chipTexts.forEach((txt, idx) => {
      if (idx > 0) {
        const sep = document.createElement('span');
        sep.className = 'rime-chip-sep';
        sep.textContent = '–';
        chipsWrap.appendChild(sep);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      const isFinal = (idx === chipTexts.length - 1);
      btn.className = `spell-chip-sm ${isFinal ? 'rime-final' : ''}`;
      btn.textContent = txt;
      btn.addEventListener('click', () => this.speakWithBtn(null, txt));
      chipsWrap.appendChild(btn);
    });
    bar.appendChild(chipsWrap);

    const spkBtn = document.createElement('button');
    spkBtn.type = 'button';
    spkBtn.id = 'btnReadRimeBox';
    spkBtn.className = 'rime-speaker-sm';
    spkBtn.title = `Đọc vần ${rime}`;
    spkBtn.textContent = '🔊';
    spkBtn.addEventListener('click', async () => {
      if (!this.audio) return;
      for (const part of chipTexts) {
        await this.audio.speak(part);
      }
    });
    bar.appendChild(spkBtn);

    const otherBtn = document.createElement('button');
    otherBtn.type = 'button';
    otherBtn.id = 'btnOtherRimeWords';
    otherBtn.className = 'rime-other-btn';
    otherBtn.innerHTML = '☰ Từ khác';
    otherBtn.addEventListener('click', () => {
      this.audio.playPop();
      this.openRimeWordsModal(rime);
    });
    bar.appendChild(otherBtn);
  }

  openRimeWordsModal(rime) {
    const modal = document.getElementById('rimeWordsModal');
    const titleEl = document.getElementById('rimeWordsModalTitle');
    const listEl = document.getElementById('rimeWordsList');
    if (!modal || !listEl) return;

    if (titleEl) titleEl.textContent = `Các từ có vần "${rime}"`;
    listEl.innerHTML = '';

    const matches = [];
    this.spellingDaysData.forEach(d => {
      (d.words || []).forEach(w => {
        if (w.rime === rime) matches.push(w);
      });
    });

    matches.forEach(w => {
      const row = document.createElement('div');
      row.className = 'rime-word-row';
      const spellStr = (w.spellingRead || '').replace(/\s*\|\s*/g, ' → ');
      row.innerHTML = `
        <div class="rime-word-row-left">
          <span class="rime-word-emoji">${w.emoji && w.emoji !== '✨' ? this.renderEmojiHtml(w.emoji) : ''}</span>
          <div>
            <div class="rime-word-text">${w.text}</div>
            <div class="rime-word-spell">${spellStr}</div>
          </div>
        </div>
        <button type="button" class="rime-speaker-sm" title="Đọc từ và cách đánh vần">🔊</button>
      `;
      const spk = row.querySelector('button');
      spk.addEventListener('click', async () => {
        if (!this.audio) return;
        await this.audio.speak(w.text);
        if (w.spellingRead) {
          const parts = w.spellingRead.split('|').map(p => p.trim()).filter(Boolean);
          for (const p of parts) {
            await this.audio.speak(p);
          }
        }
      });
      listEl.appendChild(row);
    });

    modal.style.display = 'flex';
  }

  closeRimeWordsModal() {
    const modal = document.getElementById('rimeWordsModal');
    if (modal) modal.style.display = 'none';
  }

  stopAllAudioIndicators() {
    this._karaokeRunId = (this._karaokeRunId || 0) + 1;
    document.querySelectorAll('.round-speaker-btn.is-speaking').forEach(b => b.classList.remove('is-speaking'));
    document.querySelectorAll('#spellingChipsContainer .spell-chip.karaoke-active').forEach(c => c.classList.remove('karaoke-active'));
  }

  async speakWithBtn(btnEl, text) {
    if (!this.audio || !text) return;
    const now = performance.now();
    if (this._speakerLockedUntil && now < this._speakerLockedUntil) return;
    this._speakerLockedUntil = now + 300;

    this.stopAllAudioIndicators();
    this.audio.stopSpeaking();

    if (btnEl) btnEl.classList.add('is-speaking');
    try {
      await this.audio.speak(text);
    } finally {
      if (btnEl) btnEl.classList.remove('is-speaking');
    }
  }

  async playSpellingKaraoke() {
    const dayObj = this.spellingDaysData.find(d => d.day === this.spellingDay);
    if (!dayObj) return;
    const currentWord = dayObj.words[this.spellingWordIndex];
    if (!currentWord) return;

    const now = performance.now();
    if (this._speakerLockedUntil && now < this._speakerLockedUntil) return;
    this._speakerLockedUntil = now + 300;

    this.stopAllAudioIndicators();
    this.audio.stopSpeaking();
    const runId = this._karaokeRunId;
    const spellBtn = document.getElementById('btnSpellingSpell');
    if (spellBtn) spellBtn.classList.add('is-speaking');

    const chipEls = document.querySelectorAll('#spellingChipsContainer .spell-chip');

    for (let i = 0; i < currentWord.chips.length; i++) {
      if (this._karaokeRunId !== runId) return;
      chipEls.forEach(el => el.classList.remove('karaoke-active'));
      if (chipEls[i]) {
        chipEls[i].classList.add('karaoke-active');
      }
      const tok = currentWord.chips[i].text;
      await this.audio.speak(tok);
      if (this._karaokeRunId !== runId) return;
      await new Promise(r => setTimeout(r, 220));
    }

    if (this._karaokeRunId !== runId) return;
    chipEls.forEach(el => el.classList.remove('karaoke-active'));
    await new Promise(r => setTimeout(r, 180));
    if (this._karaokeRunId !== runId) return;
    await this.audio.speak(currentWord.text);
    if (this._karaokeRunId !== runId) return;
    if (spellBtn) spellBtn.classList.remove('is-speaking');
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
      // Finished today's words -> prompt child to do end-of-lesson exercises!
      this.openGameChoiceModal('spelling', this.spellingDay, dayObj.words);
    }
  }

  prevSpellingWord() {
    if (this.spellingWordIndex > 0) {
      this.spellingWordIndex--;
      this.renderSpellingScreen();
    } else {
      this.audio.playPop();
      this.showHoldHint('📌 Đây là từ đầu tiên của bài hôm nay rồi nhé!');
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

    // Top counters: Question N/totalQ and Correct count
    const totalQ = this.quiz.currentQuestions.length || 8;
    document.getElementById('quizProgressTag').textContent = `Câu ${this.quiz.currentIndex + 1}/${totalQ}`;
    document.getElementById('quizScoreTag').textContent = `⭐ Đúng: ${this.quiz.correctCount}/${totalQ}`;

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
        card.innerHTML = `<span class="card-emoji">${this.renderEmojiHtml(opt.emoji)}</span>`;
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
      const q = this.quiz.getCurrentQuestion();
      if (q && this.audio) {
        this.audio.speak(q.targetText);
      }
      this.showRandomPraise();

      // Show Next button or auto advance
      const nextBtn = document.getElementById('quizNextBtn');
      nextBtn.style.display = 'flex';
      const totalQ = this.quiz.currentQuestions.length || 8;
      document.getElementById('quizScoreTag').textContent = `⭐ Đúng: ${this.quiz.correctCount}/${totalQ}`;

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
    this.showVictoryModal(outcome.stars, res.correct, outcome.newSticker, res.total);
  }

  openModalWithGuard(modal) {
    if (!modal) return;
    modal.dataset.guardUntil = String(performance.now() + 600);
    modal.style.display = 'flex';
  }

  isEndOfCourse(moduleName, dayNumber) {
    if (moduleName === 'alphabet') return true;
    if (moduleName === 'vocab') return dayNumber >= Object.keys(this.vocabDaysData).length;
    if (moduleName === 'spelling') return dayNumber >= this.spellingDaysData.length;
    return false;
  }

  showVictoryModal(stars, correctCount, sticker, totalCount = 8) {
    const modal = document.getElementById('victoryModal');
    if (!modal) return;

    let starEmojis = '⭐';
    if (stars === 2) starEmojis = '⭐⭐';
    if (stars === 3) starEmojis = '⭐⭐⭐';

    const s = this.currentQuizSession || { module: 'vocab', day: this.vocabDay };
    const isLast = this.isEndOfCourse(s.module, s.day);

    const titleEl = document.getElementById('victoryTitle');
    if (titleEl) titleEl.textContent = isLast ? 'Bé đã học hết rồi! 🎉' : 'Bé Tuyệt Vời Quá!';

    const nextBtn = document.getElementById('victoryNextDayBtn');
    const restartBtn = document.getElementById('victoryRestartBtn');
    if (nextBtn) nextBtn.style.display = isLast ? 'none' : 'flex';
    if (restartBtn) restartBtn.style.display = isLast ? 'flex' : 'none';

    document.getElementById('victoryStarsDisplay').textContent = starEmojis;
    document.getElementById('victoryScoreText').textContent = `Bé đã trả lời đúng ${correctCount}/${totalCount} câu hỏi!`;

    const stickerBox = document.getElementById('victoryStickerBox');
    if (sticker) {
      stickerBox.style.display = 'block';
      document.getElementById('victoryStickerEmoji').textContent = sticker.emoji;
      document.getElementById('victoryStickerName').textContent = sticker.name;
    } else {
      stickerBox.style.display = 'none';
    }

    this.openModalWithGuard(modal);
  }

  closeVictoryModal() {
    document.getElementById('victoryModal').style.display = 'none';
    this.showScreen('world-map');
  }

  startVocabWordWriting(day, wordIndex = 0, letterIndex = 0) {
    const words = this.vocabDaysData[day] || [];
    if (!words.length) return;
    const word = words[wordIndex] || words[0];
    const decompose = window.MagicWorld.HandwritingGrade && window.MagicWorld.HandwritingGrade.decomposeVietnameseWord;
    const charSpecs = decompose ? decompose(word.text) : [];
    if (!charSpecs.length) return;

    this.hwContext = {
      mode: 'vocab-word',
      day,
      words,
      wordIndex,
      letterIndex: Math.min(letterIndex, charSpecs.length - 1),
      charSpecs,
      returnScreen: 'lesson-list'
    };
    this.showScreen('handwriting');
  }

  // --- HANDWRITING SCREEN ---
  renderHandwritingScreen() {
    const isVocabWord = this.hwContext && this.hwContext.mode === 'vocab-word';
    let strokeKey = 'a';
    let customStrokes = null;
    const wordEl = document.getElementById('hwLetterWord');

    if (isVocabWord) {
      const ctx = this.hwContext;
      const word = ctx.words[ctx.wordIndex];
      const spec = ctx.charSpecs[ctx.letterIndex] || ctx.charSpecs[0];
      strokeKey = spec.strokeKey;
      customStrokes = spec.strokes;

      if (wordEl && word) {
        const charsHtml = ctx.charSpecs.map((c, idx) =>
          `<span class="hw-word-char ${idx === ctx.letterIndex ? 'active' : ''}">${c.char}</span>`
        ).join('');
        wordEl.innerHTML = `Từ: ${charsHtml} (${this.renderEmojiHtml(word.emoji)}) <span style="font-size:13px; color:#0284C7;">(${ctx.wordIndex + 1}/${ctx.words.length})</span>`;
      }
    } else {
      const letter = this.alphabetData[this.alphabetIndex] || this.alphabetData[0];
      strokeKey = letter.id;
      if (wordEl) wordEl.innerHTML = `Ví dụ: ${letter.word} (${this.renderEmojiHtml(letter.emoji)})`;
    }

    // Hide "Đã viết xong" until all strokes are traced
    this.onHandwritingReset();

    // Render bigger cursive preview SVG with 3 clean ruling lines
    const svgContainer = document.getElementById('hwLetterSvgPreview');
    if (svgContainer) {
      const strokesData = window.MagicWorld.Strokes || {};
      const guides = customStrokes || strokesData[strokeKey] || strokesData['a'] || [];
      const pathsHtml = guides.map(st => `<path d="${st.d}" fill="none" stroke="#2563EB" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" />`).join('');
      svgContainer.innerHTML = `
        <svg viewBox="0 0 100 160" width="112" height="148" style="background:#FAFDFE; border-radius:14px; border:1.5px solid #BAE6FD; box-shadow:inset 0 1px 4px rgba(0,0,0,0.05);">
          <!-- 3 clean ruling lines (trên, giữa, đáy) -->
          <line x1="0" y1="64" x2="100" y2="64" stroke="#7DD3FC" stroke-width="1.2" stroke-dasharray="3,2" />
          <line x1="0" y1="88" x2="100" y2="88" stroke="#BAE6FD" stroke-width="0.9" stroke-dasharray="2,2" />
          <line x1="0" y1="112" x2="100" y2="112" stroke="#0284C7" stroke-width="2.4" />
          ${pathsHtml}
        </svg>
      `;
    }

    // Give browser a frame to layout canvas before measuring resolution
    requestAnimationFrame(() => {
      if (this.handwriting) {
        this.handwriting.setupResolution();
        this.handwriting.loadLetter(strokeKey, customStrokes);
      }
    });
  }

  onHandwritingReset() {
    const doneBtn = document.getElementById('hwSkipBtn');
    if (doneBtn) {
      doneBtn.style.display = 'none';
    }
  }

  onHandwritingCompleted(stars = 3) {
    if (!this.hwContext || this.hwContext.mode !== 'vocab-word') {
      const letter = this.alphabetData[this.alphabetIndex];
      if (letter) {
        this.progress.markLetterWritten(letter.id);
      }
    }
    this.showRandomPraise();
    // Auto-reveal celebratory "✓ Đã viết xong" button with 1-3 star rating
    const doneBtn = document.getElementById('hwSkipBtn');
    if (doneBtn) {
      const starStr = '⭐'.repeat(Math.max(1, Math.min(3, stars || 1)));
      doneBtn.textContent = `✓ Đã viết xong ${starStr}`;
      doneBtn.style.display = 'flex';
    }
  }

  // --- MODULE: EXERCISE HUB (Bài Tập) ---
  openExerciseHub(moduleName, dayNumber, sessionWords) {
    this.currentExerciseContext = {
      module: moduleName,
      day: dayNumber,
      words: sessionWords
    };
    this.currentQuizSession = this.currentExerciseContext;
    this.showScreen('exercise');
  }

  renderExerciseHub() {
    if (!this.currentExerciseContext) {
      const words = this.vocabDaysData[this.vocabDay] || [];
      this.currentExerciseContext = {
        module: 'vocab',
        day: this.vocabDay,
        words: words
      };
    }
    const ctx = this.currentExerciseContext;
    const subEl = document.getElementById('exerciseHubSubtitle');
    if (subEl) {
      if (ctx.module === 'spelling') {
        const dayObj = this.spellingDaysData.find(d => d.day === ctx.day);
        subEl.textContent = dayObj ? `Đánh Vần — Ngày ${ctx.day}: ${dayObj.title}` : `Đánh Vần — Ngày ${ctx.day}`;
      } else {
        const firstW = ctx.words && ctx.words[0];
        subEl.textContent = firstW ? `Từ Vựng — Ngày ${ctx.day} (${firstW.group})` : `Từ Vựng — Ngày ${ctx.day}`;
      }
    }
  }

  // --- MODULE: MATCHING PUZZLE GAME (Thử Thách Ghép Hình) ---
  renderMatchingGameScreen() {
    const ctxWords = (this.currentExerciseContext && this.currentExerciseContext.words)
      || (this.currentQuizSession && this.currentQuizSession.words);
    const dayWords = (ctxWords && ctxWords.length >= 4) ? ctxWords : (this.vocabDaysData[this.vocabDay] || []);
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
              ? `<span class="front-emoji">${this.renderEmojiHtml(card.emoji)}</span>` 
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
    if (!modal) return;

    const isLast = this.isEndOfCourse(moduleName, dayNumber);
    const titleEl = document.getElementById('gameChoiceTitle');
    const subEl = document.getElementById('gameChoiceSub');
    const exBtn = document.getElementById('choiceExerciseBtn');
    const nextBtn = document.getElementById('choiceNextDayBtn');
    const restartBtn = document.getElementById('choiceRestartBtn');
    const mapBtn = document.getElementById('choiceMapBtn');

    if (moduleName === 'alphabet') {
      if (titleEl) titleEl.textContent = 'Bé đã học hết rồi! 🎉';
      if (subEl) subEl.textContent = 'Bé đã hoàn thành cả 29 chữ cái! Giữ nút để chọn nhé:';
      if (exBtn) exBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (restartBtn) restartBtn.style.display = 'flex';
      if (mapBtn) mapBtn.textContent = '📋 Về danh sách chữ';
    } else if (isLast) {
      if (titleEl) titleEl.textContent = 'Bé đã học hết rồi! 🎉';
      if (subEl) subEl.textContent = 'Bé đã hoàn thành hết khóa học! Giữ nút để chọn nhé:';
      if (exBtn) exBtn.style.display = 'flex';
      if (nextBtn) nextBtn.style.display = 'none';
      if (restartBtn) restartBtn.style.display = 'flex';
      if (mapBtn) mapBtn.textContent = '📋 Về danh sách bài';
    } else {
      if (titleEl) titleEl.textContent = 'Bé Đã Đọc Xong Bài Hôm Nay!';
      if (subEl) subEl.textContent = 'Giữ nút bên dưới để chọn bước tiếp theo nhé:';
      if (exBtn) exBtn.style.display = 'flex';
      if (nextBtn) nextBtn.style.display = 'flex';
      if (restartBtn) restartBtn.style.display = 'none';
      if (mapBtn) mapBtn.textContent = '📋 Về danh sách bài';
    }

    this.openModalWithGuard(modal);
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

  // --- 3-SECOND HOLD-TO-CONFIRM HELPER (Anti-misclick for 4-year-olds) ---
  showHoldHint(message) {
    let toast = document.getElementById('holdHintToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'holdHintToast';
      toast.className = 'hold-hint-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    clearTimeout(this._holdHintTimer);
    this._holdHintTimer = setTimeout(() => {
      toast.style.display = 'none';
    }, 1500);
  }

  // Shared HoldButton(el, durationMs, onComplete)
  HoldButton(el, durationMs, onComplete) {
    if (!el) return;

    // If durationMs <= 0, act as instant tap with 400ms double-tap guard
    if (durationMs <= 0) {
      let lockedUntil = 0;
      el.addEventListener('click', () => {
        const now = performance.now();
        if (now < lockedUntil) return;
        lockedUntil = now + 400;
        onComplete();
      });
      return;
    }

    el.classList.add('hold-btn');
    const isCircular = el.classList.contains('icon-btn') || el.classList.contains('nav-arrow-btn');

    let bar = el.querySelector('.hold-progress-bar');
    if (!bar && !isCircular) {
      bar = document.createElement('span');
      bar.className = 'hold-progress-bar';
      el.insertBefore(bar, el.firstChild);
    }

    let ringCircle = null;
    let ringCircumference = 0;
    if (isCircular) {
      let svg = el.querySelector('.hold-ring-svg');
      if (!svg) {
        const svgNS = 'http://www.w3.org/2000/svg';
        svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class', 'hold-ring-svg');
        svg.setAttribute('viewBox', '0 0 60 60');
        ringCircle = document.createElementNS(svgNS, 'circle');
        ringCircle.setAttribute('class', 'hold-ring-circle');
        ringCircle.setAttribute('cx', '30');
        ringCircle.setAttribute('cy', '30');
        ringCircle.setAttribute('r', '27');
        ringCircumference = 2 * Math.PI * 27;
        ringCircle.style.strokeDasharray = `${ringCircumference}`;
        ringCircle.style.strokeDashoffset = `${ringCircumference}`;
        svg.appendChild(ringCircle);
        el.appendChild(svg);
      } else {
        ringCircle = svg.querySelector('.hold-ring-circle');
        ringCircumference = 2 * Math.PI * 27;
      }
    }

    let rafId = null;
    let startTime = 0;
    let completed = false;
    let holding = false;
    let lockedUntil = 0;
    const activePointers = new Set();

    const setProgress = (pct) => {
      if (bar) bar.style.width = `${pct}%`;
      if (ringCircle) {
        ringCircle.style.strokeDashoffset = `${ringCircumference * (1 - pct / 100)}`;
      }
    };

    const resetHold = (triggerShake) => {
      if (!holding) return;
      holding = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      el.classList.remove('is-holding');
      setProgress(0);

      if (triggerShake && !completed) {
        el.classList.remove('hold-shake');
        void el.offsetWidth;
        el.classList.add('hold-shake');
        setTimeout(() => el.classList.remove('hold-shake'), 360);

        const secTotal = Math.max(1, Math.round(durationMs / 1000));
        this.showHoldHint(`👆 Giữ ${secTotal} giây để chọn nhé!`);
      }
    };

    const tick = (now) => {
      if (!holding) return;
      if (activePointers.size > 1) {
        resetHold(false);
        return;
      }
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);

      if (elapsed >= durationMs) {
        completed = true;
        holding = false;
        lockedUntil = performance.now() + 400; // 400ms double-tap guard
        el.classList.remove('is-holding');
        setProgress(0);

        const toast = document.getElementById('holdHintToast');
        if (toast) toast.style.display = 'none';

        if (navigator.vibrate) {
          try { navigator.vibrate(30); } catch (_) {}
        }
        if (this.audio && this.audio.playTick) {
          this.audio.playTick();
        }
        onComplete();
        return;
      }

      const secLeft = Math.ceil((durationMs - elapsed) / 1000);
      this.showHoldHint(`⏳ Đang giữ... ${secLeft} giây`);
      rafId = requestAnimationFrame(tick);
    };

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
      const modalBackdrop = el.closest('.victory-modal-backdrop');
      if (modalBackdrop && Number(modalBackdrop.dataset.guardUntil || 0) > performance.now()) return;
      if (performance.now() < lockedUntil) return;

      activePointers.add(e.pointerId);
      if (activePointers.size > 1) {
        resetHold(false);
        return;
      }

      completed = false;
      holding = true;
      startTime = performance.now();
      el.classList.add('is-holding');
      setProgress(0);
      rafId = requestAnimationFrame(tick);
    });

    const onPointerEnd = (e, isRelease) => {
      activePointers.delete(e.pointerId);
      resetHold(isRelease);
    };

    el.addEventListener('pointerup', (e) => onPointerEnd(e, true));
    el.addEventListener('pointercancel', (e) => onPointerEnd(e, false));
    el.addEventListener('pointerleave', (e) => onPointerEnd(e, false));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  bindHoldAction(el, callback, durationMs = HOLD_BACK_MS) {
    this.HoldButton(el, durationMs, callback);
  }

  // Swipe left/right (>60px) on lesson content pane
  bindSwipeNav(paneEl, onSwipeLeft, onSwipeRight) {
    if (!paneEl) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    paneEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      tracking = true;
      startX = e.clientX;
      startY = e.clientY;
    });

    paneEl.addEventListener('pointerup', (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }
    });

    paneEl.addEventListener('pointercancel', () => { tracking = false; });
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

    // Bottom Navigation Bar tabs (instant 1-tap; opens Lesson List for Chữ Cái / Từ Vựng / Đánh Vần)
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const screen = tab.getAttribute('data-screen');
        if (screen === 'alphabet' || screen === 'vocab' || screen === 'spelling') {
          this.audio.playPop();
          this.openLessonList(screen);
        } else if (screen === 'exercise') {
          this.audio.playPop();
          const words = this.vocabDaysData[this.vocabDay] || [];
          this.openExerciseHub('vocab', this.vocabDay, words);
        } else if (screen) {
          this.audio.playPop();
          this.showScreen(screen);
        }
      });
    });

    // Top Header: Castle Back (3s hold), Crown Stickers (3s hold), Parent Settings (3s hold)
    this.HoldButton(document.getElementById('headerHomeBtn'), HOLD_BACK_MS, () => {
      this.audio.playPop();
      if (this.currentScreen === 'alphabet' || this.currentScreen === 'vocab' || this.currentScreen === 'spelling') {
        this.openLessonList(this.currentScreen);
      } else if (this.currentScreen === 'handwriting') {
        this.showScreen('alphabet');
      } else if (this.currentScreen === 'story') {
        this.story.stop();
        this.showScreen('story-list');
      } else {
        this.showScreen('world-map');
      }
    });
    this.HoldButton(document.getElementById('headerParentBtn'), HOLD_BACK_MS, () => this.openParentModal());
    this.HoldButton(document.getElementById('headerStickersBtn'), HOLD_BACK_MS, () => this.openStickersModal());

    // World Map Zones (1-tap -> opens Lesson List / Story List / Exercise Hub)
    document.querySelectorAll('.zone-card').forEach(card => {
      card.addEventListener('click', () => {
        const target = card.getAttribute('data-target');
        this.audio.playPop();
        if (target === 'alphabet' || target === 'vocab' || target === 'spelling') {
          this.openLessonList(target);
        } else if (target === 'story-list') {
          this.showScreen('story-list');
        } else if (target === 'matching') {
          this.showScreen('matching');
        } else if (target === 'exercise') {
          const words = this.vocabDaysData[this.vocabDay] || [];
          this.openExerciseHub('vocab', this.vocabDay, words);
        } else if (target === 'story-bedtime') {
          this.openStory('story-bedtime');
        }
      });
    });

    // Alphabet Buttons
    // Instant 1-tap: picker, round speakers & tap-to-read texts
    document.getElementById('alphaPickerBtn')?.addEventListener('click', () => this.openDaySelectorModal('alphabet'));
    const readAlphaLetter = () => {
      const letter = this.alphabetData[this.alphabetIndex];
      if (letter) this.speakWithBtn(document.getElementById('btnListenLetter'), letter.lower);
    };
    const readAlphaWord = () => {
      const letter = this.alphabetData[this.alphabetIndex];
      if (letter) this.speakWithBtn(document.getElementById('btnListenAlphaWord'), letter.word);
    };
    const readAlphaSentence = () => {
      const letter = this.alphabetData[this.alphabetIndex];
      if (letter) this.speakWithBtn(document.getElementById('btnListenExample'), letter.sentence);
    };
    document.getElementById('btnListenLetter')?.addEventListener('click', readAlphaLetter);
    document.getElementById('alphaHeroTap')?.addEventListener('click', readAlphaLetter);
    document.getElementById('btnListenAlphaWord')?.addEventListener('click', readAlphaWord);
    document.getElementById('alphabetWord')?.addEventListener('click', readAlphaWord);
    document.getElementById('btnListenExample')?.addEventListener('click', (e) => {
      e.stopPropagation();
      readAlphaSentence();
    });
    document.getElementById('alphabetSentenceBox')?.addEventListener('click', readAlphaSentence);

    // Hold 1s (HOLD_ACTION_MS): Tập viết, Con đã đọc ✓, ◀ ▶
    this.HoldButton(document.getElementById('btnWriteLetter'), HOLD_ACTION_MS, () => {
      this.hwContext = { mode: 'alphabet', returnScreen: 'alphabet' };
      this.showScreen('handwriting');
    });
    this.HoldButton(document.getElementById('btnAlphabetDone'), HOLD_ACTION_MS, () => this.onAlphabetReadConfirmed());
    this.HoldButton(document.getElementById('alphaPrevBtn'), HOLD_ACTION_MS, () => this.prevLetter());
    this.HoldButton(document.getElementById('alphaNextBtn'), HOLD_ACTION_MS, () => this.nextLetter());

    // Vocab Buttons
    // Instant 1-tap: picker, round speakers & tap-to-read texts
    document.getElementById('vocabDayBadge')?.addEventListener('click', () => this.openDaySelectorModal('vocab'));
    const readVocabWord = () => {
      const words = this.vocabDaysData[this.vocabDay] || [];
      const currentWord = words[this.vocabWordIndex];
      if (currentWord) this.speakWithBtn(document.getElementById('btnVocabListen'), currentWord.text);
    };
    const readVocabSentence = () => {
      const words = this.vocabDaysData[this.vocabDay] || [];
      const currentWord = words[this.vocabWordIndex];
      if (currentWord) this.speakWithBtn(document.getElementById('btnVocabListenSentence'), currentWord.example);
    };
    document.getElementById('btnVocabListen')?.addEventListener('click', readVocabWord);
    document.getElementById('vocabText')?.addEventListener('click', readVocabWord);
    document.getElementById('btnVocabListenSentence')?.addEventListener('click', (e) => {
      e.stopPropagation();
      readVocabSentence();
    });
    document.getElementById('vocabSentenceBox')?.addEventListener('click', readVocabSentence);

    // Hold 1s (HOLD_ACTION_MS): Bài tập, Con đã đọc ✓, ◀ ▶
    this.HoldButton(document.getElementById('btnVocabPlayMatching'), HOLD_ACTION_MS, () => {
      const words = this.vocabDaysData[this.vocabDay] || [];
      this.openExerciseHub('vocab', this.vocabDay, words);
    });
    this.HoldButton(document.getElementById('btnVocabDone'), HOLD_ACTION_MS, () => this.onVocabReadConfirmed());
    this.HoldButton(document.getElementById('vocabPrevBtn'), HOLD_ACTION_MS, () => this.prevVocabWord());
    this.HoldButton(document.getElementById('vocabNextBtn'), HOLD_ACTION_MS, () => this.nextVocabWord());

    // Spelling Buttons
    // Instant 1-tap: picker, round speakers & tap-to-read texts
    document.getElementById('spellingDayBadge')?.addEventListener('click', () => this.openDaySelectorModal('spelling'));
    const readSpellingWord = () => {
      const dayObj = this.spellingDaysData.find(d => d.day === this.spellingDay);
      if (dayObj && dayObj.words[this.spellingWordIndex]) {
        this.speakWithBtn(document.getElementById('btnSpellingListen'), dayObj.words[this.spellingWordIndex].text);
      }
    };
    const readSpellingSentence = () => {
      const dayObj = this.spellingDaysData.find(d => d.day === this.spellingDay);
      if (dayObj && dayObj.words[this.spellingWordIndex]) {
        this.speakWithBtn(document.getElementById('btnSpellingSentence'), dayObj.words[this.spellingWordIndex].example);
      }
    };
    document.getElementById('btnSpellingListen')?.addEventListener('click', readSpellingWord);
    document.getElementById('spellingText')?.addEventListener('click', readSpellingWord);
    document.getElementById('btnSpellingSpell')?.addEventListener('click', () => this.playSpellingKaraoke());
    document.getElementById('btnSpellingSentence')?.addEventListener('click', (e) => {
      e.stopPropagation();
      readSpellingSentence();
    });
    document.getElementById('spellingSentenceBox')?.addEventListener('click', readSpellingSentence);

    // Hold 1s (HOLD_ACTION_MS): Bài tập, Con đã đọc ✓, ◀ ▶
    this.HoldButton(document.getElementById('btnSpellingPlayMatching'), HOLD_ACTION_MS, () => {
      const dayObj = this.spellingDaysData.find(d => d.day === this.spellingDay);
      this.openExerciseHub('spelling', this.spellingDay, dayObj ? dayObj.words : []);
    });
    this.HoldButton(document.getElementById('btnSpellingDone'), HOLD_ACTION_MS, () => this.onSpellingReadConfirmed());
    this.HoldButton(document.getElementById('spellingPrevBtn'), HOLD_ACTION_MS, () => this.prevSpellingWord());
    this.HoldButton(document.getElementById('spellingNextBtn'), HOLD_ACTION_MS, () => this.nextSpellingWord());

    // Swipe Left / Right (>60px) on lesson content panes
    this.bindSwipeNav(document.querySelector('#screen-alphabet .lesson-content-pane'), () => this.nextLetter(), () => this.prevLetter());
    this.bindSwipeNav(document.querySelector('#screen-vocab .lesson-content-pane'), () => this.nextVocabWord(), () => this.prevVocabWord());
    this.bindSwipeNav(document.querySelector('#screen-spelling .lesson-content-pane'), () => this.nextSpellingWord(), () => this.prevSpellingWord());

    // Exercise Hub Buttons (instant 1-tap)
    document.getElementById('exQuizBtn')?.addEventListener('click', () => {
      const ctx = this.currentExerciseContext || { module: 'vocab', day: this.vocabDay, words: this.vocabDaysData[this.vocabDay] };
      this.startQuizForSession(ctx.module, ctx.day, ctx.words);
    });
    document.getElementById('exMatchingBtn')?.addEventListener('click', () => {
      this.showScreen('matching');
    });

    // Quiz Buttons
    document.getElementById('quizSoundBtn').addEventListener('click', () => {
      const q = this.quiz.getCurrentQuestion();
      if (q && this.audio) this.audio.speak(q.spellingRead || q.targetText);
    });
    this.HoldButton(document.getElementById('quizSkipBtn'), HOLD_BACK_MS, () => {
      this.quiz.skipCurrent();
      this.renderQuizQuestion();
    });
    document.getElementById('quizNextBtn').addEventListener('click', () => this.advanceQuiz());
    this.HoldButton(document.getElementById('quizExitBtn'), HOLD_BACK_MS, () => this.showScreen('world-map'));

    // Handwriting Buttons
    // Xem mẫu & loa tên nét: instant 1-tap
    document.getElementById('hwDemoBtn').addEventListener('click', () => this.handwriting.playDemo());
    document.getElementById('hwStrokeBadge')?.addEventListener('click', () => {
      const label = this.handwriting.getCurrentStrokeLabel();
      if (label && this.audio) this.audio.speak(label);
    });
    // Xóa lại, Quay lại, Đã viết xong: Hold 1s (HOLD_ACTION_MS)
    this.HoldButton(document.getElementById('hwClearBtn'), HOLD_ACTION_MS, () => this.handwriting.clear());
    this.HoldButton(document.getElementById('hwSkipBtn'), HOLD_ACTION_MS, () => {
      const ctx = this.hwContext || { mode: 'alphabet', returnScreen: 'alphabet' };
      if (ctx.mode === 'vocab-word') {
        if (ctx.letterIndex < ctx.charSpecs.length - 1) {
          ctx.letterIndex++;
          this.renderHandwritingScreen();
          return;
        }
        const finishedWord = ctx.words[ctx.wordIndex];
        if (finishedWord) {
          this.progress.markVocabWordWritten(ctx.day, finishedWord.id);
        }
        if (ctx.wordIndex < ctx.words.length - 1) {
          this.startVocabWordWriting(ctx.day, ctx.wordIndex + 1, 0);
          return;
        }
        this.showHoldHint(`🎉 Bé đã viết xong hết từ Ngày ${ctx.day}!`);
        this.showScreen('lesson-list');
        return;
      }
      if (ctx.mode === 'alphabet-direct') {
        if (this.alphabetIndex < this.alphabetData.length - 1) {
          this.alphabetIndex++;
          this.renderHandwritingScreen();
          return;
        }
        this.showScreen('lesson-list');
        return;
      }
      this.handwriting.skip();
      this.showScreen('alphabet');
    });
    this.HoldButton(document.getElementById('hwBackBtn'), HOLD_ACTION_MS, () => {
      const ret = (this.hwContext && this.hwContext.returnScreen) || 'alphabet';
      this.showScreen(ret);
    });

    // Story Controls (Back to Story List uses 3s hold)
    this.HoldButton(document.getElementById('storyCloseBtn'), HOLD_BACK_MS, () => {
      this.story.stop();
      this.showScreen('story-list');
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

    // Victory Modal close (Hold 3s)
    this.HoldButton(document.getElementById('victoryCloseBtn'), HOLD_BACK_MS, () => this.closeVictoryModal());

    // Parent Modal handlers
    document.getElementById('parentCloseBtn').addEventListener('click', () => this.closeParentModal());
    document.getElementById('rimeWordsCloseBtn')?.addEventListener('click', () => this.closeRimeWordsModal());
    document.getElementById('rimeWordsModal')?.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'rimeWordsModal') this.closeRimeWordsModal();
    });
    document.getElementById('parentSaveBtn').addEventListener('click', () => this.saveParentSettings());
    this.HoldButton(document.getElementById('parentResetBtn'), HOLD_BACK_MS, () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến độ không?')) {
        this.progress.reset();
        this.updateHeaderStats();
        this.renderParentProgressList();
        if (this.currentScreen === 'world-map') this.renderWorldMap();
        if (this.currentScreen === 'lesson-list') this.renderLessonListScreen();
        this.closeParentModal();
        alert('Đã đặt lại tiến độ ban đầu!');
      }
    });
    document.getElementById('parentTestVoiceBtn').addEventListener('click', () => {
      const input = document.getElementById('parentChildNameInput');
      const testName = this.progress.normalizeChildName(input ? input.value : '');
      if (input) input.value = testName;
      if (this.audio) {
        const prevName = this.audio.childName;
        this.audio.setChildName(testName);
        this.audio.speak(`Xin chào ${testName}!`, { forceSpeechSynthesis: testName !== 'Bé Mây' }).finally(() => {
          this.audio.setChildName(prevName);
        });
      }
    });

    // Parent Progress 3-Tab Switcher & Bulk Actions
    document.querySelectorAll('.parent-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.parentProgressTab = btn.getAttribute('data-p-tab') || 'alphabet';
        document.querySelectorAll('.parent-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.renderParentProgressList();
      });
    });
    document.getElementById('parentMarkAllBtn')?.addEventListener('click', () => {
      const keys = this.getKeysForModule(this.parentProgressTab);
      this.progress.setAllManualStatus(this.parentProgressTab, keys, true);
      this.renderParentProgressList();
      if (this.currentScreen === 'world-map') this.renderWorldMap();
      if (this.currentScreen === 'lesson-list') this.renderLessonListScreen();
    });
    document.getElementById('parentUnmarkAllBtn')?.addEventListener('click', () => {
      const keys = this.getKeysForModule(this.parentProgressTab);
      this.progress.setAllManualStatus(this.parentProgressTab, keys, false);
      this.renderParentProgressList();
      if (this.currentScreen === 'world-map') this.renderWorldMap();
      if (this.currentScreen === 'lesson-list') this.renderLessonListScreen();
    });

    // Matching Game Buttons
    const matchBack = document.getElementById('matchingBackBtn');
    if (matchBack) this.bindHoldAction(matchBack, () => this.showScreen('world-map'), 3000);
    const matchReset = document.getElementById('matchingResetBtn');
    if (matchReset) matchReset.addEventListener('click', () => this.renderMatchingGameScreen());

    // Game Choice Modal Buttons (HoldButton 1s / 3s, no direct click)
    this.HoldButton(document.getElementById('choiceExerciseBtn'), HOLD_ACTION_MS, () => {
      document.getElementById('gameChoiceModal').style.display = 'none';
      const s = this.currentQuizSession || { module: 'vocab', day: this.vocabDay, words: this.vocabDaysData[this.vocabDay] };
      this.openExerciseHub(s.module, s.day, s.words || this.vocabDaysData[this.vocabDay]);
    });

    this.HoldButton(document.getElementById('choiceNextDayBtn'), HOLD_ACTION_MS, () => {
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

    this.HoldButton(document.getElementById('choiceRestartBtn'), HOLD_ACTION_MS, () => {
      document.getElementById('gameChoiceModal').style.display = 'none';
      const s = this.currentQuizSession || { module: 'vocab' };
      if (s.module === 'alphabet') {
        this.alphabetIndex = 0;
        this.showScreen('alphabet');
      } else if (s.module === 'vocab') {
        this.vocabDay = 1;
        this.vocabWordIndex = 0;
        this.showScreen('vocab');
      } else {
        this.spellingDay = 1;
        this.spellingWordIndex = 0;
        this.showScreen('spelling');
      }
    });

    this.HoldButton(document.getElementById('choiceMapBtn'), HOLD_BACK_MS, () => {
      document.getElementById('gameChoiceModal').style.display = 'none';
      const s = this.currentQuizSession || { module: 'vocab' };
      this.openLessonList(s.module || 'vocab');
    });

    // Victory Next Day & Restart buttons (HoldButton 1s)
    this.HoldButton(document.getElementById('victoryNextDayBtn'), HOLD_ACTION_MS, () => {
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

    this.HoldButton(document.getElementById('victoryRestartBtn'), HOLD_ACTION_MS, () => {
      document.getElementById('victoryModal').style.display = 'none';
      const s = this.currentQuizSession || { module: 'vocab' };
      if (s.module === 'vocab') {
        this.vocabDay = 1;
        this.vocabWordIndex = 0;
        this.showScreen('vocab');
      } else {
        this.spellingDay = 1;
        this.spellingWordIndex = 0;
        this.showScreen('spelling');
      }
    });

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
      subEl.textContent = 'Chạm vào ngày bất kỳ để cùng Bé Mây học các từ vựng mới';

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
      titleEl.textContent = '🏰 Lâu Đài Đánh Vần — 21 Ngày Học';
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
          <div class="day-card-topic">${this.renderEmojiHtml(letter.emoji)} ${letter.word}</div>
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
  getKeysForModule(mod) {
    if (mod === 'alphabet') return this.alphabetData.map(l => l.id);
    if (mod === 'vocab') return Object.keys(this.vocabDaysData).map(k => parseInt(k, 10)).sort((a, b) => a - b);
    if (mod === 'spelling') return this.spellingDaysData.map(d => d.day);
    return [];
  }

  openParentModal() {
    const modal = document.getElementById('parentModal');
    if (!modal) return;
    document.getElementById('parentChildNameInput').value = this.progress.getChildName();
    const hwSel = document.getElementById('parentHwDifficulty');
    if (hwSel) hwSel.value = this.progress.getHandwritingDifficulty();
    this.renderParentProgressList();
    modal.style.display = 'flex';
  }

  renderParentProgressList() {
    const listEl = document.getElementById('parentProgressList');
    if (!listEl) return;
    listEl.innerHTML = '';
    const mod = this.parentProgressTab || 'alphabet';

    const addRow = (label, isDone, onToggle) => {
      const row = document.createElement('label');
      row.className = 'parent-progress-row';
      row.innerHTML = `<span>${label}</span><input type="checkbox" ${isDone ? 'checked' : ''}>`;
      const cb = row.querySelector('input');
      cb.addEventListener('change', () => {
        onToggle(cb.checked);
        if (this.currentScreen === 'world-map') this.renderWorldMap();
        if (this.currentScreen === 'lesson-list') this.renderLessonListScreen();
      });
      listEl.appendChild(row);
    };

    if (mod === 'alphabet') {
      this.alphabetData.forEach(l => {
        const isDone = this.progress.getLessonStatus('alphabet', l.id, 1) === 'done';
        addRow(`Chữ ${l.lower} (${l.upper}) — ${l.word}`, isDone, (checked) => {
          this.progress.setManualStatus('alphabet', l.id, checked);
        });
      });
    } else if (mod === 'vocab') {
      const days = this.getKeysForModule('vocab');
      days.forEach(day => {
        const words = this.vocabDaysData[day] || [];
        const firstW = words[0] || {};
        const isDone = this.progress.getLessonStatus('vocab', day, words.length) === 'done';
        addRow(`Ngày ${day} (${firstW.group || firstW.topic || ''})`, isDone, (checked) => {
          this.progress.setManualStatus('vocab', day, checked);
        });
      });
    } else if (mod === 'spelling') {
      this.spellingDaysData.forEach(d => {
        const isDone = this.progress.getLessonStatus('spelling', d.day, d.words.length) === 'done';
        addRow(`Ngày ${d.day}: ${d.title}`, isDone, (checked) => {
          this.progress.setManualStatus('spelling', d.day, checked);
        });
      });
    }
  }

  saveParentSettings() {
    const rawName = document.getElementById('parentChildNameInput').value;
    const savedName = this.progress.setChildName(rawName);
    if (this.audio) this.audio.setChildName(savedName);
    const hwSel = document.getElementById('parentHwDifficulty');
    if (hwSel) {
      const diff = this.progress.setHandwritingDifficulty(hwSel.value);
      if (this.handwriting) this.handwriting.setDifficulty(diff);
    }
    if (this.currentScreen === 'world-map') this.renderWorldMap();
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
