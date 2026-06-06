import { useGameFocus } from "@/lib/useGameFocus";
import { games, type GameConfig } from "@/data/games";
import { createGuessChallenge, normalizeAnswer, type GuessItem } from "@/engines/guessingEngine";
import { createMultiTargets } from "@/engines/multiWordleEngine";
import { recordGame } from "@/engines/playerStore";
import { createPuzzleChallenge } from "@/engines/wordPuzzleEngine";
import { createWordleTarget, evaluateGuess, getWords } from "@/engines/wordleEngine";
import confetti from "canvas-confetti";

type LetterState = "correct" | "present" | "absent";

const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const stateRank: Record<LetterState, number> = { absent: 1, present: 2, correct: 3 };

let dictionaryPromise: Promise<void> | null = null;
let globalDictionary: Set<string> | null = null;

function loadDictionary() {
  if (!dictionaryPromise) {
    dictionaryPromise = fetch("/dictionary.json")
      .then(res => {
        if (!res.ok) throw new Error("Dictionary fetch failed");
        return res.json();
      })
      .then((words: string[]) => {
        globalDictionary = new Set(words);
      })
      .catch((err) => {
        console.warn("Failed to load dictionary.json, falling back to answer list.", err);
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

  rememberRecent(game.slug);

  if (game.engine === "wordle" || game.engine === "multi-wordle") {
    loadDictionary();
  }

  if (game.engine === "wordle") mountWordle(root, game);
  if (game.engine === "multi-wordle") mountMultiWordle(root, game);
  if (game.engine === "guessing") mountGuessing(root, game);
  if (game.engine === "word-puzzle") mountPuzzle(root, game);
}

function mountWordle(root: HTMLElement, game: GameConfig) {
  let run = 0;
  let target = createWordleTarget(game, run);
  let guesses: ReturnType<typeof evaluateGuess>[] = [];
  let started = Date.now();
  let done = false;

  const reset = () => {
    run += 1;
    target = createWordleTarget(game, run);
    guesses = [];
    started = Date.now();
    done = false;
    render();
  };

  const render = () => {
    const rows = Array.from({ length: game.attempts ?? 6 }, (_, row) => {
      const guess = guesses[row];
      return `<div class="wordle-row" style="grid-template-columns: repeat(${game.wordLength}, auto)">
        ${Array.from({ length: game.wordLength ?? 5 }, (_, col) => {
          const cell = guess?.[col];
          return `<span class="cell ${cell?.state ?? ""}">${cell?.letter ?? ""}</span>`;
        }).join("")}
      </div>`;
    }).join("");

    root.innerHTML = `
      ${renderGameHeader(game, [
        `${game.wordLength} letters`,
        `${game.attempts} attempts`,
        game.mode ?? "classic"
      ], done ? "Play again" : "New word")}
      <div class="board">${rows}</div>
      <form class="guess-form">
        <input name="guess" maxlength="${game.wordLength}" minlength="${game.wordLength}" autocomplete="off" autocapitalize="characters" aria-label="Enter guess" />
        <button class="button" type="submit">Guess</button>
      </form>
      <p class="message">${done ? "Round complete." : "Use the color feedback to solve the word."}</p>
      ${renderKeyboard(getWordleKeyboardState(guesses))}
    `;

    wireRestart(root, reset);
    wireKeyboard(root, "input[name='guess']");
    useGameFocus(root, "input[name='guess']");

    const form = root.querySelector("form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (done) return;
      const input = form.querySelector<HTMLInputElement>("input");
      const value = input?.value.trim().toLowerCase() ?? "";
      if (value.length !== (game.wordLength ?? 5) || !/^[a-z]+$/.test(value)) {
        setMessage(root, `Enter exactly ${game.wordLength} letters.`);
        return;
      }

      await loadDictionary();
      const answerList = getWords(game.wordLength ?? 5);
      const inAnswerList = answerList.includes(value);
      const inDictionary = globalDictionary && globalDictionary.size > 0 ? globalDictionary.has(value) : false;

      if (!inAnswerList && !inDictionary) {
        setMessage(root, "Word not in dictionary.");
        return;
      }
      const result = evaluateGuess(value, target);
      guesses.push(result);
      input.value = "";
      const won = value === target;
      if (won || guesses.length >= (game.attempts ?? 6)) {
        done = true;
        recordGame(game.slug, won, elapsed(started));
      }
      render();
      if (done) {
        setMessage(root, won ? `Solved: ${target.toUpperCase()}` : `Answer: ${target.toUpperCase()}`);
        showCompletionPopup(root, won, target.toUpperCase(), reset);
      }
    });
  };

  render();
}

function mountMultiWordle(root: HTMLElement, game: GameConfig) {
  let run = 0;
  let targets = createMultiTargets(game, run);
  let guesses: string[] = [];
  let started = Date.now();
  let done = false;

  const reset = () => {
    run += 1;
    targets = createMultiTargets(game, run);
    guesses = [];
    started = Date.now();
    done = false;
    render();
  };

  const render = () => {
    root.innerHTML = `
      ${renderGameHeader(game, [`${game.boardCount} boards`, `${game.attempts} shared attempts`], done ? "Play again" : "New boards")}
      <div class="multi-grid">
        ${targets.map((target, index) => renderMiniBoard(index + 1, target, guesses, game.attempts ?? 8)).join("")}
      </div>
      <form class="guess-form">
        <input name="guess" maxlength="${game.wordLength}" minlength="${game.wordLength}" autocomplete="off" autocapitalize="characters" aria-label="Enter shared guess" />
        <button class="button" type="submit">Guess</button>
      </form>
      <p class="message">One guess updates every board.</p>
      ${renderKeyboard(getMultiKeyboardState(guesses, targets))}
    `;

    wireRestart(root, reset);
    wireKeyboard(root, "input[name='guess']");
    useGameFocus(root, "input[name='guess']");

    const form = root.querySelector("form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (done) return;
      const input = form.querySelector<HTMLInputElement>("input");
      const value = input?.value.trim().toLowerCase() ?? "";
      if (value.length !== (game.wordLength ?? 5) || !/^[a-z]+$/.test(value)) {
        setMessage(root, `Enter exactly ${game.wordLength} letters.`);
        return;
      }

      await loadDictionary();
      const answerList = getWords(game.wordLength ?? 5);
      const inAnswerList = answerList.includes(value);
      const inDictionary = globalDictionary && globalDictionary.size > 0 ? globalDictionary.has(value) : false;

      if (!inAnswerList && !inDictionary) {
        setMessage(root, "Word not in dictionary.");
        return;
      }
      guesses.push(value);
      if (input) input.value = "";
      const solved = targets.every((target) => guesses.includes(target));
      if (solved || guesses.length >= (game.attempts ?? 8)) {
        done = true;
        recordGame(game.slug, solved, elapsed(started));
      }
      render();
      if (done) {
        setMessage(root, solved ? "All boards solved." : `Answers: ${targets.map((word) => word.toUpperCase()).join(", ")}`);
        showCompletionPopup(root, solved, targets.join(", ").toUpperCase(), reset);
      }
    });
  };

  render();
}

function renderMiniBoard(number: number, target: string, guesses: string[], attempts: number) {
  const rows = Array.from({ length: attempts }, (_, row) => {
    const result = guesses[row] ? evaluateGuess(guesses[row], target) : undefined;
    return `<div class="wordle-row" style="grid-template-columns: repeat(${target.length}, auto)">
      ${Array.from({ length: target.length }, (_, col) => {
        const cell = result?.[col];
        return `<span class="cell ${cell?.state ?? ""}">${cell?.letter ?? ""}</span>`;
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
    root.innerHTML = `
      ${renderGameHeader(game, [`${answerLength} letters`, `${Math.max(1, 5 - attempts.length)} tries left`], done ? "Play again" : "New clue")}
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
            ${challenge.hints.map((hint, index) => {
              const isUnlocked = index <= attempts.length;
              const justUnlocked = index === attempts.length && attempts.length > 0;
              if (isUnlocked) {
                return `<div class="hint ${justUnlocked ? 'hint-new' : ''}">${escapeHtml(hint)}</div>`;
              }
              return `<div class="hint locked"><span class="lock-icon">🔒</span> Locked</div>`;
            }).join("")}
          </div>
        </aside>
      </div>
      <form class="guess-form">
        <input class="answer-input" name="answer" maxlength="${Math.max(answerLength + 8, 24)}" autocomplete="off" autocapitalize="characters" aria-label="Enter answer" />
        <button class="button" type="submit">Submit</button>
      </form>
      ${attempts.length > 0 ? `<div class="past-guesses" style="margin-top: 1rem; margin-bottom: 1rem;">
        ${attempts.map(attempt => `<div class="past-guess" style="padding: 0.5rem; background: var(--bg-surface-hover); border-radius: var(--radius); text-align: center; font-weight: 500; font-family: monospace; letter-spacing: 1px; color: var(--fg-muted); margin-bottom: 0.5rem; text-decoration: line-through;">${escapeHtml(attempt.toUpperCase())}</div>`).join("")}
      </div>` : ""}
      <p class="message">${attempts.length ? `${attempts.length} attempt${attempts.length === 1 ? "" : "s"}` : "Type or tap letters. Hints stay beside the board."}</p>
      ${renderKeyboard(getGuessKeyboardState(attempts, challenge))}
    `;

    wireRestart(root, reset);
    wireKeyboard(root, "input[name='answer']");
    useGameFocus(root, "input[name='answer']");

    root.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (done) return;
      const input = root.querySelector<HTMLInputElement>("input");
      const value = input?.value.trim() ?? "";
      if (!normalizeAnswer(value)) {
        setMessage(root, "Enter a guess first.");
        return;
      }
      attempts.push(value);
      if (input) input.value = "";
      const won = normalizeAnswer(value) === normalizeAnswer(challenge.answer);
      if (won || attempts.length >= 5) {
        done = true;
        recordGame(game.slug, won, elapsed(started));
      }
      render();
      if (done) {
        setMessage(root, won ? `Correct: ${challenge.answer}` : `Answer: ${challenge.answer}`);
        showCompletionPopup(root, won, challenge.answer, reset);
      } else {
        if (attempts.length < challenge.hints.length) {
          setMessage(root, "New Hint Unlocked");
        } else {
          setMessage(root, "Not yet. Keep trying.");
        }
      }
    });
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
      .map((letter) => (guessed.has(letter) || done ? letter.toUpperCase() : "_"))
      .join(" ");
    const display = game.mode === "hangman" ? hangmanDisplay : challenge.display;
    const hangmanSvg = game.mode === "hangman" ? `
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
    ` : "";
    
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
        <input class="letter-input" name="answer" autocomplete="off" autocapitalize="characters" maxlength="${game.mode === "hangman" ? challenge.answer.length : 40}" aria-label="Enter answer" />
        <button class="button" type="submit">${game.mode === "hangman" ? "Try" : "Submit"}</button>
      </form>
      <p class="message">${game.mode === "hangman" ? `${6 - misses} misses left` : "Solve the puzzle."}</p>
      ${renderKeyboard(getPuzzleKeyboardState(attempts, guessed, challenge.answer))}
    `;

    wireRestart(root, reset);
    wireKeyboard(root, "input[name='answer']");
    useGameFocus(root, "input[name='answer']");

    root.querySelector("form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (done) return;
      const input = root.querySelector<HTMLInputElement>("input");
      const value = input?.value.trim().toLowerCase() ?? "";
      if (!value) return;

      if (game.mode === "hangman" && value.length === 1 && (guessed.has(value) || attempts.includes(value))) {
        setMessage(root, `Already guessed ${value.toUpperCase()}`);
        if (input) input.value = "";
        return;
      }

      if (game.mode === "hangman" && value.length > 1) {
        await loadDictionary();
        const answerList = getWords(value.length);
        const inAnswerList = answerList.includes(value);
        const inDictionary = globalDictionary && globalDictionary.size > 0 ? globalDictionary.has(value) : false;
        
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
          won = challenge.answer.split("").every((letter) => guessed.has(letter));
        } else if (!won) {
          misses += 1;
          value.split("").forEach((letter, index) => {
            if (challenge.answer[index] === letter) {
              guessed.add(letter);
            }
          });
          won = challenge.answer.split("").every((letter) => guessed.has(letter));
        }
      }

      if (won || misses >= 6 || (game.mode !== "hangman" && value !== challenge.answer)) {
        done = true;
        recordGame(game.slug, won, elapsed(started));
      }
      render();
      if (done) {
        setMessage(root, won ? `Solved: ${challenge.answer.toUpperCase()}` : `Answer: ${challenge.answer.toUpperCase()}`);
        showCompletionPopup(root, won, challenge.answer.toUpperCase(), reset);
      }
    });
  };

  render();
}

