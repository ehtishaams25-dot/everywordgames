export interface LanguageItem {
  id: number;
  language: string;
  family: string;
  country: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  fact: string;
  audio: string;
  samplePhrase?: string;
  langCode?: string;
  openSourceAudioUrl?: string;
}

let languagePromise: Promise<LanguageItem[]> | null = null;
let languageCache: LanguageItem[] = [];

export async function loadLanguageDatabase(): Promise<LanguageItem[]> {
  if (languageCache.length > 0) return languageCache;
  if (!languagePromise) {
    languagePromise = fetch("/data/languages.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch languages.json");
        return res.json();
      })
      .then((data: LanguageItem[]) => {
        languageCache = data;
        return data;
      })
      .catch((err) => {
        console.warn("Failed to load /data/languages.json via fetch, trying static import fallback...", err);
        return import("@/data/languages.json").then((mod) => {
          languageCache = mod.default as LanguageItem[];
          return languageCache;
        });
      });
  }
  return languagePromise;
}

export function getLanguagePool(
  database: LanguageItem[],
  difficulty: "Easy" | "Medium" | "Hard" | "Expert" = "Medium"
): LanguageItem[] {
  let filtered = database;
  if (difficulty === "Easy") {
    filtered = database.filter((l) => l.difficulty === "Easy");
  } else if (difficulty === "Medium") {
    filtered = database.filter((l) => l.difficulty === "Easy" || l.difficulty === "Medium");
  } else if (difficulty === "Hard") {
    filtered = database.filter((l) => l.difficulty !== "Expert");
  } else {
    filtered = database;
  }
  if (filtered.length === 0) filtered = database;
  return filtered;
}

export function pickRandomLanguage(
  pool: LanguageItem[],
  run: number = 1,
  isDaily: boolean = false,
  excludeIds: number[] = []
): LanguageItem {
  if (pool.length === 0) {
    throw new Error("Language pool is empty.");
  }

  let available = pool.filter((l) => !excludeIds.includes(l.id));
  if (available.length === 0) available = pool;

  if (isDaily) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    let seed = 0;
    for (let i = 0; i < today.length; i++) {
      seed = (seed << 5) - seed + today.charCodeAt(i);
      seed |= 0;
    }
    const index = Math.abs(seed) % available.length;
    return available[index] || available[0];
  }

  const index = Math.floor(Math.random() * available.length);
  return available[index] || available[0];
}

export function getMultipleChoiceOptions(
  target: LanguageItem,
  allLanguages: LanguageItem[],
  count: number = 4,
  expertFamilyGrouping: boolean = false
): LanguageItem[] {
  const options: LanguageItem[] = [target];
  const others = allLanguages.filter((l) => l.id !== target.id);

  if (expertFamilyGrouping) {
    // Prioritize same family or related families
    const sameFamily = others.filter((l) => l.family === target.family);
    const diffFamily = others.filter((l) => l.family !== target.family);

    const shuffledSame = [...sameFamily].sort(() => Math.random() - 0.5);
    const shuffledDiff = [...diffFamily].sort(() => Math.random() - 0.5);

    for (const item of shuffledSame) {
      if (options.length < count) options.push(item);
    }
    for (const item of shuffledDiff) {
      if (options.length < count) options.push(item);
    }
  } else {
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    for (const item of shuffled) {
      if (options.length < count) options.push(item);
    }
  }

  return options.sort(() => Math.random() - 0.5);
}

export function normalizeLanguageName(input: string): string {
  if (!input) return "";
  let cleaned = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Handle common synonyms and spelling variations
  const map: Record<string, string> = {
    "portugues": "portuguese",
    "brazilian": "portuguese",
    "mandarin": "mandarin chinese",
    "chinese": "mandarin chinese",
    "farsi": "persian",
    "castilian": "spanish",
    "deutsch": "german",
    "francais": "french",
    "espanol": "spanish",
    "italiano": "italian",
    "nihongo": "japanese",
    "hangul": "korean",
    "tagalog / filipino": "tagalog",
    "filipino": "tagalog",
    "svenska": "swedish",
    "norsk": "norwegian",
    "dansk": "danish",
    "suomi": "finnish",
    "magyar": "hungarian",
    "romana": "romanian",
  };

  return map[cleaned] || cleaned;
}

export function checkLanguageGuess(guess: string, targetLanguageName: string): boolean {
  const normGuess = normalizeLanguageName(guess);
  const normTarget = normalizeLanguageName(targetLanguageName);
  if (!normGuess || !normTarget) return false;
  return normGuess === normTarget;
}
