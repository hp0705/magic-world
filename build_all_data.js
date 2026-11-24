const fs = require('fs');
const path = require('path');

// 1. Process emoji-map and story-art-emoji
const emojiMapRaw = JSON.parse(fs.readFileSync('emoji-map.json', 'utf8'));
const storyArtRaw = JSON.parse(fs.readFileSync('story-art-emoji.json', 'utf8'));
const vocabDaysRaw = JSON.parse(fs.readFileSync('vocab-days.json', 'utf8'));

// Merge any emojis found in vocab-days into emojiMap
const wordsMap = { ...emojiMapRaw.words };

// Enhanced child-friendly emojis for all abstract / missing cases
const ENHANCED_CHILD_EMOJIS = {
  'hổ': { emoji: '🐯', quiz: true },
  'nơ': { emoji: '🎀', quiz: true },
  'bể': { emoji: '🐠', quiz: true },
  'bi': { emoji: '🔮', quiz: true },
  'ngửi': { emoji: '👃', quiz: true },
  'kêu': { emoji: '🦆', quiz: true },
  'xíu': { emoji: '🧁', quiz: true },
  'lựu': { emoji: '🍎', quiz: true },
  'bàn': { emoji: '🪵', quiz: true },
  'võng': { emoji: '🏕️', quiz: true },
  'xanh': { emoji: '🍏', quiz: true },
  'bác': { emoji: '👨‍🦳', quiz: true },
  'mặc': { emoji: '🧥', quiz: true },
  'hót': { emoji: '🐦', quiz: true },
  'đạp': { emoji: '🚲', quiz: true },
  'tập': { emoji: '✍️', quiz: true },
  'búp': { emoji: '🪆', quiz: true },
  'mía': { emoji: '🎋', quiz: true },
  'chia': { emoji: '🍰', quiz: true },
  'tỏa': { emoji: '☀️', quiz: true },
  'khoe': { emoji: '👗', quiz: true },
  'xòe': { emoji: '🦚', quiz: true },
  'huệ': { emoji: '🪷', quiz: true },
  'khuy': { emoji: '🔘', quiz: true },
  'ngoan': { emoji: '👧', quiz: true },
  'xoải': { emoji: '🦅', quiz: true },
  'khuấy': { emoji: '🥛', quiz: true },
  'chuyện': { emoji: '📖', quiz: true },
  'quạt': { emoji: '🪭', quiz: true },
  'cổng': { emoji: '🚪', quiz: true },
  'phòng': { emoji: '🛋️', quiz: true },
  'na': { emoji: '🍈', quiz: true },
  'đẹp': { emoji: '👗', quiz: true }
};
Object.assign(wordsMap, ENHANCED_CHILD_EMOJIS);

vocabDaysRaw.items.forEach(item => {
  if (item.text && item.emoji && !wordsMap[item.text]) {
    wordsMap[item.text] = {
      emoji: item.emoji,
      quiz: item.emoji_quality !== 'weak'
    };
  }
});

// Write js/data/emojiMap.js
const emojiMapContent = `// Magic World Emoji Database
window.MagicWorld = window.MagicWorld || {};
window.MagicWorld.EmojiMap = ${JSON.stringify(wordsMap, null, 2)};
window.MagicWorld.StoryArtEmoji = ${JSON.stringify(storyArtRaw, null, 2)};
`;
fs.writeFileSync(path.join('js', 'data', 'emojiMap.js'), emojiMapContent, 'utf8');
console.log('Written emojiMap.js with', Object.keys(wordsMap).length, 'words');

// 2. Write js/data/alphabet.js
const ALPHABET_DATA = [
  { id: 'a', lower: 'a', upper: 'A', name: 'a', sound: 'a', word: 'áo', sentence: 'Bé Mây mặc chiếc áo ấm.', emoji: '🧥' },
  { id: 'aw', lower: 'ă', upper: 'Ă', name: 'á', sound: 'á', word: 'ăn', sentence: 'Bé Mây ăn cơm thật ngon.', emoji: '🍚' },
  { id: 'aa', lower: 'â', upper: 'Â', name: 'ớ', sound: 'ớ', word: 'ấm', sentence: 'Bình nước ấm của Bé Mây.', emoji: '🫖' },
  { id: 'b', lower: 'b', upper: 'B', name: 'bờ', sound: 'bờ', word: 'ba', sentence: 'Ba nắm tay Bé Mây đi chơi.', emoji: '👨' },
  { id: 'c', lower: 'c', upper: 'C', name: 'cờ', sound: 'cờ', word: 'cá', sentence: 'Bé Mây ngắm chú cá bơi.', emoji: '🐟' },
  { id: 'd', lower: 'd', upper: 'D', name: 'dờ', sound: 'dờ', word: 'dép', sentence: 'Bé Mây tự đi đôi dép nhỏ.', emoji: '🩴' },
  { id: 'dd', lower: 'đ', upper: 'Đ', name: 'đờ', sound: 'đờ', word: 'đèn', sentence: 'Bé Mây bật đèn sáng trong phòng.', emoji: '💡' },
  { id: 'e', lower: 'e', upper: 'E', name: 'e', sound: 'e', word: 'em', sentence: 'Bé Mây chơi cùng em nhỏ.', emoji: '👶' },
  { id: 'ee', lower: 'ê', upper: 'Ê', name: 'ê', sound: 'ê', word: 'ếch', sentence: 'Chú ếch nhảy trên lá sen.', emoji: '🐸' },
  { id: 'g', lower: 'g', upper: 'G', name: 'gờ', sound: 'gờ', word: 'gà', sentence: 'Chú gà gọi Bé Mây thức dậy.', emoji: '🐔' },
  { id: 'h', lower: 'h', upper: 'H', name: 'hờ', sound: 'hờ', word: 'hoa', sentence: 'Bé Mây tưới bông hoa xinh.', emoji: '🌸' },
  { id: 'i', lower: 'i', upper: 'I', name: 'i', sound: 'i', word: 'bi', sentence: 'Bé Mây có viên bi tròn.', emoji: '⚪' },
  { id: 'k', lower: 'k', upper: 'K', name: 'ca', sound: 'ca', word: 'kem', sentence: 'Bé Mây ăn que kem mát lạnh.', emoji: '🍦' },
  { id: 'l', lower: 'l', upper: 'L', name: 'lờ', sound: 'lờ', word: 'lá', sentence: 'Bé Mây nhặt chiếc lá xanh.', emoji: '🍃' },
  { id: 'm', lower: 'm', upper: 'M', name: 'mờ', sound: 'mờ', word: 'mẹ', sentence: 'Mẹ ôm Bé Mây thật chặt.', emoji: '👩' },
  { id: 'n', lower: 'n', upper: 'N', name: 'nờ', sound: 'nờ', word: 'na', sentence: 'Mẹ gọt quả na cho Bé Mây.', emoji: '🍈' },
  { id: 'o', lower: 'o', upper: 'O', name: 'o', sound: 'o', word: 'ong', sentence: 'Chú ong bay quanh bông hoa.', emoji: '🐝' },
  { id: 'oo', lower: 'ô', upper: 'Ô', name: 'ô', sound: 'ô', word: 'ô tô', sentence: 'Bé Mây đi chơi bằng ô tô.', emoji: '🚗' },
  { id: 'ow', lower: 'ơ', upper: 'Ơ', name: 'ơ', sound: 'ơ', word: 'ớt', sentence: 'Bé Mây thấy quả ớt đỏ.', emoji: '🌶️' },
  { id: 'p', lower: 'p', upper: 'P', name: 'pờ', sound: 'pờ', word: 'pin', sentence: 'Bé Mây lắp pin cho xe đồ chơi.', emoji: '🔋' },
  { id: 'q', lower: 'q', upper: 'Q', name: 'quờ', sound: 'quờ', word: 'quà', sentence: 'Bé Mây mở hộp quà bất ngờ.', emoji: '🎁' },
  { id: 'r', lower: 'r', upper: 'R', name: 'rờ', sound: 'rờ', word: 'rau', sentence: 'Bé Mây ăn rau xanh rất giỏi.', emoji: '🥬' },
  { id: 's', lower: 's', upper: 'S', name: 'sờ', sound: 'sờ', word: 'sao', sentence: 'Bé Mây ngắm ngôi sao lấp lánh.', emoji: '⭐' },
  { id: 't', lower: 't', upper: 'T', name: 'tờ', sound: 'tờ', word: 'táo', sentence: 'Bé Mây ăn quả táo đỏ giòn.', emoji: '🍎' },
  { id: 'u', lower: 'u', upper: 'U', name: 'u', sound: 'u', word: 'tủ', sentence: 'Bé Mây cất quần áo vào tủ.', emoji: '🚪' },
  { id: 'uw', lower: 'ư', upper: 'Ư', name: 'ư', sound: 'ư', word: 'thư', sentence: 'Bé Mây gửi lá thư cho bà.', emoji: '✉️' },
  { id: 'v', lower: 'v', upper: 'V', name: 'vờ', sound: 'vờ', word: 'voi', sentence: 'Chú voi vẫy tai chào Bé Mây.', emoji: '🐘' },
  { id: 'x', lower: 'x', upper: 'X', name: 'xờ', sound: 'xờ', word: 'xe', sentence: 'Bé Mây ngồi xe đi dạo phố.', emoji: '🚲' },
  { id: 'y', lower: 'y', upper: 'Y', name: 'i dài', sound: 'i', word: 'y tá', sentence: 'Cô y tá khen Bé Mây ngoan.', emoji: '🧑‍⚕️' }
];

