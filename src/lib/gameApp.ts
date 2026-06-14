import { games, type GameConfig } from "@/data/games";
import {
  createGuessChallenge,
  normalizeAnswer,
  type GuessItem,
} from "@/engines/guessingEngine";
import { createMultiTargets } from "@/engines/multiWordGuessEngine";
import { recordGame } from "@/engines/playerStore";
import { createPuzzleChallenge } from "@/engines/wordPuzzleEngine";
import {
  createWordGuessTarget,
  evaluateGuess,
  getWords,
} from "@/engines/wordGuessEngine";
import confetti from "canvas-confetti";
import dataset from "@/data/categories";
import { useGameFocus } from "./useGameFocus";

type LetterState = "correct" | "present" | "absent";

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[a.length][b.length];
}

let activeKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const stateRank: Record<LetterState, number> = {
  absent: 1,
  present: 2,
  correct: 3,
};

let dictionaryPromise: Promise<void> | null = null;
let globalDictionary: Set<string> | null = null;

let countryFlagsPromise: Promise<void> | null = null;
let countryFlagsCache: Record<string, string> = {};

let countryDataPromise: Promise<void> | null = null;
let countryDataCache: Record<string, { lat: number, lng: number, code: string }> = {};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (val: number) => (val * Math.PI) / 180;
  const toDeg = (val: number) => (val * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

function getDirectionArrow(bearing: number): string {
  if (bearing >= 337.5 || bearing < 22.5) return "⬆️";
  if (bearing >= 22.5 && bearing < 67.5) return "↗️";
  if (bearing >= 67.5 && bearing < 112.5) return "➡️";
  if (bearing >= 112.5 && bearing < 157.5) return "↘️";
  if (bearing >= 157.5 && bearing < 202.5) return "⬇️";
  if (bearing >= 202.5 && bearing < 247.5) return "↙️";
  if (bearing >= 247.5 && bearing < 292.5) return "⬅️";
  if (bearing >= 292.5 && bearing < 337.5) return "↖️";
  return "";
}

function loadCountryData() {
  if (!countryDataPromise) {
    countryDataPromise = fetch("/country-data.json")
      .then((res) => res.json())
      .then((data) => {
        countryDataCache = data;
      })
      .catch((err) => {
        console.warn("Failed to load country data", err);
      });
  }
  return countryDataPromise;
}

function loadCountryFlags() {
  if (!countryFlagsPromise) {
    countryFlagsPromise = fetch("https://flagcdn.com/en/codes.json")
      .then((res) => res.json())
      .then((data) => {
        Object.entries(data).forEach(([code, name]) => {
          if (typeof name === "string" && !code.includes("-")) {
            countryFlagsCache[name.toLowerCase()] = `https://flagcdn.com/${code}.svg`;
          }
        });
      })
      .catch((err) => {
        console.warn("Failed to load country flags", err);
      });
  }
  return countryFlagsPromise;
}

function loadDictionary() {
  if (!dictionaryPromise) {
    dictionaryPromise = fetch("/dictionary.json")
      .then((res) => {
        if (!res.ok) throw new Error("Dictionary fetch failed");
        return res.json();
      })
      .then((words: string[]) => {
        globalDictionary = new Set(words);
      })
      .catch((err) => {
        console.warn(
          "Failed to load dictionary.json, falling back to answer list.",
          err,
        );
        globalDictionary = new Set();
      });
  }
  return dictionaryPromise;
}

export function mountGame(root: HTMLElement) {
  const game = games.find((item) => item.slug === root.dataset.slug);
  if (!game) {
    root.innerHTML = "<p>Game not found.</p>";
    return;
  }

  const comingSoonSlugs = ["guess-capital", "guess-movie", "guess-tv-show", "guess-anime"];
  if (comingSoonSlugs.includes(game.slug) || game.engine === "coming-soon") {
    mountComingSoon(root, game);
    return;
  }

  rememberRecent(game.slug);

  if (game.engine === "word-guess" || game.engine === "multi-word-guess") {
    loadDictionary();
  }

  if (game.engine === "word-guess") mountWordGuess(root, game);
  if (game.engine === "multi-word-guess") mountMultiWordGuess(root, game);
  if (game.engine === "guessing") mountGuessing(root, game);
  if (game.engine === "word-puzzle") mountPuzzle(root, game);
}

function mountComingSoon(root: HTMLElement, game: GameConfig) {
  root.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 1rem; text-align: center; min-height: 50vh;">
      <h2 style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--text);">🚀 Coming Soon</h2>
      <p style="color: var(--text-muted); font-size: 1.125rem; max-width: 400px; line-height: 1.5;">We are currently building <strong>${game.name}</strong>. It will be available in a future update. Stay tuned!</p>
      <a href="/" class="button" style="margin-top: 2rem; display: inline-block;">Return Home</a>
    </div>
  `;
}

function mountWordGuess(root: HTMLElement, game: GameConfig) {
  let run = 0;
  let target = createWordGuessTarget(game, run);
  let guesses: ReturnType<typeof evaluateGuess>[] = [];
  let started = Date.now();
  let done = false;

  let currentGuess = "";
  let invalidGuess = false;
  let justSubmitted = false;

  const reset = () => {
    run += 1;
    target = createWordGuessTarget(game, run);
    guesses = [];
    currentGuess = "";
    started = Date.now();
    done = false;
    justSubmitted = false;
    render();
  };

  const submitGuess = async () => {
    if (done) return;
    if (currentGuess.length !== (game.wordLength ?? 5)) {
      setMessage(root, `Enter exactly ${game.wordLength} letters.`);
      invalidGuess = true;
      render();
      setTimeout(() => { invalidGuess = false; render(); }, 500);
      return;
    }

    await loadDictionary();
    const answerList = getWords(game.wordLength ?? 5);
    const inAnswerList = answerList.includes(currentGuess.toLowerCase());
    const inDictionary =
      globalDictionary && globalDictionary.size > 0
        ? globalDictionary.has(currentGuess.toLowerCase())
        : false;

    if (!inAnswerList && !inDictionary) {
      setMessage(root, "Word not in dictionary.");
      invalidGuess = true;
      render();
      setTimeout(() => { invalidGuess = false; render(); }, 500);
      return;
    }

    if (guesses.map(g => g.map(c => c.letter).join('')).includes(currentGuess.toLowerCase())) {
      setMessage(root, "Word already guessed.");
      invalidGuess = true;
      render();
      setTimeout(() => { invalidGuess = false; render(); }, 500);
      return;
    }

    const result = evaluateGuess(currentGuess.toLowerCase(), target);
    guesses.push(result);
    const won = currentGuess.toLowerCase() === target;
    currentGuess = "";
    justSubmitted = true;
    if (won || guesses.length >= (game.attempts ?? 6)) {
      done = true;
      recordGame(game.slug, won, elapsed(started));
      window.dispatchEvent(new Event("gamecompleted"));
    }
    render();
    if (done) {
      setMessage(
        root,
        won
          ? `Solved: ${target.toUpperCase()}`
          : `Answer: ${target.toUpperCase()}`,
      );
      showCompletionPopup(root, won, target.toUpperCase(), reset);
    }
  };

  const handleKey = (key: string) => {
    if (done) return;
    if (key === "ENTER") {
      submitGuess();
    } else if (key === "BACK" || key === "Backspace") {
      currentGuess = currentGuess.slice(0, -1);
      justSubmitted = false;
      render();
    } else if (/^[a-zA-Z]$/.test(key) && currentGuess.length < (game.wordLength ?? 5)) {
      currentGuess += key.toUpperCase();
      justSubmitted = false;
      render();
    }
  };

  const render = () => {
    const rows = Array.from({ length: game.attempts ?? 6 }, (_, row) => {
      const isCurrentRow = row === guesses.length && !done;
      const isJustSubmittedRow = row === guesses.length - 1 && justSubmitted;
      const guess = guesses[row];
      return `<div class="word-guess-row ${isCurrentRow && invalidGuess ? 'shake' : ''}" style="grid-template-columns: repeat(${game.wordLength}, auto)">
        ${Array.from({ length: game.wordLength ?? 5 }, (_, col) => {
        if (isCurrentRow) {
          const letter = currentGuess[col] ?? "";
          const isLast = letter !== "" && col === currentGuess.length - 1;
          return `<span class="cell ${isLast ? 'pop' : ''}">${letter}</span>`;
        }
        const cell = guess?.[col];
        const style = cell ? `style="animation-delay: ${col * 100}ms;"` : "";
        return `<span class="cell ${cell?.state ?? ""} ${cell && isJustSubmittedRow ? 'flip' : ''}" ${style}>${cell?.letter.toUpperCase() ?? ""}</span>`;
      }).join("")}
      </div>`;
    }).join("");

    root.innerHTML = `
      ${renderGameHeader(
      game,
      [],
      done ? "Play again" : "New word",
    )}
      <div class="board" style="margin-bottom: 1.5rem;">${rows}</div>
      <p class="message">${done ? "Round complete." : "Type your guess."}</p>
      <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
        <button class="button" id="guess-btn" type="button" style="width: min(100%, 22rem);">Submit Guess</button>
      </div>
      ${renderKeyboard(getWordGuessKeyboardState(guesses))}
    `;

    wireRestart(root, reset);
    wireKeyboard(root, handleKey);
    root.querySelector("#guess-btn")?.addEventListener("click", () => handleKey("ENTER"));

    if (activeKeydownHandler) {
      window.removeEventListener("keydown", activeKeydownHandler);
    }
    activeKeydownHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || document.activeElement?.tagName === "INPUT") return;
      if (e.key === "Enter") handleKey("ENTER");
      else if (e.key === "Backspace") handleKey("BACK");
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key);
    };
    window.addEventListener("keydown", activeKeydownHandler);
  };

  render();
}

function mountMultiWordGuess(root: HTMLElement, game: GameConfig) {
  let run = 0;
  let targets = createMultiTargets(game, run);
  let guesses: string[] = [];
  let started = Date.now();
  let done = false;

  let currentGuess = "";
  let invalidGuess = false;
  let justSubmitted = false;

  const reset = () => {
    run += 1;
    targets = createMultiTargets(game, run);
    guesses = [];
    currentGuess = "";
    started = Date.now();
    done = false;
    justSubmitted = false;
    render();
  };

  const submitGuess = async () => {
    if (done) return;
    if (currentGuess.length !== (game.wordLength ?? 5)) {
      setMessage(root, `Enter exactly ${game.wordLength} letters.`);
      invalidGuess = true;
      render();
      setTimeout(() => { invalidGuess = false; render(); }, 500);
      return;
    }

    await loadDictionary();
    const answerList = getWords(game.wordLength ?? 5);
    const inAnswerList = answerList.includes(currentGuess.toLowerCase());
    const inDictionary =
      globalDictionary && globalDictionary.size > 0
        ? globalDictionary.has(currentGuess.toLowerCase())
        : false;

    if (!inAnswerList && !inDictionary) {
      setMessage(root, "Word not in dictionary.");
      invalidGuess = true;
      render();
      setTimeout(() => { invalidGuess = false; render(); }, 500);
      return;
    }

    if (guesses.includes(currentGuess.toLowerCase())) {
      setMessage(root, "Word already guessed.");
      invalidGuess = true;
      render();
      setTimeout(() => { invalidGuess = false; render(); }, 500);
      return;
    }

    guesses.push(currentGuess.toLowerCase());
    currentGuess = "";
    justSubmitted = true;
    const solved = targets.every((target) => guesses.includes(target));
    if (solved || guesses.length >= (game.attempts ?? 8)) {
      done = true;
      recordGame(game.slug, solved, elapsed(started));
      window.dispatchEvent(new Event("gamecompleted"));
    }
    render();
    if (done) {
      setMessage(
        root,
        solved
          ? "All boards solved."
          : `Answers: ${targets.map((word) => word.toUpperCase()).join(", ")}`,
      );
      showCompletionPopup(
        root,
        solved,
        targets.join(", ").toUpperCase(),
        reset,
      );
    }
  };

  const handleKey = (key: string) => {
    if (done) return;
    if (key === "ENTER") {
      submitGuess();
    } else if (key === "BACK" || key === "Backspace") {
      currentGuess = currentGuess.slice(0, -1);
      justSubmitted = false;
      render();
    } else if (/^[a-zA-Z]$/.test(key) && currentGuess.length < (game.wordLength ?? 5)) {
      currentGuess += key.toUpperCase();
      justSubmitted = false;
      render();
    }
  };

  const render = () => {
    root.innerHTML = `
      ${renderGameHeader(game, [`${game.boardCount} boards`, `${game.attempts} shared attempts`], done ? "Play again" : "New boards")}
      <div class="multi-grid" style="margin-bottom: 1.5rem;">
        ${targets.map((target, index) => renderMiniBoard(index + 1, target, guesses, game.attempts ?? 8, currentGuess, done, invalidGuess, justSubmitted)).join("")}
      </div>
      <p class="message">${done ? "Round complete." : "Type one guess to update every board."}</p>
      <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
        <button class="button" id="guess-btn" type="button" style="width: min(100%, 22rem);">Submit Guess</button>
      </div>
      ${renderKeyboard(getMultiKeyboardState(guesses, targets))}
    `;

    wireRestart(root, reset);
    wireKeyboard(root, handleKey);
    root.querySelector("#guess-btn")?.addEventListener("click", () => handleKey("ENTER"));

    if (activeKeydownHandler) {
      window.removeEventListener("keydown", activeKeydownHandler);
    }
    activeKeydownHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || document.activeElement?.tagName === "INPUT") return;
      if (e.key === "Enter") handleKey("ENTER");
      else if (e.key === "Backspace") handleKey("BACK");
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key);
    };
    window.addEventListener("keydown", activeKeydownHandler);
  };



  render();
}

function renderMiniBoard(
  number: number,
  target: string,
  guesses: string[],
  attempts: number,
  currentGuess: string = "",
  done: boolean = false,
  invalidGuess: boolean = false,
  justSubmitted: boolean = false
) {
  const rows = Array.from({ length: attempts }, (_, row) => {
    const isCurrentRow = row === guesses.length && !done;
    const isJustSubmittedRow = row === guesses.length - 1 && justSubmitted;
    const result = guesses[row]
      ? evaluateGuess(guesses[row], target)
      : undefined;
    return `<div class="word-guess-row ${isCurrentRow && invalidGuess ? 'shake' : ''}" style="grid-template-columns: repeat(${target.length}, auto)">
      ${Array.from({ length: target.length }, (_, col) => {
      if (isCurrentRow) {
        const letter = currentGuess[col] ?? "";
        const isLast = letter !== "" && col === currentGuess.length - 1;
        return `<span class="cell ${isLast ? 'pop' : ''}">${letter}</span>`;
      }
      const cell = result?.[col];
      const style = cell ? `style="animation-delay: ${col * 100}ms;"` : "";
      return `<span class="cell ${cell?.state ?? ""} ${cell && isJustSubmittedRow ? 'flip' : ''}" ${style}>${cell?.letter.toUpperCase() ?? ""}</span>`;
    }).join("")}
    </div>`;
  }).join("");
  return `<section class="mini-board"><h3>Board ${number}</h3>${rows}</section>`;
}

function mountGuessing(root: HTMLElement, game: GameConfig) {
  let run = 0;
  let challenge = createGuessChallenge(game, run);
  let started = Date.now();
  let attempts: string[] = [];
  let done = false;

  const isCountryGame = game.slug === "guess-country";
  const isFlagGame = game.slug === "guess-flag";

  if (isCountryGame) {
    loadCountryData().then(() => {
      if (!done) render();
    });
  } else if (isFlagGame) {
    Promise.all([loadCountryFlags(), loadCountryData()]).then(() => {
      if (!done) render();
    });
  }

  const reset = () => {
    run += 1;
    challenge = createGuessChallenge(game, run);
    started = Date.now();
    attempts = [];
    done = false;
    render();
  };

  const render = () => {
    const answerLength = getAnswerLetters(challenge).length;
    const maxAttempts = isCountryGame ? 6 : 5;

    let mainContent = "";
    if (isFlagGame) {
      const flagSvg = countryFlagsCache[challenge.answer.toLowerCase()] || "";
      const revealOrder = [2, 4, 0, 5, 1, 3];
      mainContent = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; margin-bottom: 2rem;">
          <p class="eyebrow" style="margin-bottom: 1rem;">Guess the Country from the Flag</p>
          ${flagSvg ? `
          <div class="flag-container" style="position: relative; display: inline-block; width: 100%; max-width: 300px; aspect-ratio: 3/2; background: #eee; border: 1px solid var(--border); box-shadow: 0 4px 6px rgba(0,0,0,0.1); user-select: none; -webkit-user-select: none;">
            <img src="${flagSvg}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none; -webkit-user-drag: none;" draggable="false" />
            <div style="position: absolute; inset: 0; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); gap: 0px; pointer-events: none;">
              ${Array.from({ length: 6 }, (_, i) => {
        const isRevealed = revealOrder.indexOf(i) < attempts.length + 1;
        return `<div style="background: var(--surface2); opacity: ${isRevealed ? 0 : 1}; transition: opacity 0.5s;"></div>`;
      }).join('')}
            </div>
          </div>
          ` : `<div style="padding: 2rem; border: 1px dashed var(--border);">Loading flag...</div>`}
        </div>
      `;
    } else if (isCountryGame) {
      const code = countryDataCache[challenge.answer.toLowerCase()]?.code || "";
      const mapSvgUrl = code ? `https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${code}/vector.svg` : "";
      mainContent = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; margin-bottom: 2rem;">
          <p class="eyebrow" style="margin-bottom: 1rem;">Guess the Country from the Map</p>
          ${mapSvgUrl ? `
          <div class="map-container" style="position: relative; display: inline-block; width: 100%; max-width: 300px; aspect-ratio: 1; padding: 1rem; user-select: none; -webkit-user-select: none; pointer-events: none;">
            <img src="${mapSvgUrl}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none; -webkit-user-drag: none; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));" draggable="false" />
          </div>
          ` : `<div style="padding: 2rem; border: 1px dashed var(--border);">Loading map...</div>`}
        </div>
      `;
    } else {
      mainContent = `
      <div class="retention-game-grid">
        <div>
          <div class="clue-box">
            <div>
              <p class="eyebrow">Clue</p>
              <div class="clue-title">${escapeHtml(challenge.display)}</div>
            </div>
          </div>
        </div>
        <aside class="hint-panel">
          <div class="hint-panel-top">
            <strong>Hints</strong>
          </div>
          <div class="hint-list">
            ${challenge.hints
          .map((hint, index) => {
            const isUnlocked = index <= attempts.length;
            const justUnlocked =
              index === attempts.length && attempts.length > 0;
            if (isUnlocked) {
              return `<div class="hint ${justUnlocked ? "hint-new" : ""}"><span class="hint-text">${escapeHtml(hint)}</span></div>`;
            }
            return `<div class="hint locked"><span class="lock-icon">🔒</span> Locked</div>`;
          })
          .join("")}
          </div>
        </aside>
      </div>
      `;
    }

    root.innerHTML = `
      ${renderGameHeader(game, [`${answerLength} letters`, `${Math.max(0, maxAttempts - attempts.length)} tries left`], done ? "Play again" : (isCountryGame || isFlagGame ? "New game" : "New clue"))}
      ${mainContent}
      <form class="guess-form" style="position: relative; margin-top: 1rem;">
        <input class="answer-input" name="answer" placeholder="${isCountryGame || isFlagGame ? 'Country, territory...' : 'Enter guess'}" inputmode="${isCountryGame || isFlagGame ? 'text' : 'none'}" maxlength="${Math.max(answerLength + 8, 24)}" autocomplete="off" autocapitalize="characters" aria-label="Enter answer" style="text-align: center; font-weight: bold; padding: 0.75rem;" />
        <button class="button" type="submit">${isCountryGame || isFlagGame ? '🌍 GUESS' : 'Submit'}</button>
        ${isCountryGame || isFlagGame ? `
        <div id="suggestion-container" style="display: none; position: absolute; top: 100%; left: 0; right: 0; padding: 0.5rem; text-align: center; color: var(--text-muted); font-size: 0.875rem;">
          Did you mean <a href="#" id="suggestion-link" style="text-decoration: underline; font-weight: 500;"></a>?
        </div>
        ` : ""}
      </form>
      ${(isCountryGame || isFlagGame)
        ? `<div class="past-guesses" style="margin-top: 1rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.25rem;">
        ${Array.from({ length: maxAttempts }, (_, i) => {
          const attempt = attempts[i];
          if (!attempt) {
            return `<div style="display: flex; gap: 0.25rem; height: 2.5rem;">
              <div style="flex: 1; border: 2px solid var(--border); border-radius: 4px; background: rgba(0,0,0,0.1);"></div>
            </div>`;
          }
          let distanceHtml = "";
          let dist = 0;
          let arrow = "";
          let pct = 0;

          if (countryDataCache[attempt.toLowerCase()] && countryDataCache[challenge.answer.toLowerCase()]) {
            const guessData = countryDataCache[attempt.toLowerCase()];
            const answerData = countryDataCache[challenge.answer.toLowerCase()];
            dist = Math.round(calculateDistance(guessData.lat, guessData.lng, answerData.lat, answerData.lng));
            const bearing = calculateBearing(guessData.lat, guessData.lng, answerData.lat, answerData.lng);
            arrow = getDirectionArrow(bearing);
            pct = Math.round(Math.max(0, 100 - (dist / 20000) * 100));
            if (dist === 0) pct = 100;

            distanceHtml = `
              <div style="flex: 1; border: 2px solid ${dist === 0 ? 'var(--green)' : 'var(--border)'}; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; background: ${dist === 0 ? 'var(--green)' : 'transparent'}; color: ${dist === 0 ? 'white' : 'inherit'};${dist === 0 ? 'box-shadow: 0 0 10px var(--green);' : ''}">${dist}km</div>
              <div style="width: 3rem; border: 2px solid ${dist === 0 ? 'var(--green)' : 'var(--border)'}; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.25rem; background: ${dist === 0 ? 'var(--green)' : 'transparent'};">${dist === 0 ? '🎉' : arrow}</div>
              <div style="width: 4rem; border: 2px solid ${dist === 0 ? 'var(--green)' : 'var(--border)'}; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; background: ${dist === 0 ? 'var(--green)' : 'transparent'}; color: ${dist === 0 ? 'white' : 'inherit'}">${pct}%</div>
            `;
          }

          return `<div class="past-guess" style="display: flex; gap: 0.25rem; height: 2.5rem; text-transform: uppercase;">
            <div style="flex: 2; border: 2px solid ${dist === 0 ? 'var(--green)' : 'var(--border)'}; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; padding: 0 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: ${dist === 0 ? 'var(--green)' : 'transparent'}; color: ${dist === 0 ? 'white' : 'inherit'};${dist === 0 ? 'box-shadow: 0 0 10px var(--green);' : ''}">${escapeHtml(attempt)}</div>
            ${distanceHtml}
          </div>`;
        }).join("")}
      </div>`
        : attempts.length > 0 ? `<div class="past-guesses" style="margin-top: 1rem; margin-bottom: 1rem;">
        ${attempts.map((attempt) => {
          return `<div class="past-guess" style="padding: 0.5rem; background: var(--bg-surface-hover); border-radius: var(--radius); text-align: center; font-weight: 500; font-family: monospace; letter-spacing: 1px; color: var(--fg-muted); margin-bottom: 0.5rem; ${normalizeAnswer(attempt) === normalizeAnswer(challenge.answer) ? 'color: var(--green);' : 'text-decoration: line-through;'}">${escapeHtml(attempt.toUpperCase())}</div>`;
        }).join("")}
      </div>` : ""
      }
      <p class="message">${attempts.length ? `${attempts.length} attempt${attempts.length === 1 ? "" : "s"}` : (isCountryGame || isFlagGame) ? "" : "Type or tap letters. Hints stay beside the board."}</p>
      ${(isCountryGame || isFlagGame) ? "" : renderKeyboard(getGuessKeyboardState(attempts, challenge))}
    `;

    wireRestart(root, reset);
    wireKeyboard(root, "input[name='answer']");

    if (isCountryGame || isFlagGame) {
      const input = root.querySelector<HTMLInputElement>("input");
      const suggestionContainer = root.querySelector<HTMLDivElement>("#suggestion-container");
      const suggestionLink = root.querySelector<HTMLAnchorElement>("#suggestion-link");

      if (input && suggestionContainer && suggestionLink) {
        input.addEventListener("input", () => {
          const val = input.value.trim().toLowerCase();
          if (val.length < 3) {
            suggestionContainer.style.display = "none";
            return;
          }
          if (dataset.countries.some((c: string) => c.toLowerCase() === val)) {
            suggestionContainer.style.display = "none";
            return;
          }

          let bestMatch = "";
          let minDistance = Infinity;

          for (const country of dataset.countries) {
            const d = levenshteinDistance(val, country.toLowerCase());
            if (d < minDistance) {
              minDistance = d;
              bestMatch = country;
            }
          }

          const threshold = bestMatch.length > 6 ? 3 : 2;
          if (minDistance > 0 && minDistance <= threshold) {
            suggestionLink.textContent = bestMatch;
            suggestionContainer.style.display = "block";
          } else {
            suggestionContainer.style.display = "none";
          }
        });

        suggestionLink.addEventListener("click", (e) => {
          e.preventDefault();
          input.value = suggestionLink.textContent ?? "";
          suggestionContainer.style.display = "none";
        });
      }
    }

    root.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (done) return;
      const input = root.querySelector<HTMLInputElement>("input");
      const value = input?.value.trim() ?? "";
      if (!normalizeAnswer(value)) {
        setMessage(root, "Enter a guess first.");
        return;
      }
      if (isCountryGame || isFlagGame) {
        const isValidCountry = dataset.countries.some((c: string) => c.toLowerCase() === value.toLowerCase());
        if (!isValidCountry) {
          setMessage(root, "Not a valid country.");
          return;
        }
      }
      attempts.push(value);
      if (input) input.value = "";
      const won = normalizeAnswer(value) === normalizeAnswer(challenge.answer);
      const maxAttempts = (isCountryGame || isFlagGame) ? 6 : 5;
      if (won || attempts.length >= maxAttempts) {
        done = true;
        recordGame(game.slug, won, elapsed(started));
        window.dispatchEvent(new Event("gamecompleted"));
      }
      render();
      if (done) {
        setMessage(
          root,
          won ? `Correct: ${challenge.answer}` : `Answer: ${challenge.answer}`,
        );
        showCompletionPopup(root, won, challenge.answer, reset);
      } else {
        if (isCountryGame || isFlagGame) {
          if (attempts.length === maxAttempts - 1) {
            setMessage(root, "Last chance!");
          } else {
            if (isFlagGame) setMessage(root, "Flag piece revealed.");
            else setMessage(root, "Try again!");
          }
        } else {
          if (attempts.length < challenge.hints.length) {
            setMessage(root, "New Hint Unlocked");
          } else {
            setMessage(root, "Not yet. Keep trying.");
          }
        }
      }
    });
    useGameFocus(root, ".answer-input");
  };

  render();
}

function mountPuzzle(root: HTMLElement, game: GameConfig) {
  let run = 0;
  let challenge = createPuzzleChallenge(game, run);
  let started = Date.now();
  let guessed = new Set<string>();
  let attempts: string[] = [];
  let misses = 0;
  let done = false;

  const reset = () => {
    run += 1;
    challenge = createPuzzleChallenge(game, run);
    started = Date.now();
    guessed = new Set<string>();
    attempts = [];
    misses = 0;
    done = false;
    render();
  };

  const render = () => {
    const hangmanDisplay = challenge.answer
      .split("")
      .map((letter) =>
        guessed.has(letter) || done ? letter.toUpperCase() : "_",
      )
      .join(" ");
    const display =
      game.mode === "hangman" ? hangmanDisplay : challenge.display;
    const hangmanSvg =
      game.mode === "hangman"
        ? `
      <style>
        .draw-path {
          stroke-dasharray: var(--len);
          transition: stroke-dashoffset 0.5s ease-in-out;
        }
      </style>
      <svg viewBox="0 0 200 250" class="hangman-svg" style="width: 100%; max-width: 200px; margin: 0 auto; display: block; stroke: currentColor; stroke-width: 4; stroke-linecap: round; fill: none;">
        <g class="draw-path" style="--len: 400; stroke-dashoffset: 0;">
          <path d="M20,230 L100,230 M60,230 L60,20 L140,20 L140,50" style="stroke-linejoin: round;" />
        </g>
        <circle cx="140" cy="70" r="20" class="draw-path" style="--len: 126; stroke-dashoffset: ${misses > 0 ? 0 : 126};" />
        <line x1="140" y1="90" x2="140" y2="150" class="draw-path" style="--len: 60; stroke-dashoffset: ${misses > 1 ? 0 : 60};" />
        <line x1="140" y1="100" x2="110" y2="130" class="draw-path" style="--len: 45; stroke-dashoffset: ${misses > 2 ? 0 : 45};" />
        <line x1="140" y1="100" x2="170" y2="130" class="draw-path" style="--len: 45; stroke-dashoffset: ${misses > 3 ? 0 : 45};" />
        <line x1="140" y1="150" x2="110" y2="190" class="draw-path" style="--len: 50; stroke-dashoffset: ${misses > 4 ? 0 : 50};" />
        <line x1="140" y1="150" x2="170" y2="190" class="draw-path" style="--len: 50; stroke-dashoffset: ${misses > 5 ? 0 : 50};" />
      </svg>
    `
        : "";

    root.innerHTML = `
      ${renderGameHeader(game, [game.mode === "hangman" ? `${6 - misses} misses left` : "quick solve"], done ? "Play again" : "New puzzle")}
      <div class="puzzle-box" style="text-align: center;">
        <div>
          <p class="eyebrow">${escapeHtml(challenge.hint)}</p>
          ${hangmanSvg}
          <div class="clue-title" style="margin-top: 1rem; font-family: monospace; letter-spacing: 0.25em;">${escapeHtml(display)}</div>
          ${challenge.grid ? `<div class="word-search">${challenge.grid.map((row) => `<div class="word-search-row">${row.map((letter) => `<span class="cell">${letter}</span>`).join("")}</div>`).join("")}</div>` : ""}
        </div>
      </div>
      <form class="guess-form">
        <input class="letter-input" name="answer" inputmode="none" autocomplete="off" autocapitalize="characters" maxlength="${game.mode === "hangman" ? challenge.answer.length : 40}" aria-label="Enter answer" />
        <button class="button" type="submit">${game.mode === "hangman" ? "Try" : "Submit"}</button>
      </form>
      <p class="message">${game.mode === "hangman" ? `${6 - misses} misses left` : "Solve the puzzle."}</p>
      ${renderKeyboard(getPuzzleKeyboardState(attempts, guessed, challenge.answer))}
    `;

    wireRestart(root, reset);
    wireKeyboard(root, "input[name='answer']");

    root.querySelector("form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (done) return;
      const input = root.querySelector<HTMLInputElement>("input");
      const value = input?.value.trim().toLowerCase() ?? "";
      if (!value) return;

      if (
        game.mode === "hangman" &&
        value.length === 1 &&
        (guessed.has(value) || attempts.includes(value))
      ) {
        setMessage(root, `Already guessed ${value.toUpperCase()}`);
        if (input) input.value = "";
        return;
      }

      if (game.mode === "hangman" && value.length > 1) {
        await loadDictionary();
        const answerList = getWords(value.length);
        const inAnswerList = answerList.includes(value);
        const inDictionary =
          globalDictionary && globalDictionary.size > 0
            ? globalDictionary.has(value)
            : false;

        if (!inAnswerList && !inDictionary) {
          setMessage(root, "Word not in dictionary.");
          return;
        }
      }

      attempts.push(value);
      if (input) input.value = "";
      let won = value === challenge.answer;

      if (game.mode === "hangman") {
        if (value.length === 1) {
          if (challenge.answer.includes(value)) guessed.add(value);
          else misses += 1;
          won = challenge.answer
            .split("")
            .every((letter) => guessed.has(letter));
        } else if (!won) {
          misses += 1;
          value.split("").forEach((letter, index) => {
            if (challenge.answer[index] === letter) {
              guessed.add(letter);
            }
          });
          won = challenge.answer
            .split("")
            .every((letter) => guessed.has(letter));
        }
      }

      if (
        won ||
        misses >= 6 ||
        (game.mode !== "hangman" && value !== challenge.answer)
      ) {
        done = true;
        recordGame(game.slug, won, elapsed(started));
        window.dispatchEvent(new Event("gamecompleted"));
      }
      render();
      if (done) {
        setMessage(
          root,
          won
            ? `Solved: ${challenge.answer.toUpperCase()}`
            : `Answer: ${challenge.answer.toUpperCase()}`,
        );
        showCompletionPopup(root, won, challenge.answer.toUpperCase(), reset);
      }
    });
    useGameFocus(root, ".letter-input");
  };

  render();
}

function renderGameHeader(
  game: GameConfig,
  pills: string[],
  buttonLabel: string,
) {
  let selectHtml = "";
  if ((game.engine === "word-guess" || game.engine === "multi-word-guess") && game.mode !== "daily" && game.mode !== "endless" && game.mode !== "survival" && game.mode !== "hardcore") {
    const wordGuessOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option value="${n}-letter-word-guess" ${game.slug === `${n}-letter-word-guess` ? 'selected' : ''}>${n} Letter</option>`).join("");
    const multiOptions = [
      ["double-word-guess", "Double"],
      ["triple-word-guess", "Triple"],
      ["quad-word-guess", "Quad"],
      ["hex-word-guess", "Hex"],
      ["octo-word-guess", "Octo"],
      ["sedecordle", "Sedecordle"]
    ].map(([slug, name]) => `<option value="${slug}" ${game.slug === slug ? 'selected' : ''}>${name}</option>`).join("");

    selectHtml = `
      <select class="variant-select" onchange="window.location.href='/games/'+this.value" style="margin-left: auto; padding: 0.25rem 0.5rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); font-weight: 500; font-family: inherit; font-size: 0.875rem; cursor: pointer; height: fit-content; align-self: center;">
        <optgroup label="Word Guess">${wordGuessOptions}</optgroup>
        <optgroup label="Multi">${multiOptions}</optgroup>
      </select>
    `;
  }

  return `<div class="game-top" style="display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; width: 100%;">
    <div style="display: flex; align-items: center; gap: 1rem;">
      <h2 style="margin: 0;">${escapeHtml(game.name)}</h2>
      <div class="toolbar" style="margin: 0;">${pills.map((pill) => `<span class="pill">${escapeHtml(pill)}</span>`).join("")}</div>
    </div>
    ${selectHtml}
    <button class="button secondary" type="button" data-restart style="${selectHtml ? '' : 'margin-left: auto;'} height: fit-content; align-self: center;">${buttonLabel}</button>
  </div>`;
}

