const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Setup mock window to load data files
global.window = {};
require('./js/data/alphabet.js');
require('./js/data/vocab.js');
require('./js/data/spelling.js');
require('./js/data/feedback.js');
require('./js/data/stories.js');

const CACHE_DIR = path.join(__dirname, 'audio_cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Phonetic overrides matching AudioService
const TTS_OVERRIDES = {
  'ă': 'á',
  'â': 'ớ',
  'y': 'i',
  'ca': 'ca',
  'k': 'ca',
  'q': 'quờ',
  'qu': 'quờ',
  'p': 'pờ',
  'b': 'bờ',
  'c': 'cờ',
  'd': 'dờ',
  'đ': 'đờ',
  'g': 'gờ',
  'h': 'hờ',
  'l': 'lờ',
  'm': 'mờ',
  'n': 'nờ',
  'r': 'rờ',
  's': 'sờ',
  't': 'tờ',
  'v': 'vờ',
  'x': 'xờ',
  'ch': 'chờ',
  'kh': 'khờ',
  'nh': 'nhờ',
  'ng': 'ngờ',
  'ngh': 'ngờ',
  'ph': 'phờ',
  'th': 'thờ',
  'tr': 'trờ',
  'gh': 'gờ',
  'gi': 'giờ'
};

function getCleanText(rawText) {
  if (!rawText) return '';
  let t = rawText.trim();
  const lower = t.toLowerCase();
  if (TTS_OVERRIDES[lower]) {
    t = TTS_OVERRIDES[lower];
  }
  return t;
}

const phrases = new Set();
const rawToCleanMap = {};

function addPhrase(text) {
  if (!text) return;
  const raw = text.trim();
  const clean = getCleanText(text);
  if (clean && clean.length > 0) {
    phrases.add(clean);
    rawToCleanMap[raw] = clean;
    rawToCleanMap[raw.toLowerCase()] = clean;
  }
}

// 1. Alphabet
window.MagicWorld.Alphabet.forEach(a => {
  addPhrase(a.sound);
  addPhrase(a.name);
  addPhrase(a.lower);
  addPhrase(a.word);
  addPhrase(a.sentence);
});

// 2. Vocabulary (304 words & sentences)
window.MagicWorld.VocabList.forEach(v => {
  addPhrase(v.text);
  addPhrase(v.example);
});

// 3. Spelling (112 words, sentences, breakdowns)
window.MagicWorld.SpellingDays.forEach(d => {
  d.words.forEach(w => {
    addPhrase(w.text);
    addPhrase(w.example);
    const readStr = w.spellingRead || w.read;
    if (readStr) {
      addPhrase(readStr);
      readStr.split('|').forEach(part => {
        addPhrase(part.trim());
        part.split('-').forEach(tok => addPhrase(tok.trim()));
      });
    }
    if (w.chips) {
      w.chips.forEach(c => addPhrase(c.text));
    }
  });
});

// 4. Feedback phrases
const fb = window.MagicWorld.Feedback || {};
(fb.praise || []).forEach(p => addPhrase(p));
(fb.wrong || []).forEach(p => addPhrase(p));

// 5. Stories lines
(window.MagicWorld.Stories || []).forEach(s => {
  (s.scenes || []).forEach(sc => {
    (sc.lines || []).forEach(l => addPhrase(l.text));
  });
});

console.log(`Total unique phrases to cache: ${phrases.size}`);

const list = Array.from(phrases);

function downloadTts(cleanText) {
  return new Promise((resolve) => {
    const hash = crypto.createHash('md5').update(cleanText).digest('hex');
    const cacheFile = path.join(CACHE_DIR, `${hash}.mp3`);

    if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 100) {
      return resolve({ text: cleanText, hash, status: 'cached' });
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    const req = https.get(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        return resolve({ text: cleanText, hash, status: 'error', code: res.statusCode });
      }

      const fileStream = fs.createWriteStream(cacheFile);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve({ text: cleanText, hash, status: 'downloaded' });
      });
      fileStream.on('error', () => {
        resolve({ text: cleanText, hash, status: 'error' });
      });
    });

    req.on('error', () => {
      resolve({ text: cleanText, hash, status: 'error' });
    });
  });
}

async function run() {
  let done = 0;
  let downloadedCount = 0;
  const cleanToPath = {};

  const CONCURRENCY = 6;
  const queue = [...list];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      const res = await downloadTts(item);
      cleanToPath[item] = 'audio_cache/' + res.hash + '.mp3';
      done++;
      if (res.status === 'downloaded') downloadedCount++;
      if (done % 50 === 0 || queue.length === 0) {
        console.log(`Progress: ${done}/${list.length} (New downloaded: ${downloadedCount})`);
      }
      await new Promise(r => setTimeout(r, 60));
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  // Build complete manifest with aliases
  const finalManifest = {};
  // 1. Direct clean text
  for (const [clean, p] of Object.entries(cleanToPath)) {
    finalManifest[clean] = p;
  }
  // 2. Raw and lowercase mappings
  for (const [raw, clean] of Object.entries(rawToCleanMap)) {
    if (cleanToPath[clean]) {
      finalManifest[raw] = cleanToPath[clean];
    }
  }

  // Write js/data/audioManifest.js
  const manifestContent = `// Magic World Audio Manifest (Static Pre-cached Vietnamese Audio)
window.MagicWorld = window.MagicWorld || {};
window.MagicWorld.AudioManifest = ${JSON.stringify(finalManifest)};
`;
  fs.writeFileSync(path.join('js', 'data', 'audioManifest.js'), manifestContent, 'utf8');
  console.log(`COMPLETED! Generated audioManifest.js with ${Object.keys(finalManifest).length} mappings.`);
}

run().catch(console.error);