const alphabetFileContent = `// Magic World Alphabet (29 letters)
window.MagicWorld = window.MagicWorld || {};
window.MagicWorld.Alphabet = ${JSON.stringify(ALPHABET_DATA, null, 2)};
`;
fs.writeFileSync(path.join('js', 'data', 'alphabet.js'), alphabetFileContent, 'utf8');
console.log('Written alphabet.js with', ALPHABET_DATA.length, 'letters');

// 3. Write js/data/vocab.js
// Group 304 items into 38 days
const daysMap = {};
for (let d = 1; d <= 38; d++) {
  daysMap[d] = [];
}
vocabDaysRaw.items.forEach(item => {
  const emojiInfo = wordsMap[item.text] || { emoji: item.emoji || '✨', quiz: item.emoji_quality !== 'weak' };
  item.emoji = emojiInfo.emoji || item.emoji || '✨';
  item.quiz = emojiInfo.quiz !== false && item.emoji_quality !== 'weak';
  daysMap[item.day].push({
    id: item.id,
    day: item.day,
    order: item.order,
    group: item.group,
    text: item.text,
    letterCount: item.letter_count,
    syllableCount: item.syllable_count,
    topic: item.topic,
    example: item.example,
    emoji: item.emoji,
    quiz: item.quiz
  });
});

const vocabFileContent = `// Magic World Vocabulary (38 Days, 304 Words)
window.MagicWorld = window.MagicWorld || {};
window.MagicWorld.VocabDays = ${JSON.stringify(daysMap, null, 2)};
window.MagicWorld.VocabList = ${JSON.stringify(vocabDaysRaw.items, null, 2)};
`;
fs.writeFileSync(path.join('js', 'data', 'vocab.js'), vocabFileContent, 'utf8');
console.log('Written vocab.js with 38 days');

