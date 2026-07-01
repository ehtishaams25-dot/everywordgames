import type { GameConfig } from "@/data/games";
import type { LanguageItem } from "./languagePool";
import {
  loadLanguageDatabase,
  getLanguagePool,
  pickRandomLanguage,
  getMultipleChoiceOptions,
  checkLanguageGuess,
} from "./languagePool";
import { LanguageAudioEngine } from "./audioEngine";
import { getLanguageStats, recordLanguageRound, resetLanguageStats } from "./statsStore";
import { renderHomeHero, bindHomeHero } from "../components/HomeHero";
import { renderAudioPlayer, bindAudioPlayer } from "../components/AudioPlayer";
import { renderAnswerPanel, bindAnswerPanel } from "../components/AnswerPanel";
import { renderResultModal, bindResultModal } from "../components/ResultModal";
import {
  renderStatsModal,
  renderSettingsModal,
  renderLeaderboardModal,
  bindStatsModal,
  bindSettingsModal,
  bindLeaderboardModal,
} from "../components/Modals";
import { showLanguageToast, triggerConfetti } from "../components/Toast";

export async function mountLanguageGame(root: HTMLElement, gameConfig: GameConfig) {
  let mode: "classic" | "daily" | "endless" | "speed" = (gameConfig.mode as any) || "classic";
  let difficulty: "Easy" | "Medium" | "Hard" | "Expert" = (gameConfig.difficulty as any) || "Medium";
  let screen: "home" | "playing" = "home";

  let allLanguages: LanguageItem[] = [];
  let pool: LanguageItem[] = [];
  let currentItem: LanguageItem | null = null;
  let mcqOptions: LanguageItem[] = [];

  let run = 0;
  let attempts: string[] = [];
  let isWon = false;
  let isDone = false;
  let roundStartTime = Date.now();
  let replays = 0;
  let pointsEarnedThisRound = 0;

  // Endless mode tracking
  let endlessLives = 3;
  let endlessScore = 0;

  // Speed mode tracking
  let speedTimeRemaining = 60;
  let speedScore = 0;
  let speedTimer: number | null = null;

  // Modals state
  let activeModal: "none" | "result" | "stats" | "settings" | "leaderboard" = "none";
  let waveformBars: number[] = Array.from({ length: 20 }, () => 15);

  root.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1rem;">
      <div class="v2-spinner"></div>
      <p class="muted" style="font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; font-size: 1.25rem;">Loading Guess the Language...</p>
    </div>
  `;

  try {
    allLanguages = await loadLanguageDatabase();
    pool = getLanguagePool(allLanguages, difficulty);
  } catch (err) {
    root.innerHTML = `<p class="muted" style="color: var(--danger);">Error loading language dataset: ${String(err)}</p>`;
    return;
  }

  const audioEngine = new LanguageAudioEngine({
    onPlayStateChange: (isPlaying) => {
      const btn = root.querySelector<HTMLButtonElement>("#lang-play-btn");
      if (btn) {
        btn.className = `button lang-play-btn ${isPlaying ? "playing" : ""}`;
        const icon = btn.querySelector(".play-icon");
        const lbl = btn.querySelector(".play-label");
        if (icon) icon.textContent = isPlaying ? "⏸️" : "▶️";
        if (lbl) lbl.textContent = isPlaying ? "Listening..." : "Play Audio";
      }
    },
    onWaveformUpdate: (bars) => {
      waveformBars = bars;
      const container = root.querySelector<HTMLDivElement>(".waveform-container");
      if (container) {
        const barEls = container.querySelectorAll<HTMLDivElement>(".waveform-bar");
        barEls.forEach((el, idx) => {
          if (bars[idx] !== undefined) {
            el.style.height = `${bars[idx]}%`;
            el.classList.toggle("active", audioEngine.getIsPlaying());
          }
        });
      }
    },
    onError: (msg) => {
      showLanguageToast(root, msg, "warning");
    },
  });

  const stopSpeedTimer = () => {
    if (speedTimer !== null) {
      clearInterval(speedTimer);
      speedTimer = null;
    }
  };

  const startSpeedTimer = () => {
    stopSpeedTimer();
    speedTimeRemaining = 60;
    speedScore = 0;
    speedTimer = window.setInterval(() => {
      speedTimeRemaining -= 1;
      const timerEl = root.querySelector<HTMLElement>(".speed-timer-val");
      if (timerEl) timerEl.textContent = `${speedTimeRemaining}s`;

      if (speedTimeRemaining <= 0) {
        stopSpeedTimer();
        audioEngine.stop();
        isDone = true;
        activeModal = "leaderboard";
        showLanguageToast(root, `⏰ Time's up! You guessed ${speedScore} languages!`, "success", 4000);
        render();
      }
    }, 1000);
  };

  const startNewRound = (autoPlayAudio: boolean = true) => {
    run += 1;
    attempts = [];
    isWon = false;
    isDone = false;
    replays = 0;
    pointsEarnedThisRound = 0;
    roundStartTime = Date.now();
    activeModal = "none";

    if (mode === "endless" && endlessLives <= 0) {
      endlessLives = 3;
      endlessScore = 0;
    }

    if (mode === "speed" && speedTimer === null && screen === "playing") {
      startSpeedTimer();
    }

    const isDaily = mode === "daily";
    currentItem = pickRandomLanguage(pool, run, isDaily);

    const optionCount = difficulty === "Easy" ? 4 : difficulty === "Medium" ? 6 : difficulty === "Expert" ? 8 : 4;
    mcqOptions = getMultipleChoiceOptions(
      currentItem,
      allLanguages,
      optionCount,
      difficulty === "Expert"
    );

    render();

    if (autoPlayAudio && screen === "playing" && currentItem) {
      setTimeout(() => {
        if (currentItem) audioEngine.play(currentItem);
      }, 300);
    }
  };

  const handleGuessSubmit = (guess: string) => {
    if (isDone || !currentItem) return;

    attempts.push(guess);
    isWon = checkLanguageGuess(guess, currentItem.language);
    isDone = true; // 1 attempt per language clip: wrong guess reveals answer!

    const elapsedSec = (Date.now() - roundStartTime) / 1000;

    if (isWon) {
      pointsEarnedThisRound = Math.max(0, 100 - replays * 10);
      if (mode === "endless") {
        endlessScore += 1;
        const stats = getLanguageStats();
        if ((stats.currentStreak + 1) % 3 === 0 || endlessScore % 5 === 0) {
          triggerConfetti();
        }
      } else if (mode === "speed") {
        speedScore += 1;
        triggerConfetti();
      } else {
        triggerConfetti();
      }
    } else {
      pointsEarnedThisRound = 0;
      if (mode === "endless") {
        endlessLives -= 1;
      }
    }

    audioEngine.stop();

    // Record stats
    const stats = recordLanguageRound(
      isWon,
      pointsEarnedThisRound,
      elapsedSec,
      difficulty,
      mode === "daily",
      isWon ? "🟩 1/1" : "🟥 0/1"
    );

    if (mode === "speed") {
      showLanguageToast(root, isWon ? `✅ Correct! (+100pts)` : `❌ Was: ${currentItem.language}`, isWon ? "success" : "warning", 1500);
      setTimeout(() => {
        if (speedTimeRemaining > 0) startNewRound(true);
      }, 1500);
    } else {
      activeModal = "result";
      render();
    }
  };

  const handleReplay = () => {
    if (isDone || !currentItem || audioEngine.getIsPlaying()) return;
    replays += 1;
    showLanguageToast(root, `🔄 Audio Replayed (-10 pts penalty)`, "info", 1800);
    audioEngine.play(currentItem);
    const replayBtn = root.querySelector<HTMLButtonElement>("#lang-replay-btn");
    if (replayBtn) {
      replayBtn.innerHTML = `🔄 Replay (${replays}) <span class="penalty-tag">-10pts</span>`;
    }
  };

  const handleSkip = () => {
    if (isDone || !currentItem) return;
    audioEngine.stop();
    showLanguageToast(root, `⏭️ Skipped! Was: ${currentItem.language} (0 pts)`, "warning", 2000);
    setTimeout(() => startNewRound(true), 500);
  };

  const render = () => {
    if (screen === "home") {
      root.innerHTML = renderHomeHero(mode, difficulty);
      bindHomeHero(
        root,
        (newMode) => {
          mode = newMode;
          render();
        },
        (newDiff) => {
          difficulty = newDiff;
          pool = getLanguagePool(allLanguages, difficulty);
          render();
        },
        () => {
          screen = "playing";
          startNewRound(true);
        },
        () => {
          activeModal = "stats";
          render();
        },
        () => {
          activeModal = "settings";
          render();
        },
        () => {
          activeModal = "leaderboard";
          render();
        }
      );
    } else {
      // Gameplay Screen
      if (!currentItem) {
        root.innerHTML = `<p class="muted">No language item loaded.</p>`;
        return;
      }

      const stats = getLanguageStats();
      const streak = stats.currentStreak;

      let statusbarHtml = `
        <div class="lang-game-topbar">
          <button class="button button-outline lang-back-btn" id="lang-back-home" title="Back to Home">
            ⬅️ Home
          </button>
          <div class="lang-top-badges">
            <span class="lang-stat-pill">🌟 Mode: <strong>${mode.toUpperCase()}</strong></span>
            <span class="lang-stat-pill">🎯 Diff: <strong>${difficulty}</strong></span>
            ${mode === "endless" ? `<span class="lang-stat-pill lives">❤️ Lives: <strong>${endlessLives}</strong></span>` : ""}
            ${mode === "speed" ? `<span class="lang-stat-pill speed">⏰ Time: <strong class="speed-timer-val">${speedTimeRemaining}s</strong></span>` : ""}
            <span class="lang-stat-pill streak">🔥 Streak: <strong>${streak}</strong></span>
            <span class="lang-stat-pill score">🏆 Score: <strong>${stats.totalPoints}</strong></span>
          </div>
          <div class="lang-top-actions">
            <button class="button button-outline icon-btn" id="lang-top-stats" title="Statistics">📊</button>
            <button class="button button-outline icon-btn" id="lang-top-settings" title="Settings">⚙️</button>
          </div>
        </div>
      `;

      root.innerHTML = `
        <div class="lang-game-stage">
          ${statusbarHtml}
          <div class="lang-stage-content">
            ${renderAudioPlayer(
              audioEngine.getIsPlaying(),
              audioEngine.getIsMuted(),
              audioEngine.getVolume(),
              waveformBars,
              replays,
              isDone,
              mode
            )}
            ${renderAnswerPanel(
              difficulty,
              mcqOptions,
              isDone,
              attempts[0],
              currentItem?.language
            )}
          </div>

          <!-- Modals Overlay -->
          ${activeModal === "result" && currentItem ? renderResultModal(isWon, currentItem, pointsEarnedThisRound, replays, mode, streak, endlessLives) : ""}
          ${activeModal === "stats" ? renderStatsModal(stats) : ""}
          ${activeModal === "settings" ? renderSettingsModal(audioEngine.getVolume(), audioEngine.getIsMuted()) : ""}
          ${activeModal === "leaderboard" ? renderLeaderboardModal(mode === "speed" ? speedScore : undefined) : ""}
        </div>
      `;

      // Bind topbar events
      root.querySelector("#lang-back-home")?.addEventListener("click", () => {
        stopSpeedTimer();
        audioEngine.stop();
        screen = "home";
        render();
      });
      root.querySelector("#lang-top-stats")?.addEventListener("click", () => {
        activeModal = "stats";
        render();
      });
      root.querySelector("#lang-top-settings")?.addEventListener("click", () => {
        activeModal = "settings";
        render();
      });

      // Bind audio player
      bindAudioPlayer(
        root,
        () => {
          if (audioEngine.getIsPlaying()) {
            audioEngine.stop();
          } else if (currentItem) {
            audioEngine.play(currentItem);
          }
        },
        handleReplay,
        (vol) => audioEngine.setVolume(vol),
        () => {
          const muted = audioEngine.toggleMute();
          const muteBtn = root.querySelector<HTMLButtonElement>("#lang-mute-btn");
          if (muteBtn) muteBtn.textContent = muted ? "🔇" : "🔊";
        },
        handleSkip
      );

      // Bind answer panel
      bindAnswerPanel(root, difficulty, allLanguages, (guess) => {
        handleGuessSubmit(guess);
      });

      // Bind modals if active
      if (activeModal === "result") {
        bindResultModal(
          root,
          () => {
            if (mode === "endless" && endlessLives <= 0) {
              endlessLives = 3;
              endlessScore = 0;
            }
            startNewRound(true);
          },
          () => {
            activeModal = "none";
            render();
          },
          () => triggerConfetti()
        );
      } else if (activeModal === "stats") {
        bindStatsModal(root, () => {
          activeModal = "none";
          render();
        });
      } else if (activeModal === "settings") {
        bindSettingsModal(
          root,
          (vol) => audioEngine.setVolume(vol),
          () => {
            audioEngine.toggleMute();
            render();
          },
          () => {
            resetLanguageStats();
            showLanguageToast(root, "🗑️ Player stats reset successfully", "info");
          },
          () => {
            activeModal = "none";
            render();
          }
        );
      } else if (activeModal === "leaderboard") {
        bindLeaderboardModal(root, () => {
          activeModal = "none";
          render();
        });
      }

      // Keyboard navigation (number keys 1-8 for MCQ)
      if (difficulty !== "Hard" && !isDone && activeModal === "none") {
        const keyHandler = (e: KeyboardEvent) => {
          if (document.activeElement?.tagName === "INPUT") return;
          const num = parseInt(e.key, 10);
          if (!isNaN(num) && num >= 1 && num <= mcqOptions.length) {
            const chosen = mcqOptions[num - 1];
            if (chosen) handleGuessSubmit(chosen.language);
          } else if (e.code === "Space") {
            e.preventDefault();
            if (audioEngine.getIsPlaying()) {
              audioEngine.stop();
            } else if (currentItem) {
              audioEngine.play(currentItem);
            }
          }
        };
        // Clean up previous window keydown if any
        if ((root as any)._langKeyHandler) {
          window.removeEventListener("keydown", (root as any)._langKeyHandler);
        }
        (root as any)._langKeyHandler = keyHandler;
        window.addEventListener("keydown", keyHandler);
      }
    }
  };

  // Cleanup on unmount
  (root as any)._cleanup = () => {
    stopSpeedTimer();
    audioEngine.stop();
    if ((root as any)._langKeyHandler) {
      window.removeEventListener("keydown", (root as any)._langKeyHandler);
      (root as any)._langKeyHandler = null;
    }
  };

  render();
}