function renderGameHeader(game: GameConfig, pills: string[], buttonLabel: string) {
  return `<div class="game-top">
    <div>
      <div class="toolbar">${pills.map((pill) => `<span class="pill">${escapeHtml(pill)}</span>`).join("")}</div>
      <h2>${escapeHtml(game.name)}</h2>
    </div>
    <button class="button secondary" type="button" data-restart>${buttonLabel}</button>
  </div>`;
}

function renderGuessRows(challenge: GuessItem, attempts: string[], rows: number) {
  const answerLetters = getAnswerLetters(challenge);
  return Array.from({ length: rows }, (_, index) => {
    const guess = attempts[index];
    const cells = guess ? evaluateAnswerGuess(guess, challenge) : answerLetters.map(() => ({ letter: "", state: "" }));
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
    const state = !guessLetter ? "absent" : guessLetter === letter ? "correct" : target.includes(guessLetter) ? "present" : "absent";
    return { letter: guessLetter, state };
  });
}

function getAnswerLetters(challenge: GuessItem) {
  return normalizeAnswer(challenge.answer).toUpperCase().split("");
}

function renderKeyboard(states: Record<string, LetterState> = {}) {
  return `<div class="keyboard" aria-label="On-screen keyboard">
    ${keyboardRows.map((row, index) => {
      const keys = index === 2 ? ["ENTER", ...row.split(""), "BACK"] : row.split("");
      return `<div class="keyboard-row">${keys.map((letter) => {
        const label = letter === "BACK" ? "⌫" : letter;
        const state = states[letter] ?? "";
        return `<button class="key ${state} ${letter.length > 1 ? "wide" : ""}" type="button" data-key="${letter}" aria-label="${letter === "BACK" ? "Backspace" : letter}">${label}</button>`;
      }).join("")}</div>`;
    }).join("")}
  </div>`;
}