function renderGuessRows(
  challenge: GuessItem,
  attempts: string[],
  rows: number,
) {
  const answerLetters = getAnswerLetters(challenge);
  return Array.from({ length: rows }, (_, index) => {
    const guess = attempts[index];
    const cells = guess
      ? evaluateAnswerGuess(guess, challenge)
      : answerLetters.map(() => ({ letter: "", state: "" }));
    return `<div class="guess-row">
      ${cells.map((cell) => `<span class="cell ${cell.state}">${escapeHtml(cell.letter)}</span>`).join("")}
    </div>`;
  }).join("");
}

function evaluateAnswerGuess(guess: string, challenge: GuessItem) {
  const target = getAnswerLetters(challenge);
  const input = normalizeAnswer(guess).toUpperCase().split("");
  return target.map((letter, index) => {
    const guessLetter = input[index] ?? "";
    const state = !guessLetter
      ? "absent"
      : guessLetter === letter
        ? "correct"
        : target.includes(guessLetter)
          ? "present"
          : "absent";
    return { letter: guessLetter, state };
  });
}

function getAnswerLetters(challenge: GuessItem) {
  return normalizeAnswer(challenge.answer).toUpperCase().split("");
}

function renderKeyboard(states: Record<string, LetterState> = {}) {
  return `<div class="keyboard" aria-label="On-screen keyboard">
    ${keyboardRows
      .map((row, index) => {
        const keys =
          index === 2 ? ["ENTER", ...row.split(""), "BACK"] : row.split("");
        return `<div class="keyboard-row">${keys
          .map((letter) => {
            const label = letter === "BACK" ? "⌫" : letter;
            const state = states[letter] ?? "";
            return `<button class="key ${state} ${letter.length > 1 ? "wide" : ""}" type="button" data-key="${letter}" aria-label="${letter === "BACK" ? "Backspace" : letter}">${label}</button>`;
          })
          .join("")}</div>`;
      })
      .join("")}
  </div>`;
}

