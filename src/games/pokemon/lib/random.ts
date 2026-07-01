import type { EntityItem } from "@/engines/entityGuessingEngine";
import { pickSeeded, todayKey } from "@/engines/random";

export function getRecentHistory(slug: string = "guess-pokemon"): (string | number)[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(`ewg_entity_recent_${slug}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentHistory(slug: string = "guess-pokemon", id: string | number, maxHistory: number = 30) {
  if (typeof localStorage === "undefined") return;
  try {
    const history = getRecentHistory(slug);
    const updated = [id, ...history.filter((x) => x !== id)].slice(0, maxHistory);
    localStorage.setItem(`ewg_entity_recent_${slug}`, JSON.stringify(updated));
  } catch {
    // ignore quota/storage errors
  }
}

export function pickRandomEntity(pool: EntityItem[], slug: string = "guess-pokemon", run: number = 0, isDaily: boolean = false): EntityItem {
  if (!pool || pool.length === 0) {
    throw new Error("Pool is empty!");
  }

  if (isDaily) {
    const seed = `${slug}:daily:${todayKey()}`;
    return pickSeeded(pool, seed);
  }

  const history = getRecentHistory(slug);
  // Filter out recently played entities (unless pool is too small)
  const available = pool.length > history.length ? pool.filter((item) => !history.includes(item.id)) : pool;
  const chosenPool = available.length > 0 ? available : pool;

  // Pick random or seeded by Date.now() + run
  const seed = `${slug}:random:${run}:${Date.now()}:${Math.random()}`;
  const picked = pickSeeded(chosenPool, seed);

  addRecentHistory(slug, picked.id, Math.min(30, Math.floor(pool.length / 2)));
  return picked;
}
