import dataset from "@/data/categories";
import type { GameConfig } from "@/data/games";
import { pickSeeded, todayKey } from "./random";

export type LetterState = "correct" | "present" | "absent";

export interface WordGuessResult {
  letter: string;
  state: LetterState;
}

export function getWords(length: number): string[] {
  const lists = dataset.wordLists as Record<string, string[]>;
  return (lists[String(length)] ?? lists["5"]).map((word) => word.toLowerCase());
}

function getHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("ewg_played_words");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function addHistory(word: string) {
  if (typeof window === "undefined") return;
  const history = getHistory();
  if (!history.includes(word)) {
    history.push(word);
    localStorage.setItem("ewg_played_words", JSON.stringify(history));
  }
}

export function pickUniqueWord(words: string[], game: GameConfig, run = 0): string {
  // Daily games should always be the exact same word for everyone playing on that day.
  if (game.daily || game.mode === "daily") {
    const seed = `${game.slug}:${todayKey()}`;
    const word = pickSeeded(words, seed);
    addHistory(word);
    return word;
  }
  
  // For infinite/random games, filter out already played words
  const history = getHistory();
  const availableWords = words.filter(w => !history.includes(w));
  
  let chosen: string;
  if (availableWords.length > 0) {
    const seed = `${game.slug}:${run}:${Date.now()}`;
    chosen = pickSeeded(availableWords, seed);
  } else {
    // If somehow all words are played, fallback to any random word
    const seed = `${game.slug}:${run}:${Date.now()}`;
    chosen = pickSeeded(words, seed);
  }
  
  addHistory(chosen);
  return chosen;
}

export function createWordGuessTarget(game: GameConfig, run = 0) {
  const words = getWords(game.wordLength ?? 5);
  return pickUniqueWord(words, game, run);
}

export function evaluateGuess(guessInput: string, targetInput: string): WordGuessResult[] {
  const guess = guessInput.toLowerCase();
  const target = targetInput.toLowerCase();
  const result: WordGuessResult[] = guess.split("").map((letter) => ({ letter, state: "absent" }));
  const remaining = new Map<string, number>();

  target.split("").forEach((letter, index) => {
    if (guess[index] === letter) {
      result[index].state = "correct";
      return;
    }
    remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
  });

  guess.split("").forEach((letter, index) => {
    if (result[index].state === "correct") return;
    const count = remaining.get(letter) ?? 0;
    if (count > 0) {
      result[index].state = "present";
      remaining.set(letter, count - 1);
    }
  });

  return result;
}
