import type { EntityItem, EntityHint } from "@/engines/entityGuessingEngine";

export interface RawPokemon {
  id: number;
  name: string;
  types: string[];
  generation: number;
  height: number;
  weight: number;
  abilities: string[];
  evolutionStage: number;
  description: string;
  sprite: string;
  silhouette: string;
}

let pokemonPromise: Promise<RawPokemon[]> | null = null;
let pokemonCache: RawPokemon[] = [];

export async function loadPokemonDatabase(): Promise<RawPokemon[]> {
  if (pokemonCache.length > 0) return pokemonCache;
  if (!pokemonPromise) {
    pokemonPromise = fetch("/data/pokemon.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch pokemon.json");
        return res.json();
      })
      .then((data: RawPokemon[]) => {
        pokemonCache = data;
        return data;
      })
      .catch((err) => {
        console.warn("Failed to load /data/pokemon.json via fetch, trying static import fallback...", err);
        return import("@/data/pokemon.json").then((mod) => {
          pokemonCache = mod.default as RawPokemon[];
          return pokemonCache;
        });
      });
  }
  return pokemonPromise;
}

function formatEvolutionStage(stage: number): string {
  switch (stage) {
    case 0:
      return "Does not evolve";
    case 1:
      return "First evolution";
    case 2:
      return "Second evolution";
    case 3:
      return "Final evolution";
    default:
      return "Unknown stage";
  }
}

function maskName(text: string, name: string): string {
  if (!text || !name) return text || "";
  const regex = new RegExp(name, "gi");
  return text.replace(regex, "???");
}

export function pokemonToEntity(pokemon: RawPokemon): EntityItem {
  const hints: EntityHint[] = [
    { label: "Type", value: pokemon.types.join(" / ") },
    { label: "Generation", value: `Generation ${pokemon.generation}` },
    { label: "Height & Weight", value: `Height: ${pokemon.height} m, Weight: ${pokemon.weight} kg` },
    { label: "First Letter", value: `Starts with "${pokemon.name.charAt(0).toUpperCase()}"` },
    { label: "Evolution Stage", value: formatEvolutionStage(pokemon.evolutionStage) },
    { label: "Pokédex Entry", value: maskName(pokemon.description, pokemon.name) },
  ];

  return {
    id: pokemon.id,
    name: pokemon.name,
    aliases: [pokemon.name.toLowerCase()],
    image: pokemon.sprite || `/pokemon/artwork/${pokemon.id}.png`,
    silhouette: pokemon.silhouette || `/pokemon/silhouettes/${pokemon.id}.png`,
    hints,
    categoryFilter: `gen${pokemon.generation}`,
    metadata: {
      types: pokemon.types,
      generation: pokemon.generation,
      height: pokemon.height,
      weight: pokemon.weight,
      abilities: pokemon.abilities,
      description: pokemon.description,
    },
  };
}

export function getPokemonPool(database: RawPokemon[], difficulty: string = "Medium"): EntityItem[] {
  let filtered = database;
  if (difficulty === "Easy") {
    // Gen 1 only
    filtered = database.filter((p) => p.generation === 1 || p.id <= 151);
  } else if (difficulty === "Medium") {
    // Gen 1 - 4
    filtered = database.filter((p) => p.generation <= 4 || p.id <= 493);
  } else {
    // Hard / All Pokémon
    filtered = database;
  }
  return filtered.map(pokemonToEntity);
}
