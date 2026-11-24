// Magic World — Game Ghép Hình Băng Tuyết (Picture & Word Matching Memory Game)
window.MagicWorld = window.MagicWorld || {};

class MatchingGameService {
  constructor() {
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.totalPairs = 0;
    this.isLocked = false;
    this.onStateChange = null;
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

  // Start a new matching game from a pool of words
  startNewGame(wordsPool, pairCount = 4) {
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.isLocked = false;

    // Filter words that have clear emojis
    const validWords = wordsPool.filter(w => w.emoji && w.emoji !== '✨');
    const selectedWords = this.shuffle(validWords.length >= pairCount ? validWords : wordsPool).slice(0, pairCount);
    this.totalPairs = selectedWords.length;

    const cards = [];
    selectedWords.forEach((item, idx) => {
      // Card 1: Picture Card
      cards.push({
        id: `pic_${idx}`,
        pairId: idx,
        type: 'picture',
        text: item.text,
        emoji: item.emoji,
        isFlipped: false,
        isMatched: false
      });

      // Card 2: Word Card
      cards.push({
        id: `word_${idx}`,
        pairId: idx,
        type: 'word',
        text: item.text,
        emoji: item.emoji,
        isFlipped: false,
        isMatched: false
      });
    });

    this.cards = this.shuffle(cards);
    return this.cards;
  }

  // Handle card click
  flipCard(cardIndex) {
    if (this.isLocked) return null;
    const card = this.cards[cardIndex];
    if (!card || card.isFlipped || card.isMatched) return null;

    card.isFlipped = true;
    this.flippedCards.push({ index: cardIndex, card });

    const audioService = window.MagicWorld.AudioService;
    if (audioService) {
      audioService.playPop();
      // Speak the word
      audioService.speak(card.text);
    }

    if (this.flippedCards.length === 2) {
      this.isLocked = true;
      const [first, second] = this.flippedCards;

      if (first.card.pairId === second.card.pairId) {
        // MATCH!
        first.card.isMatched = true;
        second.card.isMatched = true;
        this.matchedPairs++;
        this.flippedCards = [];
        this.isLocked = false;

        const isWin = (this.matchedPairs >= this.totalPairs);
        return {
          status: 'match',
          card1: first.index,
          card2: second.index,
          isWin: isWin
        };
      } else {
        // NO MATCH
        return {
          status: 'mismatch',
          card1: first.index,
          card2: second.index
        };
      }
    }

    return { status: 'flipped', card: cardIndex };
  }

  resetMismatched() {
    this.flippedCards.forEach(item => {
      item.card.isFlipped = false;
    });
    this.flippedCards = [];
    this.isLocked = false;
  }
}

window.MagicWorld.MatchingGameService = new MatchingGameService();
