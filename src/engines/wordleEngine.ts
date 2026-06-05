import dataset from "@/data/datasets.json";
import type { GameConfig } from "@/data/games";
import { pickSeeded, todayKey } from "./random";

export type LetterState = "correct" | "present" | "absent";

export interface WordleResult {
  letter: string;
  state: LetterState;
}

export function getWords(length: number): string[] {
  const lists = dataset.wordLists as Record<string, string[]>;
  return (lists[String(length)] ?? lists["5"]).map((word) => word.toLowerCase());
}

export function createWordleTarget(game: GameConfig, run = 0) {
  const words = getWords(game.wordLength ?? 5);
  const seed = game.daily || game.mode === "daily" ? `${game.slug}:${todayKey()}` : `${game.slug}:${run}:${Date.now()}`;
  return pickSeeded(words, seed);
}

export function evaluateGuess(guessInput: string, targetInput: string): WordleResult[] {
  const guess = guessInput.toLowerCase();
  const target = targetInput.toLowerCase();
  const result: WordleResult[] = guess.split("").map((letter) => ({ letter, state: "absent" }));
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
