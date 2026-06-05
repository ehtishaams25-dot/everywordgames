import type { GameConfig } from "@/data/games";
import { getWords } from "./wordleEngine";
import { pickSeeded, todayKey } from "./random";

export function createMultiTargets(game: GameConfig, run = 0) {
  const words = getWords(game.wordLength ?? 5);
  return Array.from({ length: game.boardCount ?? 2 }, (_, index) =>
    pickSeeded(words, `${game.slug}:${todayKey()}:${run}:${index}`)
  );
}
