const fs=require('fs'); 
let code = fs.readFileSync('src/engines/wordPuzzleEngine.ts', 'utf8'); 
const idx = code.lastIndexOf('];'); 
if (idx !== -1) { 
  code = code.substring(0, idx + 2) + `

export function createPuzzleChallenge(game: GameConfig, run = 0): PuzzleChallenge {
  const words = getWords(game.mode === "dailyWord" ? 5 : 6);
  const seed = game.daily ? \`\${game.slug}:\${todayKey()}\` : \`\${game.slug}:\${run}:\${Date.now()}\`;
  const answer = pickUniqueWord(words, game, run);

  if (game.mode === "scramble" || game.mode === "unscramble") {
    return {
      answer,
      display: shuffleSeeded(answer.split(""), seed).join("").toUpperCase(),
      hint: "Unscramble the letters."
    };
  }

  if (game.mode === "missing-letters" || game.mode === "dailyWord") {
    const display = answer
      .split("")
      .map((letter, index) => (index % 2 === 0 ? "_" : letter.toUpperCase()))
      .join(" ");
    return { answer, display, hint: "Fill the missing letters to complete the word." };
  }

  if (game.mode === "word-search") {
    return {
      answer,
      display: answer.toUpperCase(),
      hint: "The target word is hidden left-to-right in the grid.",
      grid: makeWordSearch(answer, seed)
    };
  }

  if (game.mode === "synonym") {
    let pair = pickSeeded(synonymPairs, seed);
    const history = getHistory();
    const available = synonymPairs.filter(p => !history.includes(p.answer));
    if (available.length > 0) {
      pair = pickSeeded(available, seed);
    }
    addHistory(pair.answer);
    return { answer: pair.answer, display: pair.display, hint: "Enter a synonym." };
  }

  if (game.mode === "antonym") {
    let pair = pickSeeded(antonymPairs, seed);
    const history = getHistory();
    const available = antonymPairs.filter(p => !history.includes(p.answer));
    if (available.length > 0) {
      pair = pickSeeded(available, seed);
    }
    addHistory(pair.answer);
    return { answer: pair.answer, display: pair.display, hint: "Enter an antonym." };
  }

  return {
    answer,
    display: "_ ".repeat(answer.length).trim(),
    hint: "Guess letters or enter the full word."
  };
}

function makeWordSearch(answer: string, seed: string) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const shuffled = shuffleSeeded(letters.split(""), seed);
  const grid = Array.from({ length: 12 }, (_, row) =>
    Array.from({ length: 12 }, (_, col) => shuffled[(row * 12 + col) % shuffled.length])
  );
  const row = Math.min(5, answer.length);
  answer.toUpperCase().split("").forEach((letter, index) => {
    grid[row][index + 1] = letter;
  });
  return grid;
}
`;
  fs.writeFileSync('src/engines/wordPuzzleEngine.ts', code); 
  console.log('Fixed'); 
}
