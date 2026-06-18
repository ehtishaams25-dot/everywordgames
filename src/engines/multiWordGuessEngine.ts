import type { GameConfig } from "@/data/games";
import { getWords, getHistory, addHistory } from "./wordGuessEngine";
import { pickSeeded, todayKey } from "./random";

export function createMultiTargets(game: GameConfig, run = 0) {
  const words = getWords(game.wordLength ?? 5);
  const history = getHistory();
  let available = words.filter(w => !history.includes(w));
  
  return Array.from({ length: game.boardCount ?? 2 }, (_, index) => {
    if (available.length === 0) available = words; // fallback
    const target = pickSeeded(available, `${game.slug}:${todayKey()}:${run}:${index}`);
    available = available.filter(w => w !== target);
    addHistory(target);
    return target;
  });
}
