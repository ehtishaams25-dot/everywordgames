import type { GameConfig } from "@/data/games";
import type { EntityItem } from "@/engines/entityGuessingEngine";
import { getUnlockedHints, isEntityGameDone, isEntityGameWon } from "@/engines/entityGuessingEngine";
import { loadPokemonDatabase, getPokemonPool } from "./pokemon";
import { pickRandomEntity } from "./random";
/* import { getEntityStats, recordEntityGame } from "./stats"; */
import { renderPokemonImage } from "../components/PokemonImage";
import { renderHintPanel } from "../components/HintPanel";
import { renderGuessHistory, renderGuessForm, bindGuessInput } from "../components/GuessInput";
import { renderResultModal, bindResultModal } from "../components/ResultModal";
/* import { renderStatsModal, bindStatsModal, openStatsModal } from "../components/StatsModal"; */

export async function mountEntityGuessing(root: HTMLElement, gameConfig: GameConfig) {
  let difficulty: "Easy" | "Medium" | "Hard" = (gameConfig.difficulty as any) || "Medium";
  let pool: EntityItem[] = [];
  let currentEntity: EntityItem | null = null;
  let attempts: string[] = [];
  let maxAttempts = gameConfig.attempts || 6;
  let isWon = false;
  let isDone = false;
  let run = 0;

  // Initial loading state
  root.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1rem;">
      <div class="v2-spinner"></div>
      <p class="muted" style="font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; font-size: 1.25rem;">Loading ${gameConfig.name}...</p>
    </div>
  `;

  // Load dataset
  try {
    if (gameConfig.dataset === "pokemon" || gameConfig.slug === "guess-pokemon") {
      const db = await loadPokemonDatabase();
      pool = getPokemonPool(db, difficulty);
    } else {
      root.innerHTML = `<p class="muted">Dataset for ${gameConfig.name} not found or coming soon.</p>`;
      return;
    }
  } catch (err) {
    root.innerHTML = `<p class="muted" style="color: var(--red);">Error loading database: ${String(err)}</p>`;
    return;
  }

  const startNewRound = () => {
    run += 1;
    attempts = [];
    isWon = false;
    isDone = false;
    try {
      currentEntity = pickRandomEntity(pool, gameConfig.slug, run, gameConfig.daily);
    } catch {
      currentEntity = pool[0] || null;
    }
    render();
  };

  const handleDifficultyChange = async (newDiff: "Easy" | "Medium" | "Hard") => {
    if (difficulty === newDiff) return;
    difficulty = newDiff;
    root.innerHTML = `<div style="display: flex; justify-content: center; padding: 3rem;"><div class="v2-spinner"></div></div>`;
    const db = await loadPokemonDatabase();
    pool = getPokemonPool(db, difficulty);
    startNewRound();
  };

  const handleGuessSubmit = (guess: string) => {
    if (isDone || !currentEntity) return;
    if (attempts.some((a) => a.toLowerCase() === guess.toLowerCase())) {
      // Already guessed
      return;
    }
    attempts.push(guess);
    isWon = isEntityGameWon(currentEntity, attempts);
    isDone = isEntityGameDone(currentEntity, attempts, maxAttempts);

    if (isDone) {
      /* recordEntityGame(gameConfig.slug, isWon, attempts.length); */
      window.dispatchEvent(new Event("gamecompleted"));
    }

    render();
  };

  const render = () => {
    if (!currentEntity) {
      root.innerHTML = `<p class="muted">No items available in this difficulty pool.</p>`;
      return;
    }

    const unlockedHints = getUnlockedHints(currentEntity, attempts);
    /* const stats = getEntityStats(gameConfig.slug); */

    root.innerHTML = `
      <div class="entity-game-container">
        <!-- Game Top Bar: Difficulty & Stats -->
        <div class="entity-game-topbar">
          <div class="entity-diff-pills" role="tablist">
            <button class="diff-pill ${difficulty === "Easy" ? "active" : ""}" data-diff="Easy">
              Gen 1 (Easy)
            </button>
            <button class="diff-pill ${difficulty === "Medium" ? "active" : ""}" data-diff="Medium">
              Gen 1-4 (Medium)
            </button>
            <button class="diff-pill ${difficulty === "Hard" ? "active" : ""}" data-diff="Hard">
              All Gen (Hard)
            </button>
          </div>
          <!--
          <button class="button button-outline entity-stats-btn" id="open-stats-btn">
            📊 Stats
          </button>
          -->
        </div>

        <!-- Main 3-Column Single-Page Stage -->
        <div class="entity-stage-grid">
          <!-- Left Column: Past Attempts -->
          <div class="entity-side-col left-side">
            ${renderGuessHistory(attempts, maxAttempts, currentEntity.name)}
          </div>

          <!-- Center Column: Prominent Bigger Image + Autocomplete Input -->
          <div class="entity-center-col">
            ${renderPokemonImage(
              currentEntity.silhouette || currentEntity.image,
              currentEntity.image,
              currentEntity.name,
              isDone,
              isWon
            )}
            <div class="entity-input-container">
              ${renderGuessForm(attempts, maxAttempts, isDone)}
            </div>
          </div>

          <!-- Right Column: Progressive Hints -->
          <div class="entity-side-col right-side">
            ${renderHintPanel(unlockedHints)}
          </div>
        </div>

        <!-- Modals -->
        ${isDone ? renderResultModal(isWon, currentEntity, attempts, maxAttempts, gameConfig.name) : ""}
        <!--
        ${/* renderStatsModal(stats, gameConfig.name) */ ""}
        -->
      </div>
    </div>
    `;

    // Bind events
    const pills = root.querySelectorAll<HTMLButtonElement>(".diff-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        const diff = pill.getAttribute("data-diff") as "Easy" | "Medium" | "Hard";
        if (diff) handleDifficultyChange(diff);
      });
    });

    /*
    const statsBtn = root.querySelector<HTMLButtonElement>("#open-stats-btn");
    statsBtn?.addEventListener("click", () => openStatsModal(root));
    */

    bindGuessInput(root, pool, handleGuessSubmit);

    if (isDone) {
      bindResultModal(root, isWon, currentEntity, attempts, maxAttempts, gameConfig.name, startNewRound);
    }
    /* bindStatsModal(root); */
  };

  startNewRound();
}