// 4. SPELLING DAYS (14 Days, 112 Words)
const SPELLING_DAYS = [
  {
    day: 1,
    title: "Nhóm vần mở",
    rimeIntro: ["a", "e", "ê", "i", "o", "ô", "ơ", "ư"],
    words: [
      { text: "cá", rime: "a", initial: "c", tone: "sắc", read: "cờ - a - ca | sắc - cá", example: "Bé Mây xem chú cá bơi." },
      { text: "xe", rime: "e", initial: "x", tone: "ngang", read: "xờ - e - xe", example: "Bé Mây đi xe đồ chơi." },
      { text: "bể", rime: "ê", initial: "b", tone: "hỏi", read: "bờ - ê - bê | hỏi - bể", example: "Bé Mây ngắm cá trong bể." },
      { text: "bi", rime: "i", initial: "b", tone: "ngang", read: "bờ - i - bi", example: "Bé Mây có viên bi tròn." },
      { text: "bò", rime: "o", initial: "b", tone: "huyền", read: "bờ - o - bo | huyền - bò", example: "Chú bò ăn cỏ trên đồng." },
      { text: "hổ", rime: "ô", initial: "h", tone: "hỏi", read: "hờ - ô - hô | hỏi - hổ", example: "Chú hổ con nhảy múa cùng Bé Mây." },
      { text: "bơ", rime: "ơ", initial: "b", tone: "ngang", read: "bờ - ơ - bơ", example: "Bé Mây ăn quả bơ." },
      { text: "thư", rime: "ư", initial: "th", tone: "ngang", read: "thờ - ư - thư", example: "Bé Mây gửi lá thư cho bà." }
    ]
  },
  {
    day: 2,
    title: "Nhóm âm cuối -i",
    rimeIntro: ["ai", "oi", "ôi", "ơi", "ui", "ưi", "uôi", "ươi"],
    words: [
      { text: "tai", rime: "ai", initial: "t", tone: "ngang", read: "a - i - ai | tờ - ai - tai", example: "Bé Mây lắng tai nghe nhạc." },
      { text: "voi", rime: "oi", initial: "v", tone: "ngang", read: "o - i - oi | vờ - oi - voi", example: "Chú voi vẫy vòi chào Bé Mây." },
      { text: "môi", rime: "ôi", initial: "m", tone: "ngang", read: "ô - i - ôi | mờ - ôi - môi", example: "Bé Mây thoa son dưỡng lên môi." },
      { text: "trời", rime: "ơi", initial: "tr", tone: "huyền", read: "ơ - i - ơi | trờ - ơi - trơi | huyền - trời", example: "Bé Mây nhìn bầu trời xanh." },
      { text: "mũi", rime: "ui", initial: "m", tone: "ngã", read: "u - i - ui | mờ - ui - mui | ngã - mũi", example: "Bé Mây thở nhẹ bằng mũi." },
      { text: "ngửi", rime: "ưi", initial: "ng", tone: "hỏi", read: "ư - i - ưi | ngờ - ưi - ngưi | hỏi - ngửi", example: "Bé Mây ngửi hương hoa thơm." },
      { text: "chuối", rime: "uôi", initial: "ch", tone: "sắc", read: "u - ô - i - uôi | chờ - uôi - chuôi | sắc - chuối", example: "Bé Mây ăn quả chuối chín." },
      { text: "cười", rime: "ươi", initial: "c", tone: "huyền", read: "ư - ơ - i - ươi | cờ - ươi - cươi | huyền - cười", example: "Bé Mây cười vang thật vui." }
    ]
  },
  {
    day: 3,
    title: "Nhóm âm cuối -y & -o",
    rimeIntro: ["ay", "ây", "ao", "eo"],
    words: [
      { text: "tay", rime: "ay", initial: "t", tone: "ngang", read: "a - i - ay | tờ - ay - tay", example: "Bé Mây vẫy tay chào bạn." },
      { text: "bay", rime: "ay", initial: "b", tone: "ngang", read: "a - i - ay | bờ - ay - bay", example: "Chú chim bay trên bầu trời." },
      { text: "cây", rime: "ây", initial: "c", tone: "ngang", read: "ớ - i - ây | cờ - ây - cây", example: "Bé Mây tưới nước cho cây." },
      { text: "mây", rime: "ây", initial: "m", tone: "ngang", read: "ớ - i - ây | mờ - ây - mây", example: "Đám mây trắng giống tên Bé Mây." },
      { text: "áo", rime: "ao", initial: "", tone: "sắc", read: "a - o - ao | sắc - áo", example: "Bé Mây mặc chiếc áo ấm." },
      { text: "bão", rime: "ao", initial: "b", tone: "ngã", read: "a - o - ao | bờ - ao - bao | ngã - bão", example: "Bé Mây ngắm bão tuyết ngoài cửa sổ." },
      { text: "mèo", rime: "eo", initial: "m", tone: "huyền", read: "e - o - eo | mờ - eo - meo | huyền - mèo", example: "Chú mèo con kêu meo meo." },
      { text: "kẹo", rime: "eo", initial: "k", tone: "nặng", read: "e - o - eo | ca - eo - keo | nặng - kẹo", example: "Bé Mây chia kẹo cho bạn." }
    ]
  },
  {
    day: 4,
    title: "Nhóm âm cuối -u",
    rimeIntro: ["au", "âu", "êu", "iu", "iêu", "ưu", "ươu"],
    words: [
      { text: "rau", rime: "au", initial: "r", tone: "ngang", read: "a - u - au | rờ - au - rau", example: "Bé Mây ăn rau xanh rất giỏi." },
      { text: "gấu", rime: "âu", initial: "g", tone: "sắc", read: "ớ - u - âu | gờ - âu - gâu | sắc - gấu", example: "Bé Mây ôm chú gấu bông." },
      { text: "dâu", rime: "âu", initial: "d", tone: "ngang", read: "ớ - u - âu | dờ - âu - dâu", example: "Bé Mây thích ăn quả dâu đỏ." },
      { text: "kêu", rime: "êu", initial: "k", tone: "ngang", read: "ê - u - êu | ca - êu - kêu", example: "Chú vịt kêu cạp cạp." },
      { text: "xíu", rime: "iu", initial: "x", tone: "sắc", read: "i - u - iu | xờ - iu - xiu | sắc - xíu", example: "Bé Mây có chiếc bánh nhỏ xíu." },
      { text: "diều", rime: "iêu", initial: "d", tone: "huyền", read: "i - ê - u - iêu | dờ - iêu - diêu | huyền - diều", example: "Bé Mây thả cánh diều bay." },
      { text: "lựu", rime: "ưu", initial: "l", tone: "nặng", read: "ư - u - ưu | lờ - ưu - lưu | nặng - lựu", example: "Bé Mây ăn hạt lựu đỏ." },
      { text: "hươu", rime: "ươu", initial: "h", tone: "ngang", read: "ư - ơ - u - ươu | hờ - ươu - hươu", example: "Chú hươu cao cổ ăn lá non." }
    ]
  },
  {
    day: 5,
    title: "Nhóm âm cuối -m",
    rimeIntro: ["am", "ăm", "âm", "em", "im", "ôm", "ơm", "ươm"],
    words: [
      { text: "cam", rime: "am", initial: "c", tone: "ngang", read: "a - mờ - am | cờ - am - cam", example: "Bé Mây uống nước cam ngọt." },
      { text: "tắm", rime: "ăm", initial: "t", tone: "sắc", read: "á - mờ - ăm | tờ - ăm - tăm | sắc - tắm", example: "Bé Mây tắm nước ấm mỗi chiều." },
      { text: "nấm", rime: "âm", initial: "n", tone: "sắc", read: "ớ - mờ - âm | nờ - âm - nâm | sắc - nấm", example: "Bé Mây thấy cây nấm nhỏ." },
      { text: "kem", rime: "em", initial: "k", tone: "ngang", read: "e - mờ - em | ca - em - kem", example: "Bé Mây ăn que kem mát lạnh." },
      { text: "chim", rime: "im", initial: "ch", tone: "ngang", read: "i - mờ - im | chờ - im - chim", example: "Chú chim đậu trên cành cây." },
      { text: "tôm", rime: "ôm", initial: "t", tone: "ngang", read: "ô - mờ - ôm | tờ - ôm - tôm", example: "Bé Mây ăn tôm luộc rất ngon." },
      { text: "cơm", rime: "ơm", initial: "c", tone: "ngang", read: "ơ - mờ - ơm | cờ - ơm - cơm", example: "Bé Mây ăn cơm cùng cả nhà." },
      { text: "bướm", rime: "ươm", initial: "b", tone: "sắc", read: "ư - ơ - mờ - ươm | bờ - ươm - bươm | sắc - bướm", example: "Chú bướm xinh bay quanh Bé Mây." }
    ]
  },
  {
    day: 6,
    title: "Nhóm âm cuối -n",
    rimeIntro: ["an", "ăn", "ân", "en", "in", "on", "ôn", "un"],
    words: [
      { text: "bàn", rime: "an", initial: "b", tone: "huyền", read: "a - nờ - an | bờ - an - ban | huyền - bàn", example: "Bé Mây vẽ tranh trên bàn." },
      { text: "khăn", rime: "ăn", initial: "kh", tone: "ngang", read: "á - nờ - ăn | khờ - ăn - khăn", example: "Bé Mây gấp khăn gọn gàng." },
      { text: "chân", rime: "ân", initial: "ch", tone: "ngang", read: "ớ - nờ - ân | chờ - ân - chân", example: "Bé Mây mang giày vào chân." },
      { text: "đèn", rime: "en", initial: "đ", tone: "huyền", read: "e - nờ - en | đờ - en - đen | huyền - đèn", example: "Chiếc đèn sáng lung linh." },
      { text: "pin", rime: "in", initial: "p", tone: "ngang", read: "i - nờ - in | pờ - in - pin", example: "Bé Mây lắp pin cho ô tô đồ chơi." },
      { text: "nón", rime: "on", initial: "n", tone: "sắc", read: "o - nờ - on | nờ - on - non | sắc - nón", example: "Bé Mây đội chiếc nón lá." },
      { text: "bốn", rime: "ôn", initial: "b", tone: "sắc", read: "ô - nờ - ôn | bờ - ôn - bôn | sắc - bốn", example: "Bé Mây đếm đến số bốn." },
      { text: "cún", rime: "un", initial: "c", tone: "sắc", read: "u - nờ - un | cờ - un - cun | sắc - cún", example: "Chú cún con chạy theo Bé Mây." }
    ]
  },
  {
    day: 7,
    title: "Nhóm âm cuối -ng",
    rimeIntro: ["ang", "ăng", "ong", "ông", "ung", "ưng", "uông", "ương"],
    words: [
      { text: "vàng", rime: "ang", initial: "v", tone: "huyền", read: "a - ngờ - ang | vờ - ang - vang | huyền - vàng", example: "Chiếc lá màu vàng rơi nhẹ." },
      { text: "trăng", rime: "ăng", initial: "tr", tone: "ngang", read: "á - ngờ - ăng | trờ - ăng - trăng", example: "Bé Mây ngắm vầng trăng sáng." },
      { text: "võng", rime: "ong", initial: "v", tone: "ngã", read: "o - ngờ - ong | vờ - ong - vong | ngã - võng", example: "Bé Mây nằm võng đung đưa." },
      { text: "trống", rime: "ông", initial: "tr", tone: "sắc", read: "ô - ngờ - ông | trờ - ông - trông | sắc - trống", example: "Bé Mây đánh trống tùng tùng." },
      { text: "thùng", rime: "ung", initial: "th", tone: "huyền", read: "u - ngờ - ung | thờ - ung - thung | huyền - thùng", example: "Bé Mây cất đồ chơi vào thùng." },
      { text: "rừng", rime: "ưng", initial: "r", tone: "huyền", read: "ư - ngờ - ưng | rờ - ưng - rưng | huyền - rừng", example: "Bé Mây đi dạo trong rừng tuyết." },
      { text: "chuông", rime: "uông", initial: "ch", tone: "ngang", read: "u - ô - ngờ - uông | chờ - uông - chuông", example: "Tiếng chuông ngân vang khắp làng." },
      { text: "đường", rime: "ương", initial: "đ", tone: "huyền", read: "ư - ơ - ngờ - ương | đờ - ương - đương | huyền - đường", example: "Con đường tuyết dẫn đến lâu đài." }
    ]
  },
  {
    day: 8,
    title: "Nhóm âm cuối -nh & -ch",
    rimeIntro: ["anh", "inh", "ach", "êch", "ich"],
    words: [
      { text: "bánh", rime: "anh", initial: "b", tone: "sắc", read: "a - nhờ - anh | bờ - anh - banh | sắc - bánh", example: "Bé Mây ăn chiếc bánh ngọt." },
      { text: "xanh", rime: "anh", initial: "x", tone: "ngang", read: "a - nhờ - anh | xờ - anh - xanh", example: "Bé Mây tô màu xanh cho cây." },
      { text: "kính", rime: "inh", initial: "k", tone: "sắc", read: "i - nhờ - inh | ca - inh - kinh | sắc - kính", example: "Bé Mây đeo chiếc kính mát." },
      { text: "bình", rime: "inh", initial: "b", tone: "huyền", read: "i - nhờ - inh | bờ - inh - binh | huyền - bình", example: "Bé Mây rót nước vào bình." },
      { text: "sách", rime: "ach", initial: "s", tone: "sắc", read: "a - chờ - ach | sờ - ach - sach | sắc - sách", example: "Bé Mây mở cuốn sách tranh." },
      { text: "gạch", rime: "ach", initial: "g", tone: "nặng", read: "a - chờ - ach | gờ - ach - gach | nặng - gạch", example: "Ngôi nhà xây bằng gạch đỏ." },
      { text: "ếch", rime: "êch", initial: "", tone: "sắc", read: "ê - chờ - êch | sắc - ếch", example: "Chú ếch xanh ngồi trên lá sen." },
      { text: "lịch", rime: "ich", initial: "l", tone: "nặng", read: "i - chờ - ich | lờ - ich - lich | nặng - lịch", example: "Bé Mây xem tờ lịch treo tường." }
    ]
  },
  {
    day: 9,
    title: "Nhóm âm cuối -c",
    rimeIntro: ["ac", "ăc", "oc", "ôc", "uc", "ưc", "ươc"],
    words: [
      { text: "bác", rime: "ac", initial: "b", tone: "sắc", read: "a - cờ - ac | bờ - ac - bac | sắc - bác", example: "Bé Mây khoanh tay chào bác." },
      { text: "mặc", rime: "ăc", initial: "m", tone: "nặng", read: "á - cờ - ăc | mờ - ăc - măc | nặng - mặc", example: "Bé Mây tự mặc áo khoác." },
      { text: "tóc", rime: "oc", initial: "t", tone: "sắc", read: "o - cờ - oc | tờ - oc - toc | sắc - tóc", example: "Mẹ buộc tóc xinh cho Bé Mây." },
      { text: "sóc", rime: "oc", initial: "s", tone: "sắc", read: "o - cờ - oc | sờ - oc - soc | sắc - sóc", example: "Chú sóc nhỏ nhặt hạt thông." },
      { text: "cốc", rime: "ôc", initial: "c", tone: "sắc", read: "ô - cờ - ôc | cờ - ôc - côc | sắc - cốc", example: "Bé Mây cầm cốc uống nước." },
      { text: "cúc", rime: "uc", initial: "c", tone: "sắc", read: "u - cờ - uc | cờ - uc - cuc | sắc - cúc", example: "Bông hoa cúc nở vàng rực." },
      { text: "mực", rime: "ưc", initial: "m", tone: "nặng", read: "ư - cờ - ưc | mờ - ưc - mưc | nặng - mực", example: "Chú mực bơi dưới biển." },
      { text: "nước", rime: "ươc", initial: "n", tone: "sắc", read: "ư - ơ - cờ - ươc | nờ - ươc - nươc | sắc - nước", example: "Bé Mây uống nước lọc mỗi ngày." }
    ]
  },
  {
    day: 10,
    title: "Nhóm âm cuối -t",
    rimeIntro: ["at", "ăt", "ât", "êt", "it", "ot", "ôt", "ut"],
    words: [
      { text: "bát", rime: "at", initial: "b", tone: "sắc", read: "a - tờ - at | bờ - at - bat | sắc - bát", example: "Bé Mây cầm bát ăn cơm." },
      { text: "mắt", rime: "ăt", initial: "m", tone: "sắc", read: "á - tờ - ăt | mờ - ăt - măt | sắc - mắt", example: "Bé Mây chớp đôi mắt tròn." },
      { text: "tất", rime: "ât", initial: "t", tone: "sắc", read: "ớ - tờ - ât | tờ - ât - tât | sắc - tất", example: "Bé Mây đi tất giữ ấm chân." },
      { text: "tết", rime: "êt", initial: "t", tone: "sắc", read: "ê - tờ - êt | tờ - êt - têt | sắc - tết", example: "Ngày tết Bé Mây được mặc áo mới." },
      { text: "vịt", rime: "it", initial: "v", tone: "nặng", read: "i - tờ - it | vờ - it - vit | nặng - vịt", example: "Chú vịt con bơi dưới hồ." },
      { text: "hót", rime: "ot", initial: "h", tone: "sắc", read: "o - tờ - ot | hờ - ot - hot | sắc - hót", example: "Chú chim hót vang buổi sáng." },
      { text: "một", rime: "ôt", initial: "m", tone: "nặng", read: "ô - tờ - ôt | mờ - ôt - môt | nặng - một", example: "Bé Mây giơ một ngón tay." },
      { text: "bút", rime: "ut", initial: "b", tone: "sắc", read: "u - tờ - ut | bờ - ut - but | sắc - bút", example: "Bé Mây cầm bút vẽ bông tuyết." }
    ]
  },
  {
    day: 11,
    title: "Nhóm âm cuối -p",
    rimeIntro: ["ap", "ăp", "âp", "ep", "êp", "op", "ôp", "up"],
    words: [
      { text: "đạp", rime: "ap", initial: "đ", tone: "nặng", read: "a - pờ - ap | đờ - ap - đap | nặng - đạp", example: "Bé Mây đạp xe quanh công viên." },
      { text: "bắp", rime: "ăp", initial: "b", tone: "sắc", read: "á - pờ - ăp | bờ - ăp - băp | sắc - bắp", example: "Bé Mây ăn bắp ngô luộc ngọt." },
      { text: "tập", rime: "âp", initial: "t", tone: "nặng", read: "ớ - pờ - âp | tờ - âp - tâp | nặng - tập", example: "Bé Mây tập viết chữ đẹp." },
      { text: "dép", rime: "ep", initial: "d", tone: "sắc", read: "e - pờ - ep | dờ - ep - dep | sắc - dép", example: "Bé Mây xếp đôi dép ngay ngắn." },
      { text: "bếp", rime: "êp", initial: "b", tone: "sắc", read: "ê - pờ - êp | bờ - êp - bêp | sắc - bếp", example: "Mẹ nấu cơm thơm trong bếp." },
      { text: "cọp", rime: "op", initial: "c", tone: "nặng", read: "o - pờ - op | cờ - op - cop | nặng - cọp", example: "Chú cọp con trong truyện tranh." },
      { text: "hộp", rime: "ôp", initial: "h", tone: "nặng", read: "ô - pờ - ôp | hờ - ôp - hôp | nặng - hộp", example: "Bé Mây mở chiếc hộp quà." },
      { text: "búp", rime: "up", initial: "b", tone: "sắc", read: "u - pờ - up | bờ - up - bup | sắc - búp", example: "Bé Mây ôm búp bê đi ngủ." }
    ]
  },
  {
    day: 12,
    title: "Vần mở bổ sung (u, ia, ua, ưa)",
    rimeIntro: ["u", "ia", "ua", "ưa"],
    words: [
      { text: "tủ", rime: "u", initial: "t", tone: "hỏi", read: "tờ - u - tu | hỏi - tủ", example: "Bé Mây cất áo vào tủ." },
      { text: "mũ", rime: "u", initial: "m", tone: "ngã", read: "mờ - u - mu | ngã - mũ", example: "Bé Mây đội mũ len ấm." },
      { text: "mía", rime: "ia", initial: "m", tone: "sắc", read: "i - a - ia | mờ - ia - mia | sắc - mía", example: "Bé Mây thấy cây mía ngọt." },
      { text: "chia", rime: "ia", initial: "ch", tone: "ngang", read: "i - a - ia | chờ - ia - chia", example: "Bé Mây chia bánh cho bạn." },
      { text: "cua", rime: "ua", initial: "c", tone: "ngang", read: "u - a - ua | cờ - ua - cua", example: "Chú cua bò ngang trên cát." },
      { text: "mùa", rime: "ua", initial: "m", tone: "huyền", read: "u - a - ua | mờ - ua - mua | huyền - mùa", example: "Bé Mây thích mùa đông tuyết trắng." },
      { text: "dừa", rime: "ưa", initial: "d", tone: "huyền", read: "ư - a - ưa | dờ - ưa - dưa | huyền - dừa", example: "Bé Mây uống nước quả dừa." },
      { text: "bữa", rime: "ưa", initial: "b", tone: "ngã", read: "ư - a - ưa | bờ - ưa - bưa | ngã - bữa", example: "Cả nhà ăn bữa cơm vui." }
    ]
  },
  {
    day: 13,
    title: "Vần có âm đệm (oa, oe, uê, uy)",
    rimeIntro: ["oa", "oe", "uê", "uy"],
    words: [
      { text: "hoa", rime: "oa", initial: "h", tone: "ngang", read: "o - a - oa | hờ - oa - hoa", example: "Bé Mây tưới bông hoa xinh." },
      { text: "loa", rime: "oa", initial: "l", tone: "ngang", read: "o - a - oa | lờ - oa - loa", example: "Chiếc loa phát nhạc vui." },
      { text: "tỏa", rime: "oa", initial: "t", tone: "hỏi", read: "o - a - oa | tờ - oa - toa | hỏi - tỏa", example: "Ánh nắng tỏa sáng khắp sân." },
      { text: "khoe", rime: "oe", initial: "kh", tone: "ngang", read: "o - e - oe | khờ - oe - khoe", example: "Bé Mây khoe áo mới với bạn." },
      { text: "khỏe", rime: "oe", initial: "kh", tone: "hỏi", read: "o - e - oe | khờ - oe - khoe | hỏi - khỏe", example: "Bé Mây ăn nhiều rau nên khỏe mạnh." },
      { text: "xòe", rime: "oe", initial: "x", tone: "huyền", read: "o - e - oe | xờ - oe - xoe | huyền - xòe", example: "Chú công xòe đuôi thật đẹp." },
      { text: "huệ", rime: "uê", initial: "h", tone: "nặng", read: "u - ê - uê | hờ - uê - huê | nặng - huệ", example: "Bé Mây ngửi bông hoa huệ trắng." },
      { text: "khuy", rime: "uy", initial: "kh", tone: "ngang", read: "u - i - uy | khờ - uy - khuy", example: "Bé Mây cài khuy áo ngay ngắn." }
    ]
  },
  {
    day: 14,
    title: "Mở rộng: âm đệm & âm cuối",
    rimeIntro: ["oan", "oanh", "oai", "oay", "uây", "oăn", "uyên"],
    words: [
      { text: "ngoan", rime: "oan", initial: "ng", tone: "ngang", read: "o - a - nờ - oan | ngờ - oan - ngoan", example: "Bé Mây rất ngoan." },
      { text: "khoanh", rime: "oanh", initial: "kh", tone: "ngang", read: "o - a - nhờ - oanh | khờ - oanh - khoanh", example: "Bé Mây khoanh tay chào cô." },
      { text: "xoài", rime: "oai", initial: "x", tone: "huyền", read: "o - a - i - oai | xờ - oai - xoai | huyền - xoài", example: "Bé Mây ăn xoài chín ngọt." },
      { text: "xoải", rime: "oai", initial: "x", tone: "hỏi", read: "o - a - i - oai | xờ - oai - xoai | hỏi - xoải", example: "Chú chim xoải cánh bay cao." },
      { text: "xoay", rime: "oay", initial: "x", tone: "ngang", read: "o - a - i - oay | xờ - oai - xoay", example: "Chiếc chong chóng xoay tròn." },
      { text: "khuấy", rime: "uây", initial: "kh", tone: "sắc", read: "u - ớ - i - uây | khờ - uây - khuây | sắc - khuấy", example: "Bé Mây khuấy ly sữa ấm." },
      { text: "xoăn", rime: "oăn", initial: "x", tone: "ngang", read: "o - á - nờ - oăn | xờ - oăn - xoăn", example: "Tóc Bé Mây xoăn xoăn." },
      { text: "chuyện", rime: "uyên", initial: "ch", tone: "nặng", read: "u - i - ê - nờ - uyên | chờ - uyên - chuyên | nặng - chuyện", example: "Bà kể chuyện cho Bé Mây nghe." }
    ]
  }
];