function wireKeyboard(root: HTMLElement, handlerOrSelector: string | ((key: string) => void)) {
  const isString = typeof handlerOrSelector === "string";
  const input = isString ? root.querySelector<HTMLInputElement>(handlerOrSelector as string) : null;
  if (isString && !input) return;
  root.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.key ?? "";
      if (!isString) {
        (handlerOrSelector as (k: string) => void)(key);
        return;
      }
      if (key === "ENTER") {
        input!.form?.requestSubmit();
        return;
      }
      if (key === "BACK") {
        input!.value = input!.value.slice(0, -1);
        input!.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
      if (input!.value.length < Number(input!.maxLength || 40)) {
        input!.value += key;
        input!.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
  });
}

function wireRestart(root: HTMLElement, reset: () => void) {
  root.querySelector("[data-restart]")?.addEventListener("click", reset);
}

function getWordGuessKeyboardState(guesses: ReturnType<typeof evaluateGuess>[]) {
  const states: Record<string, LetterState> = {};
  guesses
    .flat()
    .forEach((cell) =>
      mergeKeyboardState(states, cell.letter, cell.state as LetterState),
    );
  return states;
}

function getMultiKeyboardState(guesses: string[], targets: string[]) {
  const states: Record<string, LetterState> = {};
  guesses.forEach((guess) => {
    const mergedForGuess: Record<string, LetterState> = {};
    targets.forEach((target) => {
      evaluateGuess(guess, target).forEach((cell) =>
        mergeKeyboardState(
          mergedForGuess,
          cell.letter,
          cell.state as LetterState,
        ),
      );
    });
    Object.entries(mergedForGuess).forEach(([letter, state]) =>
      mergeKeyboardState(states, letter, state),
    );
  });
  return states;
}

