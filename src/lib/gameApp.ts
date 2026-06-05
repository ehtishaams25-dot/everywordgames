import { games, type GameConfig } from "@/data/games";
import { createGuessChallenge, normalizeAnswer } from "@/engines/guessingEngine";
import { createMultiTargets } from "@/engines/multiWordleEngine";
import { recordGame } from "@/engines/playerStore";
import { createPuzzleChallenge } from "@/engines/wordPuzzleEngine";
import { createWordleTarget, evaluateGuess } from "@/engines/wordleEngine";

const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

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
  const started = Date.now();
  let done = false;

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
      <div class="toolbar"><span class="pill">${game.mode ?? "classic"}</span><span class="pill">${game.wordLength} letters</span><span class="pill">${game.attempts} attempts</span></div>
      <h2>${game.name}</h2>
      <div class="board">${rows}</div>
      <form class="guess-form">
        <input name="guess" maxlength="${game.wordLength}" minlength="${game.wordLength}" autocomplete="off" aria-label="Enter guess" />
        <button class="button" type="submit">Guess</button>
      </form>
      <p class="message">${done ? "Round complete." : "Use the color feedback to solve the word."}</p>
      ${renderKeyboard()}
    `;

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
      const result = evaluateGuess(value, target);
      guesses.push(result);
      const won = value === target;
      if (won || guesses.length >= (game.attempts ?? 6)) {
        done = true;
        recordGame(game.slug, won, elapsed(started));
        setTimeout(() => {
          if (game.mode === "endless" && won) {
            run += 1;
            target = createWordleTarget(game, run);
            guesses = [];
            done = false;
          }
          render();
          setMessage(root, won ? `Solved: ${target.toUpperCase()}` : `Answer: ${target.toUpperCase()}`);
        }, 80);
        return;
      }
      render();
    });
  };

  render();
}

function mountMultiWordle(root: HTMLElement, game: GameConfig) {
  const targets = createMultiTargets(game);
  const guesses: string[] = [];
  const started = Date.now();
  let done = false;

  const render = () => {
    root.innerHTML = `
      <div class="toolbar"><span class="pill">${game.boardCount} boards</span><span class="pill">${game.attempts} shared attempts</span></div>
      <h2>${game.name}</h2>
      <div class="multi-grid">
        ${targets.map((target, index) => renderMiniBoard(index + 1, target, guesses, game.attempts ?? 8)).join("")}
      </div>
      <form class="guess-form">
        <input name="guess" maxlength="${game.wordLength}" minlength="${game.wordLength}" autocomplete="off" aria-label="Enter shared guess" />
        <button class="button" type="submit">Guess</button>
      </form>
      <p class="message">One guess updates every board.</p>
    `;

    const form = root.querySelector("form");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (done) return;
      const value = form.querySelector<HTMLInputElement>("input")?.value.trim().toLowerCase() ?? "";
      if (value.length !== (game.wordLength ?? 5) || !/^[a-z]+$/.test(value)) {
        setMessage(root, `Enter exactly ${game.wordLength} letters.`);
        return;
      }
      guesses.push(value);
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
  const challenge = createGuessChallenge(game);
  const started = Date.now();
  let attempts = 0;
  let hintCount = 1;
  let done = false;

  const render = () => {
    root.innerHTML = `
      <h2>${game.name}</h2>
      <div class="clue-box">
        <div>
          <p class="eyebrow">Clue</p>
          <div class="clue-title">${challenge.display}</div>
        </div>
      </div>
      <div class="hint-list">
        ${challenge.hints.slice(0, hintCount).map((hint) => `<div class="hint">${hint}</div>`).join("")}
      </div>
      <form class="guess-form">
        <input class="answer-input" name="answer" autocomplete="off" aria-label="Enter answer" />
        <button class="button" type="submit">Submit</button>
        <button class="button secondary" type="button" data-hint>Hint</button>
      </form>
      <p class="message">${attempts ? `${attempts} attempt${attempts === 1 ? "" : "s"}` : "Use hints carefully for a cleaner solve."}</p>
    `;
    root.querySelector("[data-hint]")?.addEventListener("click", () => {
      hintCount = Math.min(challenge.hints.length, hintCount + 1);
      render();
    });
    root.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (done) return;
      attempts += 1;
      const value = root.querySelector<HTMLInputElement>("input")?.value ?? "";
      const won = normalizeAnswer(value) === normalizeAnswer(challenge.answer);
      if (won || attempts >= 5) {
        done = true;
        recordGame(game.slug, won, elapsed(started));
        render();
        setMessage(root, won ? `Correct: ${challenge.answer}` : `Answer: ${challenge.answer}`);
      } else {
        hintCount = Math.min(challenge.hints.length, hintCount + 1);
        render();
        setMessage(root, "Not yet. Another hint unlocked.");
      }
    });
  };

  render();
}

function mountPuzzle(root: HTMLElement, game: GameConfig) {
  const challenge = createPuzzleChallenge(game);
  const started = Date.now();
  const guessed = new Set<string>();
  let misses = 0;
  let done = false;

  const render = () => {
    const hangmanDisplay = challenge.answer
      .split("")
      .map((letter) => (guessed.has(letter) ? letter.toUpperCase() : "_"))
      .join(" ");
    const display = game.mode === "hangman" ? hangmanDisplay : challenge.display;
    root.innerHTML = `
      <h2>${game.name}</h2>
      <div class="puzzle-box">
        <div>
          <p class="eyebrow">${challenge.hint}</p>
          <div class="clue-title">${display}</div>
          ${challenge.grid ? `<div class="word-search">${challenge.grid.map((row) => `<div class="word-search-row">${row.map((letter) => `<span class="cell">${letter}</span>`).join("")}</div>`).join("")}</div>` : ""}
        </div>
      </div>
      <form class="guess-form">
        <input class="letter-input" name="answer" autocomplete="off" maxlength="${game.mode === "hangman" ? challenge.answer.length : 40}" aria-label="Enter answer" />
        <button class="button" type="submit">${game.mode === "hangman" ? "Try" : "Submit"}</button>
      </form>
      <p class="message">${game.mode === "hangman" ? `${6 - misses} misses left` : "Solve the puzzle."}</p>
    `;

    root.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (done) return;
      const value = root.querySelector<HTMLInputElement>("input")?.value.trim().toLowerCase() ?? "";
      if (!value) return;
      let won = value === challenge.answer;

      if (game.mode === "hangman" && value.length === 1) {
        if (challenge.answer.includes(value)) guessed.add(value);
        else misses += 1;
        won = challenge.answer.split("").every((letter) => guessed.has(letter));
      }

      if (won || misses >= 6 || (game.mode !== "hangman" && value !== challenge.answer)) {
        done = true;
        recordGame(game.slug, won, elapsed(started));
        render();
        setMessage(root, won ? `Solved: ${challenge.answer.toUpperCase()}` : `Answer: ${challenge.answer.toUpperCase()}`);
      } else {
        render();
      }
    });
  };

  render();
}

function renderKeyboard() {
  return `<div class="keyboard" aria-hidden="true">
    ${keyboardRows.map((row) => `<div class="keyboard-row">${row.split("").map((letter) => `<button class="key" type="button" tabindex="-1">${letter}</button>`).join("")}</div>`).join("")}
  </div>`;
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