// Enrich spelling days with emoji and structured karaoke chips
const SPELLING_DATA = SPELLING_DAYS.map(dayObj => {
  return {
    ...dayObj,
    words: dayObj.words.map((w, idx) => {
      const emojiInfo = wordsMap[w.text] || { emoji: '✨', quiz: true };
      
      // Split read string into 3 groups
      const groups = w.read.split('|').map(s => s.trim());
      // groups[0]: rime letters (or onset if single vowel)
      // groups[1]: onset + rime (or tone if no onset)
      // groups[2]: tone + word (if applicable)
      
      const chips = [];
      groups.forEach((g, gIdx) => {
        const tokens = g.split('-').map(t => t.trim());
        tokens.forEach(tok => {
          let role = 'rime';
          if (gIdx === 0 && tokens.length === 3 && tok === tokens[0]) role = 'onset';
          if (tok.includes('sắc') || tok.includes('huyền') || tok.includes('hỏi') || tok.includes('ngã') || tok.includes('nặng')) {
            role = 'tone';
          } else if (tok === w.text) {
            role = 'word';
          } else if (tok.endsWith('ờ') || tok === 'ca') {
            role = 'onset';
          }
          chips.push({ text: tok, role, group: gIdx + 1 });
        });
      });

      return {
        id: `spell_d${dayObj.day}_${idx + 1}`,
        day: dayObj.day,
        order: idx + 1,
        text: w.text,
        rime: w.rime,
        initial: w.initial,
        tone: w.tone,
        spellingRead: w.read,
        example: w.example,
        emoji: emojiInfo.emoji || '✨',
        quiz: emojiInfo.quiz !== false,
        chips: chips
      };
    })
  };
});