function getGuessKeyboardState(attempts: string[], challenge: GuessItem) {
  const states: Record<string, LetterState> = {};
  attempts.forEach((attempt) => {
    evaluateAnswerGuess(attempt, challenge).forEach((cell) => {
      if (cell.letter)
        mergeKeyboardState(states, cell.letter, cell.state as LetterState);
    });
  });
  return states;
}

function getPuzzleKeyboardState(
  attempts: string[],
  guessed: Set<string>,
  answer: string,
) {
  const states: Record<string, LetterState> = {};
  const target = answer.toUpperCase();
  guessed.forEach((letter) =>
    mergeKeyboardState(states, letter.toUpperCase(), "correct"),
  );
  attempts
    .join("")
    .toUpperCase()
    .split("")
    .forEach((letter) => {
      if (/^[A-Z]$/.test(letter))
        mergeKeyboardState(
          states,
          letter,
          target.includes(letter) ? "present" : "absent",
        );
    });
  return states;
}

function mergeKeyboardState(
  states: Record<string, LetterState>,
  letter: string,
  state: LetterState,
) {
  const key = letter.toUpperCase();
  if (!/^[A-Z]$/.test(key)) return;
  const current = states[key];
  if (!current || stateRank[state] > stateRank[current]) states[key] = state;
}

