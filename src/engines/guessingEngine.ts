import dataset from "@/data/datasets.json";
import type { GameConfig } from "@/data/games";
import { pickSeeded, todayKey } from "./random";

export interface GuessItem {
  answer: string;
  display: string;
  hints: string[];
}

function titleHint(answer: string, label: string) {
  const words = answer.split(/\s+/);
  return [
    `${label} with ${words.length} word${words.length === 1 ? "" : "s"}.`,
    `Starts with ${answer[0]?.toUpperCase() ?? "?"}.`,
    `Length without spaces: ${answer.replace(/\s+/g, "").length}.`
  ];
}

export function getGuessPool(game: GameConfig): GuessItem[] {
  if (game.dataset === "capitals") {
    return dataset.capitals.map(([country, capital]) => ({
      answer: capital,
      display: country,
      hints: [`Capital city of ${country}.`, `Starts with ${capital[0]}.`, `${capital.length} characters including spaces.`]
    }));
  }

  if (game.dataset === "countries") {
    return dataset.countries.map((country, index) => ({
      answer: country,
      display: `Country clue #${index + 1}`,
      hints: titleHint(country, "Country")
    }));
  }

  if (game.dataset === "flags") {
    return dataset.countries.map((country, index) => ({
      answer: country,
      display: `Flag challenge ${String(index + 1).padStart(3, "0")}`,
      hints: [`National flag for ${country.length} letters/spaces.`, `Country starts with ${country[0]}.`, "Use the country name as the answer."]
    }));
  }

  const key = (game.dataset ?? "movies") as "movies" | "tvShows" | "anime" | "brands";
  const label = key === "tvShows" ? "TV show" : key === "anime" ? "Anime title" : key === "brands" ? "Brand" : "Movie";
  return dataset[key].map((answer, index) => ({
    answer,
    display: `${label} clue #${index + 1}`,
    hints: titleHint(answer, label)
  }));
}

export function createGuessChallenge(game: GameConfig): GuessItem {
  const pool = getGuessPool(game);
  const seed = game.daily ? `${game.slug}:${todayKey()}` : `${game.slug}:${Date.now()}`;
  return pickSeeded(pool, seed);
}

export function normalizeAnswer(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