const spellingFileContent = `// Magic World Spelling (14 Days, 112 Words)
window.MagicWorld = window.MagicWorld || {};
window.MagicWorld.SpellingDays = ${JSON.stringify(SPELLING_DATA, null, 2)};
`;
fs.writeFileSync(path.join('js', 'data', 'spelling.js'), spellingFileContent, 'utf8');
console.log('Written spelling.js with 14 days');

// 5. WRITE FEEDBACK.JS
const FEEDBACK_DATA = {
  praise: [
    "Bé Mây giỏi quá!",
    "Bé Mây trả lời hay quá!",
    "Bé Mây xinh đẹp thật tuyệt vời!",
    "Bé Mây đáng yêu quá!",
    "Chính xác rồi, Bé Mây tuyệt vời quá!",
    "Bé Mây tìm ra rồi, giỏi lắm!"
  ],
  wrong: [
    "Sai rồi, Bé Mây cố lên nhé!",
    "Nhầm rồi! Bé Mây cố lên nào!",
    "Không đúng rồi, mình thử lại nhé Bé Mây!",
    "Chưa đúng rồi, Bé Mây thử thêm lần nữa nhé!",
    "Nhầm một chút thôi, không sao cả, Bé Mây nghe lại nhé!"
  ]
};

const feedbackFileContent = `// Magic World Feedback Bank
window.MagicWorld = window.MagicWorld || {};
window.MagicWorld.Feedback = ${JSON.stringify(FEEDBACK_DATA, null, 2)};
`;
fs.writeFileSync(path.join('js', 'data', 'feedback.js'), feedbackFileContent, 'utf8');
console.log('Written feedback.js');