function setMessage(root: HTMLElement, message: string) {
  const node = root.querySelector(".message");
  if (node) node.textContent = message;
}

function elapsed(started: number) {
  return Math.max(1, Math.round((Date.now() - started) / 1000));
}

function rememberRecent(slug: string) {
  const key = "ewg:recent";
  const recent = JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
  localStorage.setItem(
    key,
    JSON.stringify(
      [slug, ...recent.filter((item) => item !== slug)].slice(0, 8),
    ),
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showCompletionPopup(
  root: HTMLElement,
  won: boolean,
  answer: string,
  resetCallback: () => void,
) {
  if (won) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 1000,
    });
  }

  const overlay = document.createElement("div");
  overlay.className = "completion-popup-overlay";

  const popup = document.createElement("div");
  popup.className = "completion-popup";

  const title = document.createElement("h2");
  title.textContent = won ? "Solved!" : "Game Over";

  const message = document.createElement("p");
  message.textContent = won ? `Congratulations! The answer was ${answer}.` : `The answer was ${answer}.`;

  const button = document.createElement("button");
  button.className = "button";
  button.textContent = "Play Again";
  button.onclick = () => {
    overlay.remove();
    resetCallback();
  };

  popup.appendChild(title);
  popup.appendChild(message);
  popup.appendChild(button);
  overlay.appendChild(popup);

  root.appendChild(overlay);
}
