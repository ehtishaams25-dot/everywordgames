export type GameEngine =
  | "word-guess"
  | "multi-word-guess"
  | "guessing"
  | "word-puzzle"
  | "grid-puzzle"
  | "coming-soon";
export type GameCategory =
  | "word-guess"
  | "multi-word-guess"
  | "geography"
  | "entertainment"
  | "brands"
  | "word-games"
  | "grid-games"
  | "daily"
  | "future";
export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export interface GameConfig {
  slug: string;
  name: string;
  description: string;
  category: GameCategory;
  engine: GameEngine;
  difficulty: Difficulty;
  featured?: boolean;
  trending?: boolean;
  daily?: boolean;
  comingSoon?: boolean;
  wordLength?: number;
  attempts?: number;
  boardCount?: number;
  mode?: string;
  dataset?: string;
}

const wordGuessLengths = [2, 3, 4, 5, 6, 7, 8, 9, 10];

export const games: GameConfig[] = [
  ...wordGuessLengths.map((length) => ({
    slug: `${length}-letter-word-guess`,
    name: `${length} Letter Word Guess`,
    description: `Solve a ${length}-letter hidden word with crisp color feedback.`,
    category: "word-guess" as const,
    engine: "word-guess" as const,
    difficulty:
      length <= 4
        ? ("Easy" as const)
        : length <= 6
          ? ("Medium" as const)
          : ("Hard" as const),
    featured: length === 5,
    trending: length === 6,
    wordLength: length,
    attempts: Math.max(5, length + 1),
    mode: "classic",
  })),

  {
    slug: "endless-word-guess",
    name: "Endless Word Guess",
    description: "Keep solving fresh words until you decide to stop.",
    category: "word-guess",
    engine: "word-guess",
    difficulty: "Medium",
    trending: true,
    wordLength: 5,
    attempts: 6,
    mode: "endless",
  },
  {
    slug: "survival-word-guess",
    name: "Survival Word Guess",
    description: "Win to advance, miss and the run ends.",
    category: "word-guess",
    engine: "word-guess",
    difficulty: "Hard",
    trending: true,
    wordLength: 5,
    attempts: 5,
    mode: "survival",
  },
  {
    slug: "hardcore-word-guess",
    name: "Hardcore Word Guess",
    description: "A sharper Word Guess with fewer attempts and strict pacing.",
    category: "word-guess",
    engine: "word-guess",
    difficulty: "Expert",
    wordLength: 5,
    attempts: 4,
    mode: "hardcore",
  },
  ...[
    ["double-word-guess", "Double Word Guess", 2, 7, "Easy"],
    ["triple-word-guess", "Triple Word Guess", 3, 8, "Medium"],
    ["quad-word-guess", "Quad Word Guess", 4, 9, "Medium"],
    ["hex-word-guess", "Hex Word Guess", 6, 10, "Hard"],
    ["octo-word-guess", "Octo Word Guess", 8, 12, "Hard"],
    ["sedecordle", "Sedecordle", 16, 21, "Expert"],
  ].map(([slug, name, boardCount, attempts, difficulty]) => ({
    slug: slug as string,
    name: name as string,
    description: `Solve ${boardCount} hidden words using one shared guess stream.`,
    category: "multi-word-guess" as const,
    engine: "multi-word-guess" as const,
    difficulty: difficulty as Difficulty,
    trending: boardCount === 8,
    boardCount: boardCount as number,
    attempts: attempts as number,
    wordLength: 5,
    mode: "multi",
  })),
  ...[
    [
      "guess-country",
      "Guess Country",
      "Identify the country from layered geography clues.",
      "geography",
      "countries",
      "Medium",
    ],
    [
      "guess-flag",
      "Guess Flag",
      "Use color and region hints to name the flag.",
      "geography",
      "flags",
      "Medium",
    ],
    [
      "guess-capital",
      "Guess Capital",
      "Match capitals to their countries.",
      "geography",
      "capitals",
      "Hard",
    ],
    [
      "guess-movie",
      "Guess Movie",
      "Guess the movie from cast, year, and genre hints.",
      "entertainment",
      "movies",
      "Medium",
    ],
    [
      "guess-tv-show",
      "Guess TV Show",
      "Spot the series through progressive clues.",
      "entertainment",
      "tvShows",
      "Medium",
    ],
    [
      "guess-anime",
      "Guess Anime",
      "Name the anime from studio and story clues.",
      "entertainment",
      "anime",
      "Medium",
    ],
  ].map(([slug, name, description, category, dataset, difficulty]) => ({
    slug: slug as string,
    name: name as string,
    description: description as string,
    category: category as GameCategory,
    engine: "guessing" as const,
    difficulty: difficulty as Difficulty,
    featured: slug === "guess-country",
    trending: slug === "guess-movie",
    comingSoon: ["guess-capital", "guess-movie", "guess-tv-show", "guess-anime"].includes(slug as string),
    dataset: dataset as string,
    mode: slug as string,
  })),
  ...[
    [
      "hangman",
      "Hangman",
      "Reveal the hidden word before the misses run out.",
      "Medium",
      "hangman",
    ],
    [
      "word-scramble",
      "Word Scramble",
      "Rearrange the shuffled letters into the target word.",
      "Easy",
      "scramble",
    ],
    [
      "missing-letters",
      "Missing Letters",
      "Fill in the blanks to complete the word.",
      "Medium",
      "missing-letters",
    ],
    [
      "synonym-challenge",
      "Synonym Challenge",
      "Guess a close match for the clue word.",
      "Hard",
      "synonym",
    ],
    [
      "antonym-challenge",
      "Antonym Challenge",
      "Find the opposite of the clue word.",
      "Hard",
      "antonym",
    ],
  ].map(([slug, name, description, difficulty, mode]) => ({
    slug: slug as string,
    name: name as string,
    description: description as string,
    category: "word-games" as const,
    engine: "word-puzzle" as const,
    difficulty: difficulty as Difficulty,
    featured: slug === "hangman" || slug === "word-scramble",
    trending: false,
    mode: mode as string,
  })),
  {
    slug: "merge-letters",
    name: "Merge Letters",
    description: "Slide and merge identical letters to reach higher letters of the alphabet.",
    category: "grid-games",
    engine: "grid-puzzle",
    difficulty: "Medium",
    featured: true,
    trending: true,
  },
  ...[
    [
      "daily-word",
      "Daily Word",
      "A date-seeded word puzzle challenge.",
      "dailyWord",
    ],
    [
      "daily-country",
      "Daily Country",
      "A daily geography clue challenge.",
      "dailyCountry",
    ],
    [
      "daily-flag",
      "Daily Flag",
      "A same-for-everyone flag challenge.",
      "dailyFlag",
    ],
    [
      "daily-movie",
      "Daily Movie",
      "A daily movie clue challenge.",
      "dailyMovie",
    ],
  ].map(([slug, name, description, mode]) => ({
    slug: slug as string,
    name: name as string,
    description: description as string,
    category: "daily" as const,
    engine:
      mode === "dailyWord" ? ("word-puzzle" as const) : ("guessing" as const),
    difficulty: "Medium" as const,
    daily: true,
    dataset:
      mode === "dailyMovie"
        ? "movies"
        : mode === "dailyCountry"
          ? "countries"
          : mode === "dailyFlag"
            ? "flags"
            : undefined,
    mode: mode as string,
  })),
  ...[
    "Crossword",
    "Mini Crossword",
    "Spelling Bee",
    "Word Chain",
    "Rhyme Challenge",
    "Guess Song",
    "Guess Actor",
    "Guess Footballer",
    "Guess Cricketer",
    "Guess Stadium",
    "Guess Historical Figure",
    "Guess Scientist",
    "Guess Invention",
    "Guess Celebrity",
  ].map((name) => ({
    slug: name.toLowerCase().replaceAll(" ", "-"),
    name,
    description: "Planned expansion mode for the EveryWordGames catalog.",
    category: "future" as const,
    engine: "coming-soon" as const,
    difficulty: "Medium" as const,
    comingSoon: true,
  })),
];

export const playableGames = games.filter((game) => !game.comingSoon);
export const comingSoonGames = games.filter((game) => game.comingSoon);

export const categoryLabels: Record<GameCategory, string> = {
  "word-guess": "Word Guess Family",
  "multi-word-guess": "Multi Word Guess",
  geography: "Geography",
  entertainment: "Entertainment",
  brands: "Brands",
  "word-games": "Word Games",
  "grid-games": "Grid Games",
  daily: "Daily Challenges",
  future: "Coming Soon",
};

export const siteNav = [
  { href: "/", label: "Home" },
  { href: "/?game=5-letter-word-guess", label: "Word Guess" },
  { href: "/?game=guess-country", label: "Guess" },
  { href: "/?game=hangman", label: "Puzzles" },
  { href: "/stats/", label: "Stats" },
  { href: "/achievements/", label: "Awards" },
  { href: "/blog/", label: "Blog" },
];

export const footerNav = [
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
  { href: "/privacy/", label: "Privacy" },
  { href: "/terms/", label: "Terms" },
];

export function getGame(slug: string) {
  return games.find((game) => game.slug === slug);
}