// 6. WRITE STORIES.JS (10 Stories)
const STORIES_DATA = [
  {
    id: "story-prologue",
    title: "Sương Mù Quên Chữ",
    trigger: ["prologue", "home"],
    mood: "normal",
    art: "ice-village",
    scenes: [
      {
        id: "p1",
        art: "ice-village",
        lines: [
          { who: "co", text: "Chào Bé Mây yêu quý! Một sớm mùa đông, sương mù tuyết trắng phủ khắp vương quốc." },
          { who: "lumi", text: "Ôi Bé Mây ơi! Các bạn chữ và bảng tên đều bị sương mù làm ngủ quên mất rồi!" }
        ]
      },
      {
        id: "p2",
        art: "lumi-appears",
        lines: [
          { who: "co", text: "Đừng lo nhé, Bé Mây mang theo trái tim ấm áp và chiếc áo choàng ngôi sao xinh xắn." },
          { who: "lumi", text: "Mỗi khi Bé Mây đọc đúng một chữ, viên pha lê sẽ tan băng và sáng bừng lên đấy!" }
        ]
      },
      {
        id: "p3",
        art: "crystal",
        lines: [
          { who: "co", text: "Chúng mình cùng Lumi lên đường đánh thức vương quốc tuyết nào, Bé Mây ngoan ơi!" },
          { who: "lumi", text: "Đi thôi Bé Mây ơi! Nhiều bạn chữ đáng yêu đang chờ Bé Mây kìa!" }
        ]
      }
    ]
  },
  {
    id: "story-letters",
    title: "Rừng Chữ Lung Linh",
    trigger: ["letters"],
    mood: "normal",
    art: "forest-letters",
    scenes: [
      {
        id: "l1",
        art: "forest-letters",
        lines: [
          { who: "co", text: "Chào mừng Bé Mây đến với Rừng Chữ Lung Linh! Nơi này có hai mươi chín bạn chữ cái." },
          { who: "lumi", text: "Mỗi bạn chữ ẩn dưới một cành cây tuyết, chờ Bé Mây đến gõ cửa chào bạn đấy!" }
        ]
      },
      {
        id: "l2",
        art: "glow-path",
        lines: [
          { who: "co", text: "Bé Mây tô nét thật khéo, đọc chữ thật to để các bạn chữ cùng múa ca nhé!" }
        ]
      }
    ]
  },
  {
    id: "story-vocab",
    title: "Thung Lũng Từ Ngắn",
    trigger: ["vocab"],
    mood: "normal",
    art: "valley",
    scenes: [
      {
        id: "v1",
        art: "valley",
        lines: [
          { who: "co", text: "Ô kìa Bé Mây! Thung Lũng Từ Vựng trải dài với hoa tuyết và suối pha lê." },
          { who: "lumi", text: "Mỗi ngày mình gặp tám từ quen thuộc: ba mẹ, quả cam, chú cún ngoan..." }
        ]
      },
      {
        id: "v2",
        art: "crystal",
        lines: [
          { who: "co", text: "Bé Mây chỉ cần chạm nhẹ và lắng nghe một lần là thắp sáng một viên pha lê rồi!" }
        ]
      }
    ]
  },
  {
    id: "story-spell",
    title: "Lâu Đài Đánh Vần",
    trigger: ["spell"],
    mood: "normal",
    art: "castle",
    scenes: [
      {
        id: "s1",
        art: "castle",
        lines: [
          { who: "co", text: "Trước mặt Bé Mây là Lâu Đài Đánh Vần nguy nga với những cánh cửa phép thuật." },
          { who: "lumi", text: "Âm đầu, vần và dấu thanh nắm tay nhau tạo thành những tiếng hát du dương!" }
        ]
      },
      {
        id: "s2",
        art: "castle-door",
        lines: [
          { who: "co", text: "Hãy nghe nhịp karaoke màu sắc và đọc cùng Cô Sao Băng nhé Bé Mây!" }
        ]
      }
    ]
  },
  {
    id: "story-rainbow",
    title: "Cầu Vồng Tuyết",
    trigger: ["rainbow"],
    mood: "normal",
    art: "rainbow-bridge",
    scenes: [
      {
        id: "r1",
        art: "rainbow-bridge",
        lines: [
          { who: "lumi", text: "Oa! Cây Cầu Vồng Tuyết bảy sắc lung linh vắt qua bầu trời kìa Bé Mây ơi!" },
          { who: "co", text: "Những từ dài bốn, năm chữ cái và từ ghép đang dệt nên dải cầu vồng rực rỡ đấy." }
        ]
      }
    ]
  },
  {
    id: "story-aurora",
    title: "Đỉnh Cực Quang",
    trigger: ["aurora"],
    mood: "normal",
    art: "aurora-peak",
    scenes: [
      {
        id: "a1",
        art: "aurora-peak",
        lines: [
          { who: "co", text: "Lên đến Đỉnh Cực Quang, Bé Mây nhìn thấy cả vương quốc đã bừng sáng rực rỡ!" },
          { who: "lumi", text: "Bé Mây thật là tài giỏi! Lumi yêu Bé Mây nhiều lắm!" }
        ]
      }
    ]
  },
  {
    id: "story-lumi-lost",
    title: "Lumi Đi Lạc",
    trigger: ["lumi-lost"],
    mood: "normal",
    art: "snow-forest",
    scenes: [
      {
        id: "lm1",
        art: "snow-forest",
        lines: [
          { who: "lumi", text: "Hu hu, Lumi mải đuổi theo bạn bướm tuyết nên lạc vào rừng cây rồi..." },
          { who: "co", text: "Đừng sợ nhé Lumi! Bé Mây đang đọc vang từng chữ để mở đường sáng cho bạn về đấy!" }
        ]
      },
      {
        id: "lm2",
        art: "home-light",
        lines: [
          { who: "lumi", text: "Lumi thấy ánh sáng của Bé Mây rồi! Cảm ơn Bé Mây tốt bụng đã giúp Lumi nhé!" }
        ]
      }
    ]
  },
  {
    id: "story-crown",
    title: "Vương Miện Sao Sáu Cánh",
    trigger: ["crown"],
    mood: "normal",
    art: "crown-room",
    scenes: [
      {
        id: "c1",
        art: "crown-glow",
        lines: [
          { who: "co", text: "Bé Mây ơi, Cô Sao Băng trao tặng bé chiếc Vương Miện Sao Sáu Cánh lấp lánh này." },
          { who: "lumi", text: "Bé Mây xinh đẹp đội vương miện trông giống như một nàng công chúa tuyết vậy!" }
        ]
      }
    ]
  },
  {
    id: "story-bedtime",
    title: "Bông Tuyết Ru Ngủ",
    trigger: ["bedtime"],
    mood: "calm",
    art: "bedroom-night",
    scenes: [
      {
        id: "b1",
        art: "bedroom-night",
        lines: [
          { who: "co", text: "Đêm đã về trên Vương quốc Băng Lam. Tuyết rơi nhè nhẹ ngoài hiên cửa sổ." },
          { who: "lumi", text: "Bé Mây hôm nay học thật ngoan, đọc thật giỏi. Bây giờ Bé Mây đắp chăn ấm nhé." },
          { who: "co", text: "Ngủ ngon nhé Bé Mây thiên thần nhỏ. Chúc bé có những giấc mơ thật ngọt ngào." }
        ]
      }
    ]
  },
  {
    id: "story-star-ceremony",
    title: "Lễ Nhận Sao",
    trigger: ["ceremony"],
    mood: "normal",
    art: "ceremony",
    scenes: [
      {
        id: "cr1",
        art: "ceremony",
        lines: [
          { who: "co", text: "Ting ting! Xin chúc mừng Bé Mây đã hoàn thành xuất sắc buổi học hôm nay!" },
          { who: "lumi", text: "Những ngôi sao lấp lánh và bông tuyết pha lê đang bay quanh Bé Mây này!" }
        ]
      }
    ]
  }
];

