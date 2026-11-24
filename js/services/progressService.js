// Magic World Progress & Storage Service
window.MagicWorld = window.MagicWorld || {};

class ProgressService {
  constructor() {
    this.storageKey = 'magic_world_progress_v2';
    this.stickersPool = [
      { id: 'stk_crown', name: 'Vương miện công chúa', emoji: '👑' },
      { id: 'stk_lumi', name: 'Linh thú Lumi', emoji: '🦄' },
      { id: 'stk_star', name: 'Ngôi sao pha lê', emoji: '⭐' },
      { id: 'stk_crystal', name: 'Khối băng ngọc', emoji: '💎' },
      { id: 'stk_snow', name: 'Bông tuyết trắng', emoji: '❄️' },
      { id: 'stk_flower', name: 'Hoa tuyết mùa xuân', emoji: '🌸' },
      { id: 'stk_castle', name: 'Lâu đài Băng Lam', emoji: '🏰' },
      { id: 'stk_rainbow', name: 'Cầu vồng cực quang', emoji: '🌈' },
      { id: 'stk_fairy', name: 'Cô Sao Băng', emoji: '🧚' },
      { id: 'stk_heart', name: 'Trái tim ấm áp', emoji: '💖' },
      { id: 'stk_butterfly', name: 'Bướm tuyết', emoji: '🦋' },
      { id: 'stk_bunny', name: 'Thỏ tuyết', emoji: '🐰' }
    ];

    this.data = this.load();
  }

  getDefaultData() {
    return {
      childName: "Bé Mây",
      snowflakes: 0,
      totalStars: 0,
      unlockedStickers: ['stk_snow'],
      listenedStories: [],
      letters: {}, // { 'a': { read: true, written: true } }
      vocabProgress: {}, // { '1': { completedWords: ['vocab_ba'], stars: 3, score: 10 } }
      spellingProgress: {}, // { '1': { completedWords: ['spell_d1_1'], stars: 2, score: 9 } }
      settings: {
        voiceRate: 0.9,
        voicePitch: 1.0,
        sfxVolume: 0.9,
        bgmEnabled: false
      }
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        return { ...this.getDefaultData(), ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
    return this.getDefaultData();
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  reset() {
    this.data = this.getDefaultData();
    this.save();
  }

  getChildName() {
    return this.data.childName || "Bé Mây";
  }

  setChildName(name) {
    if (name && name.trim()) {
      this.data.childName = name.trim();
      this.save();
    }
  }

  addSnowflakes(amount = 1) {
    this.data.snowflakes = (this.data.snowflakes || 0) + amount;
    this.save();
    return this.data.snowflakes;
  }

  // Letters
  markLetterRead(id) {
    if (!this.data.letters[id]) this.data.letters[id] = {};
    this.data.letters[id].read = true;
    this.addSnowflakes(1);
    this.save();
  }

  markLetterWritten(id) {
    if (!this.data.letters[id]) this.data.letters[id] = {};
    this.data.letters[id].written = true;
    this.addSnowflakes(2);
    this.save();
  }

  isLetterComplete(id) {
    return !!(this.data.letters[id] && (this.data.letters[id].read || this.data.letters[id].written));
  }

  // Vocabulary words
  markVocabWordRead(day, wordId) {
    if (!this.data.vocabProgress[day]) {
      this.data.vocabProgress[day] = { completedWords: [], stars: 0, score: 0 };
    }
    const list = this.data.vocabProgress[day].completedWords;
    if (!list.includes(wordId)) {
      list.push(wordId);
      this.addSnowflakes(1);
      this.save();
    }
  }

  getVocabDayProgress(day) {
    return this.data.vocabProgress[day] || { completedWords: [], stars: 0, score: 0 };
  }

  // Spelling words
  markSpellingWordRead(day, wordId) {
    if (!this.data.spellingProgress[day]) {
      this.data.spellingProgress[day] = { completedWords: [], stars: 0, score: 0 };
    }
    const list = this.data.spellingProgress[day].completedWords;
    if (!list.includes(wordId)) {
      list.push(wordId);
      this.addSnowflakes(1);
      this.save();
    }
  }

  getSpellingDayProgress(day) {
    return this.data.spellingProgress[day] || { completedWords: [], stars: 0, score: 0 };
  }

  // Quiz completion and star calculation
  recordQuizResult(moduleName, day, score, totalQuestions, firstTryCount) {
    // Star logic per SPEC-07:
    // ⭐: read all 8 words
    // ⭐⭐: finished quiz
    // ⭐⭐⭐: right on first try >= 8 / 10
    let stars = 1;
    if (score >= totalQuestions) {
      stars = 2;
    }
    if (firstTryCount >= 8) {
      stars = 3;
    }

    const targetObj = moduleName === 'vocab' ? this.data.vocabProgress : this.data.spellingProgress;
    if (!targetObj[day]) {
      targetObj[day] = { completedWords: [], stars: 0, score: 0 };
    }

    // Keep highest stars and score
    if (stars > (targetObj[day].stars || 0)) {
      const starDiff = stars - (targetObj[day].stars || 0);
      this.data.totalStars = (this.data.totalStars || 0) + starDiff;
      targetObj[day].stars = stars;
    }
    if (score > (targetObj[day].score || 0)) {
      targetObj[day].score = score;
    }

    // Reward random sticker if 3 stars or complete
    const newSticker = this.awardRandomSticker();
    this.addSnowflakes(stars * 2);
    this.save();

    return { stars, score, newSticker };
  }

  awardRandomSticker() {
    const unearned = this.stickersPool.filter(s => !this.data.unlockedStickers.includes(s.id));
    if (unearned.length > 0) {
      const chosen = unearned[Math.floor(Math.random() * unearned.length)];
      this.data.unlockedStickers.push(chosen.id);
      this.save();
      return chosen;
    }
    return null;
  }

  // Stories
  markStoryListened(storyId) {
    if (!this.data.listenedStories.includes(storyId)) {
      this.data.listenedStories.push(storyId);
      this.addSnowflakes(2);
      const sticker = this.awardRandomSticker();
      this.save();
      return sticker;
    }
    return null;
  }

  getUnlockedStickers() {
    return this.stickersPool.filter(s => this.data.unlockedStickers.includes(s.id));
  }
}

window.MagicWorld.ProgressService = new ProgressService();
