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
      { id: 'stk_castle', name: 'Lâu đài Băng Giá', emoji: '🏰' },
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
      manualOverrides: { alphabet: {}, vocab: {}, spelling: {} },
      settings: {
        voiceRate: 0.9,
        voicePitch: 1.0,
        sfxVolume: 0.9,
        bgmEnabled: false,
        handwritingDifficulty: 'easy'
      }
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = { ...this.getDefaultData(), ...JSON.parse(raw) };
        this.migrateSpellingProgress(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
    return this.getDefaultData();
  }

  // Preserve Day 1 (8->9 words) and Day 12 (replaced words) completion across data update
  migrateSpellingProgress(data) {
    if (!data || data.spellingMigrationV15) return;
    const sp = data.spellingProgress || {};
    if (sp['1'] && Array.isArray(sp['1'].completedWords) && sp['1'].completedWords.length >= 8) {
      sp['1'].completedLegacy = true;
    }
    if (sp['12'] && Array.isArray(sp['12'].completedWords)) {
      if (sp['12'].completedWords.length >= 8) {
        sp['12'].completedLegacy = true;
      }
      const keptDay12Ids = new Set(['spell_d12_3', 'spell_d12_5', 'spell_d12_7']);
      sp['12'].completedWords = sp['12'].completedWords.filter(id => keptDay12Ids.has(id));
    }
    data.spellingMigrationV15 = true;
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

  getHandwritingDifficulty() {
    const val = this.data.settings && this.data.settings.handwritingDifficulty;
    return ['easy', 'medium', 'hard'].includes(val) ? val : 'easy';
  }

  setHandwritingDifficulty(level) {
    const valid = ['easy', 'medium', 'hard'].includes(level) ? level : 'easy';
    this.data.settings = this.data.settings || {};
    this.data.settings.handwritingDifficulty = valid;
    this.save();
    return valid;
  }

  normalizeChildName(name) {
    if (!name || typeof name !== 'string') return 'Bé Mây';
    let cleaned = name.trim();
    if (cleaned.normalize) cleaned = cleaned.normalize('NFC');
    if (cleaned.length > 20) cleaned = cleaned.slice(0, 20).trim();
    return cleaned || 'Bé Mây';
  }

  getChildName() {
    return this.normalizeChildName(this.data.childName || 'Bé Mây');
  }

  setChildName(name) {
    const normalized = this.normalizeChildName(name);
    this.data.childName = normalized;
    this.save();
    return normalized;
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
    if (this.data.manualOverrides && this.data.manualOverrides.alphabet && this.data.manualOverrides.alphabet[id] === false) {
      delete this.data.manualOverrides.alphabet[id];
    }
    this.addSnowflakes(1);
    this.save();
  }

  markLetterWritten(id) {
    if (!this.data.letters[id]) this.data.letters[id] = {};
    this.data.letters[id].written = true;
    if (this.data.manualOverrides && this.data.manualOverrides.alphabet && this.data.manualOverrides.alphabet[id] === false) {
      delete this.data.manualOverrides.alphabet[id];
    }
    this.addSnowflakes(2);
    this.save();
  }

  isLetterComplete(id) {
    const ov = this.data.manualOverrides && this.data.manualOverrides.alphabet && this.data.manualOverrides.alphabet[id];
    if (typeof ov === 'boolean') return ov;
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
      if (this.data.manualOverrides && this.data.manualOverrides.vocab && this.data.manualOverrides.vocab[day] === false) {
        delete this.data.manualOverrides.vocab[day];
      }
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
      if (this.data.manualOverrides && this.data.manualOverrides.spelling && this.data.manualOverrides.spelling[day] === false) {
        delete this.data.manualOverrides.spelling[day];
      }
      this.addSnowflakes(1);
      this.save();
    }
  }

  getSpellingDayProgress(day) {
    return this.data.spellingProgress[day] || { completedWords: [], stars: 0, score: 0 };
  }

  // Unified lesson status ('done' | 'in_progress' | 'todo') honoring manualOverrides
  getLessonStatus(module, key, totalItems = 8) {
    const ovMap = (this.data.manualOverrides && this.data.manualOverrides[module]) || {};
    if (ovMap[key] === true) return 'done';
    if (ovMap[key] === false) return 'todo';

    if (module === 'alphabet') {
      return (this.data.letters[key] && (this.data.letters[key].read || this.data.letters[key].written)) ? 'done' : 'todo';
    }
    const prog = module === 'vocab' ? this.getVocabDayProgress(key) : this.getSpellingDayProgress(key);
    if (module === 'spelling' && prog.completedLegacy) return 'done';
    const count = (prog.completedWords || []).length;
    if (count >= totalItems && totalItems > 0) return 'done';
    if (count > 0) return 'in_progress';
    return 'todo';
  }

  setManualStatus(module, key, isDone) {
    if (!this.data.manualOverrides) this.data.manualOverrides = { alphabet: {}, vocab: {}, spelling: {} };
    if (!this.data.manualOverrides[module]) this.data.manualOverrides[module] = {};
    this.data.manualOverrides[module][key] = !!isDone;
    this.save();
  }

  setAllManualStatus(module, keys, isDone) {
    if (!this.data.manualOverrides) this.data.manualOverrides = { alphabet: {}, vocab: {}, spelling: {} };
    if (!this.data.manualOverrides[module]) this.data.manualOverrides[module] = {};
    keys.forEach(k => {
      this.data.manualOverrides[module][k] = !!isDone;
    });
    this.save();
  }

  // Quiz completion and star calculation
  recordQuizResult(moduleName, day, score, totalQuestions, firstTryCount) {
    // Star logic:
    // ⭐: read all 8 words
    // ⭐⭐: finished quiz
    // ⭐⭐⭐: right on first try >= 80% (e.g. 7/8 or 8/8)
    let stars = 1;
    if (score >= totalQuestions) {
      stars = 2;
    }
    if (firstTryCount >= Math.ceil(totalQuestions * 0.8)) {
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