function wireKeyboard(root: HTMLElement, inputSelector: string) {
  const input = root.querySelector<HTMLInputElement>(inputSelector);
  if (!input) return;
  root.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.key ?? "";
      if (key === "ENTER") {
        input.form?.requestSubmit();
        return;
      }
      if (key === "BACK") {
        input.value = input.value.slice(0, -1);
        input.focus();
        return;
      }
      if (input.value.length < Number(input.maxLength || 40)) {
        input.value += key;
        input.focus();
      }
    });
  });
}

function wireRestart(root: HTMLElement, reset: () => void) {
  root.querySelector("[data-restart]")?.addEventListener("click", reset);
}

function getWordleKeyboardState(guesses: ReturnType<typeof evaluateGuess>[]) {
  const states: Record<string, LetterState> = {};
  guesses.flat().forEach((cell) => mergeKeyboardState(states, cell.letter, cell.state as LetterState));
  return states;
}

function getMultiKeyboardState(guesses: string[], targets: string[]) {
  const states: Record<string, LetterState> = {};
  guesses.forEach((guess) => {
    const mergedForGuess: Record<string, LetterState> = {};
    targets.forEach((target) => {
      evaluateGuess(guess, target).forEach((cell) => mergeKeyboardState(mergedForGuess, cell.letter, cell.state as LetterState));
    });
    Object.entries(mergedForGuess).forEach(([letter, state]) => mergeKeyboardState(states, letter, state));
  });
  return states;
}

