import type { LanguageItem } from "./languagePool";

export interface AudioEngineOptions {
  onPlayStateChange?: (isPlaying: boolean) => void;
  onWaveformUpdate?: (bars: number[]) => void;
  onError?: (msg: string) => void;
}

/**
 * Ensures SpeechSynthesis voices are loaded. In many browsers, getVoices()
 * returns [] on first call because voices load asynchronously. We must wait
 * for the `voiceschanged` event before voices become available.
 */
function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    // Voices not yet loaded — wait for the voiceschanged event
    const onReady = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onReady);
      clearTimeout(fallbackTimer);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", onReady);
    // Safety: resolve with whatever we have after 3 seconds
    const fallbackTimer = setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onReady);
      resolve(window.speechSynthesis.getVoices());
    }, 3000);
  });
}

export class LanguageAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.85;
  private waveformTimer: number | null = null;
  private barCount: number = 20;
  private options: AudioEngineOptions;
  private currentItem: LanguageItem | null = null;
  private voicesReady: Promise<SpeechSynthesisVoice[]>;

  constructor(options: AudioEngineOptions = {}) {
    this.options = options;
    // Kick off voice loading immediately so they're ready when needed
    this.voicesReady = ensureVoicesLoaded();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.isMuted && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public async play(item: LanguageItem) {
    this.stop();
    this.currentItem = item;

    if (this.isMuted) {
      // Simulate playback if muted
      this.setPlayingState(true);
      this.startWaveformSimulation();
      setTimeout(() => this.stop(), 4000);
      return;
    }

    // Primary: Use SpeechSynthesis (most reliable — no network dependencies)
    const speechOk = await this.playSpeechSynthesis(item);
    if (speechOk) return;

    // Secondary: Try Google Translate TTS as HTML5 Audio
    const shortLang = (item.langCode || "en").slice(0, 2);
    const phrase = item.samplePhrase || `Hello, can you guess that I am speaking ${item.language}?`;
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${shortLang}&q=${encodeURIComponent(phrase)}`;

    const audioUrls = [ttsUrl, item.openSourceAudioUrl, item.audio].filter(Boolean) as string[];

    for (const url of audioUrls) {
      try {
        const success = await this.tryPlayAudioUrl(url);
        if (success) return;
      } catch {
        // Continue to next URL
      }
    }

    // Last resort: Web Audio beep tones
    console.info(`All audio methods failed for ${item.language}, playing beep fallback.`);
    this.playBeepFallback();
  }

  /**
   * Primary audio method: SpeechSynthesis with proper voice loading.
   * Returns true if speech started successfully, false otherwise.
   */
  private async playSpeechSynthesis(item: LanguageItem): Promise<boolean> {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return false;
    }

    // Wait for voices to be loaded
    const voices = await this.voicesReady;

    // Cancel any existing utterance
    window.speechSynthesis.cancel();

    // Chrome has a bug where cancel() needs a small delay before speak()
    await new Promise((r) => setTimeout(r, 80));

    if (typeof window === "undefined" || !window.speechSynthesis) {
      return false;
    }

    const phrase = item.samplePhrase || `Hello, can you guess that I am speaking ${item.language}?`;
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.volume = this.isMuted ? 0 : this.volume;
    utterance.rate = 0.95;

    const shortLang = (item.langCode || "en").slice(0, 2).toLowerCase();

    // Try to find a matching voice for the language
    const matchingVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith(shortLang)
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
      utterance.lang = matchingVoice.lang;
    } else {
      // Fall back to English voice, or just set the lang and hope the browser picks one
      const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
      if (enVoice) {
        utterance.voice = enVoice;
        utterance.lang = enVoice.lang;
      } else {
        utterance.lang = shortLang;
      }
    }

    return new Promise<boolean>((resolve) => {
      let resolved = false;

      // Watchdog: if speech hasn't started within 3 seconds, give up
      const watchdog = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn(`SpeechSynthesis did not start within 3s for ${item.language}.`);
          window.speechSynthesis.cancel();
          resolve(false);
        }
      }, 3000);

      utterance.onstart = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(watchdog);
        this.setPlayingState(true);
        this.startWaveformSimulation();
        resolve(true);
      };

      utterance.onend = () => {
        clearTimeout(watchdog);
        this.stop();
      };

      utterance.onerror = (e) => {
        clearTimeout(watchdog);
        if (!resolved) {
          resolved = true;
          console.warn("SpeechSynthesis error:", e.error);
          resolve(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  private tryPlayAudioUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.referrerPolicy = "no-referrer";
      // Do NOT set crossOrigin — third-party servers (Google TTS, Wikimedia)
      // don't return CORS headers and audio will fail to load in CORS mode.
      audio.volume = this.isMuted ? 0 : this.volume;
      audio.src = url;

      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve(false);
        }
      }, 5000);

      const cleanup = () => {
        clearTimeout(timeout);
        audio.onplay = null;
        audio.onended = null;
        audio.onerror = null;
      };

      audio.onplay = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.audio = audio;
        this.setPlayingState(true);
        this.startWaveformSimulation();
        resolve(true);
      };

      audio.onended = () => {
        cleanup();
        this.stop();
      };

      audio.onerror = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(false);
      };

      audio.play().catch(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(false);
      });
    });
  }

  private playBeepFallback() {
    this.setPlayingState(true);
    this.startWaveformSimulation();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        setTimeout(() => this.stop(), 1600);
        return;
      }
      const ctx = new AudioCtx();
      // Unlock suspended AudioContext required by modern browser autoplay policies
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Play a 5-tone harmonic melodic sequence simulating speech syllables
      const notes = [261.63, 329.63, 392.00, 523.25, 440.00];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.3);
        gain.gain.setValueAtTime(0, now + i * 0.3);
        gain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.volume * 0.4, now + i * 0.3 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 0.28);
        osc.connect(gain);
        // Connect to the default audio destination so it's actually audible!
        gain.connect(ctx.destination);
        osc.start(now + i * 0.3);
        osc.stop(now + i * 0.3 + 0.28);
      });
      setTimeout(() => this.stop(), 1600);
    } catch {
      setTimeout(() => this.stop(), 1600);
    }
  }

  public stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      if (this.audio.srcObject) {
        this.audio.srcObject = null;
      }
      this.audio = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.stopWaveformSimulation();
    this.setPlayingState(false);
  }

  private setPlayingState(playing: boolean) {
    if (this.isPlaying !== playing) {
      this.isPlaying = playing;
      this.options.onPlayStateChange?.(playing);
    }
  }

  private startWaveformSimulation() {
    this.stopWaveformSimulation();
    this.waveformTimer = window.setInterval(() => {
      const bars = Array.from({ length: this.barCount }, (_, i) => {
        // Create organic wave pattern with variation
        const base = Math.sin((Date.now() / 200) + (i * 0.5)) * 30 + 50;
        const rand = Math.random() * 35;
        return Math.min(100, Math.max(15, Math.round(base + rand)));
      });
      this.options.onWaveformUpdate?.(bars);
    }, 80);
  }

  private stopWaveformSimulation() {
    if (this.waveformTimer !== null) {
      clearInterval(this.waveformTimer);
      this.waveformTimer = null;
    }
    // Return flat resting bars
    const flatBars = Array.from({ length: this.barCount }, () => 15);
    this.options.onWaveformUpdate?.(flatBars);
  }
}
