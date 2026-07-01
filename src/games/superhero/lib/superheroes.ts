import type { EntityItem, EntityHint } from "@/engines/entityGuessingEngine";

export interface RawSuperhero {
  id: number;
  name: string;
  publisher: string;
  universe: string;
  team: string[];
  powers: string[];
  gender: string;
  firstAppearance: number;
  aliases: string[];
  image: string;
  silhouette: string;
  tier: "easy" | "medium" | "hard";
}

let superheroPromise: Promise<RawSuperhero[]> | null = null;
let superheroCache: RawSuperhero[] = [];

export async function loadSuperheroDatabase(): Promise<RawSuperhero[]> {
  if (superheroCache.length > 0) return superheroCache;
  if (!superheroPromise) {
    superheroPromise = fetch("/data/superheroes.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch superheroes.json");
        return res.json();
      })
      .then((data: RawSuperhero[]) => {
        superheroCache = data;
        return data;
      })
      .catch((err) => {
        console.warn("Failed to load /data/superheroes.json via fetch, trying static import fallback...", err);
        return import("@/data/superheroes.json").then((mod) => {
          superheroCache = mod.default as RawSuperhero[];
          return superheroCache;
        });
      });
  }
  return superheroPromise;
}

export function superheroToEntity(hero: RawSuperhero): EntityItem {
  const hints: EntityHint[] = [
    { label: "Publisher", value: hero.publisher || "Unknown" },
    { label: "Team Affiliation", value: Array.isArray(hero.team) ? hero.team.join(", ") : (hero.team || "Independent") },
    { label: "Primary Powers", value: Array.isArray(hero.powers) ? hero.powers.join(", ") : (hero.powers || "Peak Human Condition") },
    { label: "First Appearance", value: hero.firstAppearance ? `${hero.firstAppearance}` : "Unknown" },
    { label: "Gender", value: hero.gender || "Unknown" },
    { label: "First Letter", value: `Starts with "${hero.name.charAt(0).toUpperCase()}"` },
  ];

  return {
    id: hero.id,
    name: hero.name,
    aliases: [hero.name.toLowerCase(), ...(hero.aliases || []).map((a) => a.toLowerCase())],
    image: hero.image || `/superheroes/artwork/${hero.id}.webp`,
    silhouette: hero.silhouette || `/superheroes/silhouettes/${hero.id}.webp`,
    hints,
    categoryFilter: hero.tier || "hard",
    metadata: {
      publisher: hero.publisher,
      universe: hero.universe,
      team: hero.team,
      powers: hero.powers,
      firstAppearance: hero.firstAppearance,
      gender: hero.gender,
      tier: hero.tier,
    },
  };
}

export function getSuperheroPool(database: RawSuperhero[], difficulty: string = "Medium"): EntityItem[] {
  let filtered = database;
  if (difficulty === "Easy") {
    filtered = database.filter((h) => h.tier === "easy");
  } else if (difficulty === "Medium") {
    filtered = database.filter((h) => h.tier === "easy" || h.tier === "medium");
  } else {
    filtered = database;
  }
  if (filtered.length === 0) {
    filtered = database;
  }
  return filtered.map(superheroToEntity);
}
