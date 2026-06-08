import type { GameConfig } from "@/data/games";
import { getWords, pickUniqueWord } from "./wordleEngine";
import { pickSeeded, shuffleSeeded, todayKey } from "./random";

export interface PuzzleChallenge {
  answer: string;
  display: string;
  hint: string;
  grid?: string[][];
}

const synonymPairs = [
  { answer: "bright", display: "Luminous" },
  { answer: "fast", display: "Quick" },
  { answer: "smart", display: "Intelligent" },
  { answer: "happy", display: "Joyful" },
  { answer: "sad", display: "Sorrowful" },
  { answer: "big", display: "Large" },
  { answer: "small", display: "Tiny" },
  { answer: "rich", display: "Wealthy" },
  { answer: "poor", display: "Destitute" },
  { answer: "brave", display: "Courageous" },
  { answer: "calm", display: "Peaceful" },
  { answer: "cold", display: "Chilly" },
  { answer: "hot", display: "Boiling" },
  { answer: "easy", display: "Simple" },
  { answer: "hard", display: "Difficult" }
];

const antonymPairs = [
  { answer: "quiet", display: "Loud" },
  { answer: "hot", display: "Cold" },
  { answer: "fast", display: "Slow" },
  { answer: "happy", display: "Sad" },
  { answer: "good", display: "Bad" },
  { answer: "light", display: "Dark" },
  { answer: "hard", display: "Soft" },
  { answer: "rich", display: "Poor" },
  { answer: "wet", display: "Dry" },
  { answer: "tall", display: "Short" },
  { answer: "old", display: "New" },
  { answer: "open", display: "Closed" },
  { answer: "full", display: "Empty" },
  { answer: "brave", display: "Cowardly" },
  { answer: "clean", display: "Dirty" }
];

export function createPuzzleChallenge(game: GameConfig, run = 0): PuzzleChallenge {
  const words = getWords(game.mode === "dailyWord" ? 5 : 6);
  const seed = game.daily ? `${game.slug}:${todayKey()}` : `${game.slug}:${run}:${Date.now()}`;
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
    const pair = pickSeeded(synonymPairs, seed);
    return { answer: pair.answer, display: pair.display, hint: "Enter a synonym." };
  }

  if (game.mode === "antonym") {
    const pair = pickSeeded(antonymPairs, seed);
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
