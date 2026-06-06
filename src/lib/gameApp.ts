import { games, type GameConfig } from "@/data/games";
import { createGuessChallenge, normalizeAnswer, type GuessItem } from "@/engines/guessingEngine";
import { createMultiTargets } from "@/engines/multiWordleEngine";
import { recordGame } from "@/engines/playerStore";
import { createPuzzleChallenge } from "@/engines/wordPuzzleEngine";
import { createWordleTarget, evaluateGuess, getWords } from "@/engines/wordleEngine";

type LetterState = "correct" | "present" | "absent";

const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const stateRank: Record<LetterState, number> = { absent: 1, present: 2, correct: 3 };

export function mountGame(root: HTMLElement) {
  const game = games.find((item) => item.slug === root.dataset.slug);
  if (!game) {
    root.innerHTML = "<p>Game not found.</p>";
    return;
  }

  rememberRecent(game.slug);

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

    const form = root.querySelector("form");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (done) return;
      const input = form.querySelector<HTMLInputElement>("input");
      const value = input?.value.trim().toLowerCase() ?? "";
      if (value.length !== (game.wordLength ?? 5) || !/^[a-z]+$/.test(value)) {
        setMessage(root, `Enter exactly ${game.wordLength} letters.`);
        return;
      }
      if (!getWords(game.wordLength ?? 5).includes(value)) {
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
      if (done) setMessage(root, won ? `Solved: ${target.toUpperCase()}` : `Answer: ${target.toUpperCase()}`);
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

    const form = root.querySelector("form");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (done) return;
      const input = form.querySelector<HTMLInputElement>("input");
      const value = input?.value.trim().toLowerCase() ?? "";
      if (value.length !== (game.wordLength ?? 5) || !/^[a-z]+$/.test(value)) {
        setMessage(root, `Enter exactly ${game.wordLength} letters.`);
        return;
      }
      if (!getWords(game.wordLength ?? 5).includes(value)) {
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
      if (done) setMessage(root, solved ? "All boards solved." : `Answers: ${targets.map((word) => word.toUpperCase()).join(", ")}`);
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
  let hintCount = 1;
  let done = false;

  const reset = () => {
    run += 1;
    challenge = createGuessChallenge(game, run);
    started = Date.now();
    attempts = [];
    hintCount = 1;
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
            <button class="button secondary small" type="button" data-hint ${hintCount >= challenge.hints.length ? "disabled" : ""}>Hint</button>
          </div>
          <div class="hint-list">
            ${challenge.hints.slice(0, hintCount).map((hint) => `<div class="hint">${escapeHtml(hint)}</div>`).join("")}
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

    root.querySelector("[data-hint]")?.addEventListener("click", () => {
      hintCount = Math.min(challenge.hints.length, hintCount + 1);
      render();
    });

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
      } else {
        hintCount = Math.min(challenge.hints.length, hintCount + 1);
      }
      render();
      if (done) setMessage(root, won ? `Correct: ${challenge.answer}` : `Answer: ${challenge.answer}`);
      else setMessage(root, "Not yet. Another hint unlocked.");
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
      .map((letter) => (guessed.has(letter) ? letter.toUpperCase() : "_"))
      .join(" ");
    const display = game.mode === "hangman" ? hangmanDisplay : challenge.display;
    const hangmanSvg = game.mode === "hangman" ? `
      <svg viewBox="0 0 200 250" class="hangman-svg" style="width: 100%; max-width: 200px; margin: 0 auto; display: block; stroke: currentColor; stroke-width: 4; stroke-linecap: round; fill: none;">
        <line x1="20" y1="230" x2="100" y2="230" />
        <line x1="60" y1="230" x2="60" y2="20" />
        <line x1="60" y1="20" x2="140" y2="20" />
        <line x1="140" y1="20" x2="140" y2="50" style="stroke-width: 2;" />
        <circle cx="140" cy="70" r="20" style="opacity: ${misses > 0 ? 1 : 0}; transition: opacity 0.3s;" />
        <line x1="140" y1="90" x2="140" y2="150" style="opacity: ${misses > 1 ? 1 : 0}; transition: opacity 0.3s;" />
        <line x1="140" y1="100" x2="110" y2="130" style="opacity: ${misses > 2 ? 1 : 0}; transition: opacity 0.3s;" />
        <line x1="140" y1="100" x2="170" y2="130" style="opacity: ${misses > 3 ? 1 : 0}; transition: opacity 0.3s;" />
        <line x1="140" y1="150" x2="110" y2="190" style="opacity: ${misses > 4 ? 1 : 0}; transition: opacity 0.3s;" />
        <line x1="140" y1="150" x2="170" y2="190" style="opacity: ${misses > 5 ? 1 : 0}; transition: opacity 0.3s;" />
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

    root.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (done) return;
      const input = root.querySelector<HTMLInputElement>("input");
      const value = input?.value.trim().toLowerCase() ?? "";
      if (!value) return;
      attempts.push(value);
      if (input) input.value = "";
      let won = value === challenge.answer;

      if (game.mode === "hangman" && value.length === 1) {
        if (challenge.answer.includes(value)) guessed.add(value);
        else misses += 1;
        won = challenge.answer.split("").every((letter) => guessed.has(letter));
      }

      if (won || misses >= 6 || (game.mode !== "hangman" && value !== challenge.answer)) {
        done = true;
        recordGame(game.slug, won, elapsed(started));
      }
      render();
      if (done) setMessage(root, won ? `Solved: ${challenge.answer.toUpperCase()}` : `Answer: ${challenge.answer.toUpperCase()}`);
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