const storiesFileContent = `// Magic World Stories
window.MagicWorld = window.MagicWorld || {};
window.MagicWorld.Stories = ${JSON.stringify(STORIES_DATA, null, 2)};
`;
fs.writeFileSync(path.join('js', 'data', 'stories.js'), storiesFileContent, 'utf8');
console.log('Written stories.js with 10 stories');

// 7. WRITE STROKES.JS (Handwriting Strokes for 29 Lowercase Letters)
// Each letter has guide strokes on a 100x160 canvas with primary school ruling:
// Top line: y=30, Upper midline: y=60, Base line: y=110, Descender line: y=140
const STROKES_DATA = {
  a: [
    { order: 1, d: "M 66 72 C 62 64 54 64 48 64 C 36 64 26 74 26 88 C 26 102 36 112 48 112 C 58 112 68 104 68 88 C 68 80 67 74 66 72 Z", start: { x: 66, y: 72 }, dir: "counter-clockwise", label: "Nét cong kín" },
    { order: 2, d: "M 68 64 L 68 102 C 68 112 78 112 86 104 C 90 100 92 92 92 88", start: { x: 68, y: 64 }, dir: "down", label: "Nét móc ngược" }
  ],
  aw: [
    { order: 1, d: "M 66 72 C 62 64 54 64 48 64 C 36 64 26 74 26 88 C 26 102 36 112 48 112 C 58 112 68 104 68 88 C 68 80 67 74 66 72 Z", start: { x: 66, y: 72 }, dir: "counter-clockwise", label: "Nét cong kín" },
    { order: 2, d: "M 68 64 L 68 102 C 68 112 78 112 86 104 C 90 100 92 92 92 88", start: { x: 68, y: 64 }, dir: "down", label: "Nét móc ngược" },
    { order: 3, d: "M 36 52 C 44 58 52 58 60 52", start: { x: 36, y: 52 }, dir: "right", label: "Dấu trăng" }
  ],
  aa: [
    { order: 1, d: "M 66 72 C 62 64 54 64 48 64 C 36 64 26 74 26 88 C 26 102 36 112 48 112 C 58 112 68 104 68 88 C 68 80 67 74 66 72 Z", start: { x: 66, y: 72 }, dir: "counter-clockwise", label: "Nét cong kín" },
    { order: 2, d: "M 68 64 L 68 102 C 68 112 78 112 86 104 C 90 100 92 92 92 88", start: { x: 68, y: 64 }, dir: "down", label: "Nét móc ngược" },
    { order: 3, d: "M 36 56 L 48 46 L 60 56", start: { x: 36, y: 56 }, dir: "up-down", label: "Dấu nón" }
  ],
  b: [
    { order: 1, d: "M 32 108 L 32 35 C 32 25 45 25 45 40 L 45 105 C 45 112 55 112 60 100", start: { x: 32, y: 108 }, dir: "up-loop", label: "Nét khuyết trên & thắt" }
  ],
  c: [
    { order: 1, d: "M 68 72 C 60 62 38 62 32 82 C 28 96 36 112 55 112 C 65 112 72 106 75 100", start: { x: 68, y: 72 }, dir: "counter-clockwise", label: "Nét cong hở phải" }
  ],
  d: [
    { order: 1, d: "M 62 75 C 57 62 40 62 35 75 C 28 90 28 100 35 110 C 42 118 58 118 62 105 Z", start: { x: 60, y: 70 }, dir: "counter-clockwise", label: "Nét cong kín" },
    { order: 2, d: "M 62 40 L 62 105 C 62 112 70 114 76 110", start: { x: 62, y: 40 }, dir: "down", label: "Nét móc ngược dài" }
  ],
  dd: [
    { order: 1, d: "M 62 75 C 57 62 40 62 35 75 C 28 90 28 100 35 110 C 42 118 58 118 62 105 Z", start: { x: 60, y: 70 }, dir: "counter-clockwise", label: "Nét cong kín" },
    { order: 2, d: "M 62 40 L 62 105 C 62 112 70 114 76 110", start: { x: 62, y: 40 }, dir: "down", label: "Nét móc ngược dài" },
    { order: 3, d: "M 50 48 L 74 48", start: { x: 50, y: 48 }, dir: "right", label: "Nét gạch ngang" }
  ],
  e: [
    { order: 1, d: "M 32 92 L 68 85 C 68 65 42 60 34 78 C 28 95 38 112 58 112 C 68 112 74 106 76 100", start: { x: 32, y: 92 }, dir: "up-loop", label: "Nét cong liền" }
  ],
  ee: [
    { order: 1, d: "M 32 92 L 68 85 C 68 65 42 60 34 78 C 28 95 38 112 58 112 C 68 112 74 106 76 100", start: { x: 32, y: 92 }, dir: "up-loop", label: "Nét cong liền" },
    { order: 2, d: "M 40 54 L 51 44 L 62 54", start: { x: 40, y: 54 }, dir: "up-down", label: "Dấu nón" }
  ],
  g: [
    { order: 1, d: "M 65 75 C 60 62 40 62 35 75 C 28 90 28 100 35 110 C 42 118 60 118 65 105 Z", start: { x: 62, y: 70 }, dir: "counter-clockwise", label: "Nét cong kín" },
    { order: 2, d: "M 65 65 L 65 135 C 65 146 52 146 45 138 L 40 130", start: { x: 65, y: 65 }, dir: "down-loop", label: "Nét khuyết dưới" }
  ],
  h: [
    { order: 1, d: "M 32 108 L 32 35 C 32 25 45 25 45 40 L 45 108", start: { x: 32, y: 108 }, dir: "up-down", label: "Nét khuyết trên" },
    { order: 2, d: "M 45 85 C 50 68 68 68 70 82 L 70 105 C 70 112 76 114 80 110", start: { x: 45, y: 85 }, dir: "right-down", label: "Nét móc hai đầu" }
  ],
  i: [
    { order: 1, d: "M 38 80 L 48 65 L 48 105 C 48 112 55 114 60 110", start: { x: 38, y: 80 }, dir: "up-down", label: "Nét móc ngược" },
    { order: 2, d: "M 48 52 A 2 2 0 1 1 48 50", start: { x: 48, y: 51 }, dir: "dot", label: "Dấu chấm" }
  ],
  k: [
    { order: 1, d: "M 32 108 L 32 35 C 32 25 45 25 45 40 L 45 108", start: { x: 32, y: 108 }, dir: "up-down", label: "Nét khuyết trên" },
    { order: 2, d: "M 68 68 L 46 88 L 68 110", start: { x: 68, y: 68 }, dir: "in-out", label: "Nét thắt giữa" }
  ],
  l: [
    { order: 1, d: "M 35 108 L 35 35 C 35 24 50 24 50 38 L 50 105 C 50 114 62 114 70 108", start: { x: 35, y: 108 }, dir: "up-loop", label: "Nét khuyết trên dài" }
  ],
  m: [
    { order: 1, d: "M 25 78 C 30 68 38 68 40 80 L 40 108", start: { x: 25, y: 78 }, dir: "down", label: "Nét móc xuôi 1" },
    { order: 2, d: "M 40 85 C 46 68 56 68 58 80 L 58 108", start: { x: 40, y: 85 }, dir: "down", label: "Nét móc xuôi 2" },
    { order: 3, d: "M 58 85 C 64 68 76 68 78 82 L 78 105 C 78 112 84 114 88 110", start: { x: 58, y: 85 }, dir: "down-hook", label: "Nét móc hai đầu" }
  ],
  n: [
    { order: 1, d: "M 32 78 C 38 68 46 68 48 80 L 48 108", start: { x: 32, y: 78 }, dir: "down", label: "Nét móc xuôi" },
    { order: 2, d: "M 48 85 C 55 68 68 68 70 82 L 70 105 C 70 112 76 114 80 110", start: { x: 48, y: 85 }, dir: "down-hook", label: "Nét móc hai đầu" }
  ],
  o: [
    { order: 1, d: "M 52 64 C 35 64 26 80 26 92 C 26 106 36 114 50 114 C 66 114 74 104 74 90 C 74 74 65 64 52 64 Z", start: { x: 50, y: 64 }, dir: "counter-clockwise", label: "Nét cong kín" }
  ],
  oo: [
    { order: 1, d: "M 52 64 C 35 64 26 80 26 92 C 26 106 36 114 50 114 C 66 114 74 104 74 90 C 74 74 65 64 52 64 Z", start: { x: 50, y: 64 }, dir: "counter-clockwise", label: "Nét cong kín" },
    { order: 2, d: "M 40 54 L 51 44 L 62 54", start: { x: 40, y: 54 }, dir: "up-down", label: "Dấu nón" }
  ],
  ow: [
    { order: 1, d: "M 52 64 C 35 64 26 80 26 92 C 26 106 36 114 50 114 C 66 114 74 104 74 90 C 74 74 65 64 52 64 Z", start: { x: 50, y: 64 }, dir: "counter-clockwise", label: "Nét cong kín" },
    { order: 2, d: "M 66 66 C 72 60 76 65 72 74", start: { x: 66, y: 66 }, dir: "hook", label: "Dấu râu" }
  ],
  p: [
    { order: 1, d: "M 32 85 L 42 66 L 42 140", start: { x: 32, y: 85 }, dir: "down", label: "Nét xiên & thẳng đứng" },
    { order: 2, d: "M 42 78 C 50 64 70 64 70 82 C 70 96 52 108 42 100", start: { x: 42, y: 78 }, dir: "right-curve", label: "Nét móc hai đầu khép" }
  ],
  q: [
    { order: 1, d: "M 65 75 C 60 62 40 62 35 75 C 28 90 28 100 35 110 C 42 118 60 118 65 105 Z", start: { x: 62, y: 70 }, dir: "counter-clockwise", label: "Nét cong kín" },
    { order: 2, d: "M 65 65 L 65 140", start: { x: 65, y: 65 }, dir: "down", label: "Nét thẳng dài" }
  ],
  r: [
    { order: 1, d: "M 30 110 L 38 62 C 45 58 48 68 55 68 L 68 70 C 72 82 72 104 76 110", start: { x: 30, y: 110 }, dir: "up-loop-down", label: "Nét thắt trên & móc" }
  ],
  s: [
    { order: 1, d: "M 30 110 L 46 62 C 54 62 68 70 62 82 C 55 92 38 98 42 110 L 68 110", start: { x: 30, y: 110 }, dir: "up-twist", label: "Nét cong thắt" }
  ],
  t: [
    { order: 1, d: "M 32 85 L 48 48 L 48 105 C 48 112 55 114 62 110", start: { x: 32, y: 85 }, dir: "up-down", label: "Nét móc ngược" },
    { order: 2, d: "M 38 65 L 60 65", start: { x: 38, y: 65 }, dir: "right", label: "Nét gạch ngang" }
  ],
  u: [
    { order: 1, d: "M 30 82 L 40 66 L 40 100 C 40 112 58 112 60 100 L 60 66", start: { x: 30, y: 82 }, dir: "down-up", label: "Nét móc ngược rộng" },
    { order: 2, d: "M 60 66 L 60 105 C 60 112 66 114 72 110", start: { x: 60, y: 66 }, dir: "down", label: "Nét móc ngược" }
  ],
  uw: [
    { order: 1, d: "M 30 82 L 40 66 L 40 100 C 40 112 58 112 60 100 L 60 66", start: { x: 30, y: 82 }, dir: "down-up", label: "Nét móc ngược rộng" },
    { order: 2, d: "M 60 66 L 60 105 C 60 112 66 114 72 110", start: { x: 60, y: 66 }, dir: "down", label: "Nét móc ngược" },
    { order: 3, d: "M 62 66 C 68 60 74 64 70 72", start: { x: 62, y: 66 }, dir: "hook", label: "Dấu râu" }
  ],
  v: [
    { order: 1, d: "M 30 76 C 36 66 45 66 48 76 L 54 100 C 58 112 66 112 70 100 C 72 92 78 74 80 66", start: { x: 30, y: 76 }, dir: "down-up", label: "Nét móc hai đầu & thắt" }
  ],
  x: [
    { order: 1, d: "M 62 72 C 55 62 38 64 34 82 C 30 96 38 110 52 110", start: { x: 62, y: 72 }, dir: "left-c", label: "Nét cong hở phải" },
    { order: 2, d: "M 42 72 C 48 62 66 64 70 82 C 74 96 66 110 52 110", start: { x: 42, y: 72 }, dir: "right-c", label: "Nét cong hở trái" }
  ],
  y: [
    { order: 1, d: "M 32 82 L 42 66 L 42 100 C 42 112 56 112 60 100 L 60 66", start: { x: 32, y: 82 }, dir: "down-up", label: "Nét móc ngược rộng" },
    { order: 2, d: "M 60 66 L 60 135 C 60 146 48 146 42 138 L 38 130", start: { x: 60, y: 66 }, dir: "down-loop", label: "Nét khuyết dưới" }
  ]
};

const strokesFileContent = `// Magic World Strokes Guide (29 Lowercase Letters)
window.MagicWorld = window.MagicWorld || {};
window.MagicWorld.Strokes = ${JSON.stringify(STROKES_DATA, null, 2)};
`;
fs.writeFileSync(path.join('js', 'data', 'strokes.js'), strokesFileContent, 'utf8');
console.log('Written strokes.js with 29 letter stroke guides');
console.log('ALL DATA FILES GENERATED SUCCESSFULLY!');


