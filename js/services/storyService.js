// Magic World Story Service (Story Theater, Karaoke Subtitles, Scene Progression)
window.MagicWorld = window.MagicWorld || {};

class StoryService {
  constructor() {
    this.currentStory = null;
    this.currentSceneIndex = 0;
    this.currentLineIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.highlightCharIndex = -1;
    this.highlightCharLength = 0;
    this.onStateChange = null;
  }

  loadStory(storyId) {
    const stories = window.MagicWorld.Stories || [];
    this.currentStory = stories.find(s => s.id === storyId) || stories[0];
    this.currentSceneIndex = 0;
    this.currentLineIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.highlightCharIndex = -1;
  }

  play(storyId, onStateChangeCallback) {
    if (storyId) {
      this.loadStory(storyId);
    }
    this.onStateChange = onStateChangeCallback;
    this.isPlaying = true;
    this.isPaused = false;
    this.playCurrentLine();
  }

  getCurrentScene() {
    if (!this.currentStory || !this.currentStory.scenes) return null;
    return this.currentStory.scenes[this.currentSceneIndex] || null;
  }

  getCurrentLine() {
    const scene = this.getCurrentScene();
    if (!scene || !scene.lines) return null;
    return scene.lines[this.currentLineIndex] || null;
  }

  async playCurrentLine() {
    if (!this.isPlaying || this.isPaused) return;
    const scene = this.getCurrentScene();
    const line = this.getCurrentLine();

    if (!scene || !line) {
      this.finishStory();
      return;
    }

    if (this.onStateChange) this.onStateChange('line-start');

    const audioService = window.MagicWorld.AudioService;
    if (audioService) {
      await audioService.speak(line.text, {
        who: line.who,
        onWord: (charIndex, charLength) => {
          this.highlightCharIndex = charIndex;
          this.highlightCharLength = charLength;
          if (this.onStateChange) this.onStateChange('word-boundary');
        }
      });
    } else {
      // Fallback delay if audioService unavailable
      await new Promise(r => setTimeout(r, 2500));
    }

    if (!this.isPlaying || this.isPaused) return;

    // Line finished
    this.highlightCharIndex = -1;
    if (this.currentLineIndex < scene.lines.length - 1) {
      this.currentLineIndex++;
      setTimeout(() => this.playCurrentLine(), 600);
    } else {
      // Scene finished
      if (this.currentSceneIndex < this.currentStory.scenes.length - 1) {
        setTimeout(() => {
          this.nextScene();
        }, 1200);
      } else {
        // Story finished
        this.finishStory();
      }
    }
  }

  pause() {
    this.isPaused = true;
    if (window.MagicWorld.AudioService) {
      window.MagicWorld.AudioService.stopSpeaking();
    }
    if (this.onStateChange) this.onStateChange('paused');
  }

  resume() {
    if (!this.isPlaying) return;
    this.isPaused = false;
    this.playCurrentLine();
    if (this.onStateChange) this.onStateChange('resumed');
  }

  repeatScene() {
    if (window.MagicWorld.AudioService) {
      window.MagicWorld.AudioService.stopSpeaking();
    }
    this.currentLineIndex = 0;
    this.isPaused = false;
    this.playCurrentLine();
  }

  nextScene() {
    if (!this.currentStory) return;
    if (window.MagicWorld.AudioService) {
      window.MagicWorld.AudioService.stopSpeaking();
    }
    if (this.currentSceneIndex < this.currentStory.scenes.length - 1) {
      this.currentSceneIndex++;
      this.currentLineIndex = 0;
      this.isPaused = false;
      this.playCurrentLine();
    } else {
      this.finishStory();
    }
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.highlightCharIndex = -1;
    if (window.MagicWorld.AudioService) {
      window.MagicWorld.AudioService.stopSpeaking();
    }
    if (this.onStateChange) this.onStateChange('stopped');
  }

  finishStory() {
    this.isPlaying = false;
    this.isPaused = false;
    this.highlightCharIndex = -1;
    if (window.MagicWorld.ProgressService && this.currentStory) {
      const sticker = window.MagicWorld.ProgressService.markStoryListened(this.currentStory.id);
      if (window.MagicWorld.AudioService) {
        window.MagicWorld.AudioService.playChime();
      }
      if (this.onStateChange) this.onStateChange('completed', { sticker });
    } else {
      if (this.onStateChange) this.onStateChange('completed', {});
    }
  }
}

window.MagicWorld.StoryService = new StoryService();
