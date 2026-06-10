export class Sound {
  constructor(app) {
    this.app = app;
    this.enabled = true;
    this.volume = 0.7;
    this.audioContext = null;
  }

  init() {
    const initAudio = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
      }
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      document.removeEventListener("click", initAudio);
      document.removeEventListener("keydown", initAudio);
    };

    document.addEventListener("click", initAudio);
    document.addEventListener("keydown", initAudio);

    this.app.state.subscribe((newState) => {
      if (
        newState.settings?.soundEnabled !== undefined &&
        newState.settings.soundEnabled !== this.enabled
      ) {
        this.enabled = newState.settings.soundEnabled;
      }
    });
  }

  /**
   * Воспроизвести звук по имени
   * @param {"open"|"close"|"tp"|"sl"|"tick"|"error"|"click"} name
   */
  play(name) {
    if (!this.enabled || !this.audioContext) return;

    switch (name) {
      case "open":
        this._playMelody([500, 500, 500, 500], 0.1);
        break;
      case "tp":
        this._playMelody([950, 950, 950, 950], 0.1);
        break;
      case "sl":
        this._playMelody([100, 100, 100, 100], 0.1);
        break;
      case "tick":
        this._playBeep(1000, 0.05, "sine");
        break;
      case "start":
        this._playBeep(500, 0.5, "sine");
        break;
      case "stop":
        this._playMelody([700, 100], 0.1);
        break;
      default:
        this._playBeep(800, 0.1, "sine");
    }
  }

  /**
   * Простой однотональный сигнал
   */
  _playBeep(frequency, duration, type = "sine") {
    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration,
    );

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  /**
   * Последовательность нот (мелодия)
   */
  _playMelody(frequencies, noteDuration) {
    const ctx = this.audioContext;
    const startTime = ctx.currentTime;

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        freq,
        startTime + index * noteDuration,
      );

      gainNode.gain.setValueAtTime(
        this.volume,
        startTime + index * noteDuration,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + (index + 1) * noteDuration,
      );

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime + index * noteDuration);
      oscillator.stop(startTime + (index + 1) * noteDuration);
    });
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    this.app.state.set("settings.soundEnabled", enabled);
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