function getGuessKeyboardState(attempts: string[], challenge: GuessItem) {
  const states: Record<string, LetterState> = {};
  attempts.forEach((attempt) => {
    evaluateAnswerGuess(attempt, challenge).forEach((cell) => {
      if (cell.letter) mergeKeyboardState(states, cell.letter, cell.state as LetterState);
    });
  });
  return states;
}

function getPuzzleKeyboardState(attempts: string[], guessed: Set<string>, answer: string) {
  const states: Record<string, LetterState> = {};
  const target = answer.toUpperCase();
  guessed.forEach((letter) => mergeKeyboardState(states, letter.toUpperCase(), "correct"));
  attempts.join("").toUpperCase().split("").forEach((letter) => {
    if (/^[A-Z]$/.test(letter)) mergeKeyboardState(states, letter, target.includes(letter) ? "present" : "absent");
  });
  return states;
}

function mergeKeyboardState(states: Record<string, LetterState>, letter: string, state: LetterState) {
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
  localStorage.setItem(key, JSON.stringify([slug, ...recent.filter((item) => item !== slug)].slice(0, 8)));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showCompletionPopup(root: HTMLElement, won: boolean, answer: string, resetCallback: () => void) {
  if (won) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 1000
    });
  }

  const overlay = document.createElement("div");
  overlay.className = "completion-popup-overlay";
  
  const popup = document.createElement("div");
  popup.className = "completion-popup";
  
  const title = document.createElement("h2");
  title.textContent = won ? "Solved!" : "Game Over";
  
  const message = document.createElement("p");
  message.textContent = won ? "Congratulations!" : `The answer was ${answer}`;
  
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
