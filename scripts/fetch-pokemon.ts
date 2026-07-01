import fs from "fs";
import path from "path";

const ARTWORK_DIR = path.resolve("public/pokemon/artwork");
const SILHOUETTE_DIR = path.resolve("public/pokemon/silhouettes");
const DATA_DIR_PUBLIC = path.resolve("public/data");
const DATA_DIR_SRC = path.resolve("src/data");

// Create directories if they do not exist
[ARTWORK_DIR, SILHOUETTE_DIR, DATA_DIR_PUBLIC, DATA_DIR_SRC].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const specialNames: Record<string, string> = {
  "nidoran-f": "Nidoran♀",
  "nidoran-m": "Nidoran♂",
  "mr-mime": "Mr. Mime",
  "farfetchd": "Farfetch'd",
  "mime-jr": "Mime Jr.",
  "porygon-z": "Porygon-Z",
  "type-null": "Type: Null",
  "ho-oh": "Ho-Oh",
  "tapu-koko": "Tapu Koko",
  "tapu-lele": "Tapu Lele",
  "tapu-bulu": "Tapu Bulu",
  "tapu-fini": "Tapu Fini",
  "sirfetchd": "Sirfetch'd",
  "mr-rime": "Mr. Rime",
  "great-tusk": "Great Tusk",
  "scream-tail": "Scream Tail",
  "brute-bonnet": "Brute Bonnet",
  "flutter-mane": "Flutter Mane",
  "slither-wing": "Slither Wing",
  "sandy-shocks": "Sandy Shocks",
  "iron-treads": "Iron Treads",
  "iron-bundle": "Iron Bundle",
  "iron-hands": "Iron Hands",
  "iron-jugulis": "Iron Jugulis",
  "iron-moth": "Iron Moth",
  "iron-thorns": "Iron Thorns",
  "roaring-moon": "Roaring Moon",
  "iron-valiant": "Iron Valiant",
  "walking-wake": "Walking Wake",
  "iron-leaves": "Iron Leaves",
  "gouging-fire": "Gouging Fire",
  "raging-bolt": "Raging Bolt",
  "iron-boulder": "Iron Boulder",
  "iron-crown": "Iron Crown",
  "chi-yu": "Chi-Yu",
  "chien-pao": "Chien-Pao",
  "ting-lu": "Ting-Lu",
  "wo-chien": "Wo-Chien",
  "hakamo-o": "Hakamo-o",
  "jangmo-o": "Jangmo-o",
  "kommo-o": "Kommo-o",
};

function formatPokemonName(rawName: string): string {
  const lower = rawName.toLowerCase();
  if (specialNames[lower]) return specialNames[lower];
  return lower
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getGenerationNumber(genName: string): number {
  const map: Record<string, number> = {
    "generation-i": 1,
    "generation-ii": 2,
    "generation-iii": 3,
    "generation-iv": 4,
    "generation-v": 5,
    "generation-vi": 6,
    "generation-vii": 7,
    "generation-viii": 8,
    "generation-ix": 9,
  };
  return map[genName] || 1;
}

const evoCache: Record<string, any> = {};

async function getEvolutionStage(evoChainUrl: string, speciesName: string): Promise<number> {
  if (!evoChainUrl) return 0;
  try {
    let chainData = evoCache[evoChainUrl];
    if (!chainData) {
      const res = await fetch(evoChainUrl);
      if (!res.ok) return 1;
      chainData = await res.json();
      evoCache[evoChainUrl] = chainData;
    }

    const chain = chainData.chain;
    if (!chain || !chain.evolves_to || chain.evolves_to.length === 0) {
      return 0; // Does not evolve
    }

    if (chain.species.name === speciesName) {
      return 1; // First evolution stage
    }

    for (const stage2 of chain.evolves_to) {
      if (stage2.species.name === speciesName) {
        return stage2.evolves_to && stage2.evolves_to.length > 0 ? 2 : 3; // Second evolution (or final if no stage 3)
      }
      if (stage2.evolves_to) {
        for (const stage3 of stage2.evolves_to) {
          if (stage3.species.name === speciesName) {
            return 3; // Final evolution
          }
        }
      }
    }
    return 1;
  } catch (err) {
    return 1;
  }
}

async function downloadArtwork(id: number, destPath: string): Promise<boolean> {
  if (fs.existsSync(destPath)) {
    return true; // Already downloaded
  }
  const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // Try fallback to standard sprite if official artwork is missing
      const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) return false;
      const buffer = Buffer.from(await fallbackRes.arrayBuffer());
      fs.writeFileSync(destPath, buffer);
      return true;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    console.error(`Failed to download artwork for ID ${id}:`, err);
    return false;
  }
}

async function fetchPokemonData(limit: number = 151) {
  console.log(`Starting fetch for ${limit} Pokémon...`);
  const results = [];
  const batchSize = 15;

  for (let i = 1; i <= limit; i += batchSize) {
    const batchPromises = [];
    for (let j = i; j < i + batchSize && j <= limit; j++) {
      batchPromises.push(
        (async (id: number) => {
          try {
            const [pokeRes, speciesRes] = await Promise.all([
              fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
              fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
            ]);

            if (!pokeRes.ok || !speciesRes.ok) {
              console.warn(`Skipping Pokémon ID ${id} due to API error.`);
              return null;
            }

            const pokeData = await pokeRes.json();
            const speciesData = await speciesRes.json();

            const name = formatPokemonName(pokeData.name);
            const types = pokeData.types.map(
              (t: any) => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)
            );
            const height = pokeData.height / 10; // Convert to meters
            const weight = pokeData.weight / 10; // Convert to kg
            const abilities = pokeData.abilities
              .filter((a: any) => !a.is_hidden)
              .map((a: any) =>
                a.ability.name
                  .split("-")
                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")
              );

            const generation = getGenerationNumber(speciesData.generation?.name || "generation-i");
            const evoStage = await getEvolutionStage(speciesData.evolution_chain?.url, speciesData.name);

            // Get first English flavor text entry
            const flavorEntry = speciesData.flavor_text_entries?.find(
              (f: any) => f.language.name === "en"
            );
            const description = flavorEntry
              ? flavorEntry.flavor_text.replace(/[\n\f\r]/g, " ").replace(/\s+/g, " ").trim()
              : `A mysterious Generation ${generation} Pokémon.`;

            const artworkPath = path.join(ARTWORK_DIR, `${id}.png`);
            await downloadArtwork(id, artworkPath);

            return {
              id,
              name,
              types,
              generation,
              height,
              weight,
              abilities,
              evolutionStage: evoStage,
              description,
              sprite: `/pokemon/artwork/${id}.png`,
              silhouette: `/pokemon/silhouettes/${id}.png`,
            };
          } catch (err) {
            console.error(`Error processing Pokémon ID ${id}:`, err);
            return null;
          }
        })(j)
      );
    }

    const batchResults = await Promise.all(batchPromises);
    for (const res of batchResults) {
      if (res) results.push(res);
    }
    console.log(`Processed up to ID ${Math.min(i + batchSize - 1, limit)} / ${limit}`);
  }

  results.sort((a, b) => a.id - b.id);

  const jsonStr = JSON.stringify(results, null, 2);
  fs.writeFileSync(path.join(DATA_DIR_PUBLIC, "pokemon.json"), jsonStr);
  fs.writeFileSync(path.join(DATA_DIR_SRC, "pokemon.json"), jsonStr);
  console.log(`Successfully generated pokemon.json with ${results.length} Pokémon.`);
}

const targetLimit = process.argv[2] ? parseInt(process.argv[2], 10) : 151;
fetchPokemonData(targetLimit);
