const fs = require('fs');

// Mock window
global.window = {};
require('./js/data/emojiMap.js');
require('./js/data/spelling.js');
require('./js/data/vocab.js');

console.log('=== SPELLING WORDS WITH SPARKLE OR MISSING EMOJI ===');
const spellingDays = window.MagicWorld.SpellingDays;
spellingDays.forEach(d => {
  d.words.forEach(w => {
    if (!w.emoji || w.emoji === '✨') {
      console.log(`Spelling Day ${d.day} (${d.title}): word '${w.text}', initial '${w.initial}', rime '${w.rime}', tone '${w.tone}'`);
    }
  });
});

console.log('\n=== VOCAB WORDS WITH SPARKLE OR MISSING EMOJI (first 10 days) ===');
const vocabDays = window.MagicWorld.VocabDays;
for (let d = 1; d <= 38; d++) {
  const words = vocabDays[d] || [];
  words.forEach(w => {
    if (!w.emoji || w.emoji === '✨') {
      console.log(`Vocab Day ${d}: word '${w.text}', topic '${w.topic}'`);
    }
  });
}
