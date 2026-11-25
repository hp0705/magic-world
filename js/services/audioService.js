// Magic World Audio Service (Native Vietnamese Audio + Web Audio API Synthesizer)
window.MagicWorld = window.MagicWorld || {};

class AudioService {
  constructor() {
    this.audioCtx = null;
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    this.selectedVoice = null;
    this.hasVietnameseSpeechVoice = false;
    this.voiceRate = 0.9;
    this.voicePitch = 1.0;
    this.sfxVolume = 0.9;
    this.unlocked = false;
    this.childName = "Bé Mây";
    this.currentAudioElement = null;
    this.currentUtterance = null;

    // TTS Phonetic overrides for Northern Vietnamese pronunciation & spelling tokens
    this.ttsOverrides = {
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
      'gi': 'gi',
      'i ngắn': 'i',
      'i dài': 'i'
    };

    this.initAudioContext();
    this.loadVoices();
    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  initAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.audioCtx = new AudioContextClass();
    }
  }

  unlockAudio() {
    if (this.unlocked) return;
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    // Safari & iPad HTML5 Audio unlock
    if (!this.sharedAudio) {
      this.sharedAudio = document.getElementById('sharedGameAudio') || new Audio();
      this.sharedAudio.setAttribute('playsinline', '');
      this.sharedAudio.setAttribute('webkit-playsinline', '');
    }
    try {
      this.sharedAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      const p = this.sharedAudio.play();
      if (p !== undefined) {
        p.then(() => {
          this.sharedAudio.pause();
          this.unlocked = true;
        }).catch(() => {});
      }
    } catch (e) {}

    // Safari speech unlock
    if (this.synth) {
      try {
        const dummy = new SpeechSynthesisUtterance('');
        this.synth.speak(dummy);
      } catch (e) {}
    }
    this.unlocked = true;
    this.playSparkle();
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    
    // STRICT check for real Vietnamese voices
    const viVoices = this.voices.filter(v => 
      (v.lang && (v.lang.toLowerCase().startsWith('vi') || v.lang.toLowerCase().includes('vi-vn'))) ||
      (v.name && (v.name.toLowerCase().includes('vietnam') || v.name.toLowerCase().includes('tiếng việt') || v.name.toLowerCase().includes('hoaimy') || v.name.toLowerCase().includes('namminh') || v.name.toLowerCase().includes('linh')))
    );

    if (viVoices.length > 0) {
      const preferred = viVoices.find(v => 
        v.name.toLowerCase().includes('linh') || 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('hoaimy') ||
        v.name.toLowerCase().includes('natural')
      );
      this.selectedVoice = preferred || viVoices[0];
      this.hasVietnameseSpeechVoice = true;
    } else {
      // CRITICAL FIX: NEVER fallback to Japanese (Haruka) or English (Zira) voices!
      this.selectedVoice = null;
      this.hasVietnameseSpeechVoice = false;
    }
  }

  setChildName(name) {
    if (name && name.trim()) {
      this.childName = name.trim();
    }
  }

  replaceTokens(text) {
    if (!text) return '';
    let result = text.replace(/\{ten\}/g, this.childName);
    if (this.childName !== 'Bé Mây') {
      result = result.replace(/Bé Mây/g, this.childName);
    }
    return result;
  }

  // Speak sentence or token using Pre-cached Static Audio, Native Vietnamese Audio (/api/tts), or SpeechSynthesis
  async speak(text, options = {}) {
    this.unlockAudio();
    this.stopSpeaking();

    let processedText = this.replaceTokens(text).trim();
    if (!processedText) return Promise.resolve();

    const lower = processedText.toLowerCase();
    if (this.ttsOverrides[lower]) {
      processedText = this.ttsOverrides[lower];
    }

    // 1. Direct Static Audio Manifest Lookup (100% works on GitHub Pages, iPad, Localhost, Offline!)
    const manifest = (window.MagicWorld && window.MagicWorld.AudioManifest) || {};
    const staticAudioPath = manifest[processedText] || manifest[text] || manifest[text.trim()] || manifest[lower];

    if (staticAudioPath) {
      return new Promise((resolve) => {
        if (!this.sharedAudio) {
          this.sharedAudio = document.getElementById('sharedGameAudio') || new Audio();
          this.sharedAudio.setAttribute('playsinline', '');
          this.sharedAudio.setAttribute('webkit-playsinline', '');
        }
        const audio = this.sharedAudio;
        this.currentAudioElement = audio;

        audio.onended = () => {
          this.currentAudioElement = null;
          resolve();
        };

        audio.onerror = () => {
          this.currentAudioElement = null;
          // Fallback to SpeechSynthesis ONLY if Vietnamese voice exists
          if (this.hasVietnameseSpeechVoice) {
            this.speakWithSpeechSynthesis(processedText, options).then(resolve);
          } else {
            resolve();
          }
        };

        audio.src = staticAudioPath;
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name === 'AbortError') return;
            console.warn('Playback error:', err);
            if (this.hasVietnameseSpeechVoice) {
              this.speakWithSpeechSynthesis(processedText, options).then(resolve);
            } else {
              resolve();
            }
          });
        }
      });
    }

    // 2. If running local server, fallback to /api/tts endpoint
    const isLocalServer = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' || 
                          window.location.hostname.startsWith('192.168.');
    if (isLocalServer && window.location.protocol.startsWith('http')) {
      return new Promise((resolve) => {
        if (!this.sharedAudio) {
          this.sharedAudio = document.getElementById('sharedGameAudio') || new Audio();
          this.sharedAudio.setAttribute('playsinline', '');
          this.sharedAudio.setAttribute('webkit-playsinline', '');
        }
        const audio = this.sharedAudio;
        this.currentAudioElement = audio;
        const audioUrl = `/api/tts?text=${encodeURIComponent(processedText)}`;

        audio.onended = () => {
          this.currentAudioElement = null;
          resolve();
        };

        audio.onerror = () => {
          this.currentAudioElement = null;
          if (this.hasVietnameseSpeechVoice) {
            this.speakWithSpeechSynthesis(processedText, options).then(resolve);
          } else {
            resolve();
          }
        };

        audio.src = audioUrl;
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name === 'AbortError') return;
            if (this.hasVietnameseSpeechVoice) {
              this.speakWithSpeechSynthesis(processedText, options).then(resolve);
            } else {
              resolve();
            }
          });
        }
      });
    }

    // 3. Fallback: only use speech synthesis if real Vietnamese voice exists
    if (this.hasVietnameseSpeechVoice) {
      return this.speakWithSpeechSynthesis(processedText, options);
    }

    // Never speak foreign language (Japanese/English) for Vietnamese words
    return Promise.resolve();
  }

  speakWithSpeechSynthesis(processedText, options = {}) {
    if (!this.synth || !this.hasVietnameseSpeechVoice) return Promise.resolve();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(processedText);
      this.currentUtterance = utterance;

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        utterance.lang = this.selectedVoice.lang || 'vi-VN';
      } else {
        utterance.lang = 'vi-VN';
      }

      const role = options.who || 'default';
      let rate = options.rate !== undefined ? options.rate : this.voiceRate;
      let pitch = options.pitch !== undefined ? options.pitch : this.voicePitch;

      if (role === 'co') {
        rate *= 0.92;
        pitch *= 1.02;
      } else if (role === 'lumi') {
        rate *= 1.1;
        pitch *= 1.35;
      }

      utterance.rate = Math.max(0.5, Math.min(2.0, rate));
      utterance.pitch = Math.max(0.5, Math.min(2.0, pitch));
      utterance.volume = 1.0;

      utterance.onboundary = (event) => {
        if (event.name === 'word' && options.onWord) {
          options.onWord(event.charIndex, event.charLength);
        }
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        resolve();
      };

      try {
        this.synth.speak(utterance);
      } catch (e) {
        resolve();
      }
    });
  }

  stopSpeaking() {
    // Stop HTML5 audio element
    if (this.sharedAudio) {
      try {
        this.sharedAudio.pause();
        this.sharedAudio.currentTime = 0;
      } catch (e) {}
    }
    if (this.currentAudioElement && this.currentAudioElement !== this.sharedAudio) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (e) {}
      this.currentAudioElement = null;
    }
    // Stop Web Speech Synthesis
    if (this.synth && this.synth.speaking) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    this.currentUtterance = null;
  }

  // --- SYNTHESIZED SOUND EFFECTS (Web Audio API) ---

  playChime() {
    if (!this.audioCtx) return;
    this.unlockAudio();
    const now = this.audioCtx.currentTime;
    
    // Shimmering pentatonic chord
    const freqs = [659.25, 830.61, 987.77, 1318.51];
    freqs.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.18 * this.sfxVolume, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.9);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 1.0);
    });
  }

  playBuBu() {
    if (!this.audioCtx) return;
    this.unlockAudio();
    const now = this.audioCtx.currentTime;

    const notes = [
      { freq: 220, start: 0, dur: 0.18 },
      { freq: 174.6, start: 0.22, dur: 0.24 }
    ];

    notes.forEach(note => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.start);
      osc.frequency.exponentialRampToValueAtTime(note.freq * 0.9, now + note.start + note.dur);

      gain.gain.setValueAtTime(0, now + note.start);
      gain.gain.linearRampToValueAtTime(0.25 * this.sfxVolume, now + note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur + 0.05);
    });
  }

  playSparkle() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(2400 + Math.random() * 600, now + 0.15);

    gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playPop() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playTick() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(1240, now + 0.045);

    gain.gain.setValueAtTime(0.14 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  }

  playFanfare() {
    if (!this.audioCtx) return;
    this.unlockAudio();
    const now = this.audioCtx.currentTime;
    const melody = [
      { freq: 523.25, time: 0, dur: 0.15 },
      { freq: 659.25, time: 0.15, dur: 0.15 },
      { freq: 783.99, time: 0.30, dur: 0.15 },
      { freq: 1046.50, time: 0.45, dur: 0.5 }
    ];

    melody.forEach(note => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(0.22 * this.sfxVolume, now + note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur + 0.05);
    });
  }
}

window.MagicWorld.AudioService = new AudioService();
