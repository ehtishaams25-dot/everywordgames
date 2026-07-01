export interface EntityGameStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  currentStreak: number;
  bestStreak: number;
  totalGuessesOnWins: number;
  averageGuesses: number;
  guessDistribution: Record<number, number>;
}

const defaultStats = (): EntityGameStats => ({
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  winPercentage: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalGuessesOnWins: 0,
  averageGuesses: 0,
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
});

export function getEntityStats(slug: string = "guess-superhero"): EntityGameStats {
  if (typeof localStorage === "undefined") return defaultStats();
  try {
    const raw = localStorage.getItem(`ewg_entity_stats_${slug}`);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw);
    return { ...defaultStats(), ...parsed };
  } catch {
    return defaultStats();
  }
}

export function recordEntityGame(
  slug: string = "guess-superhero",
  won: boolean,
  numGuesses: number
): EntityGameStats {
  if (typeof localStorage === "undefined") return defaultStats();
  const stats = getEntityStats(slug);

  stats.gamesPlayed += 1;
  if (won) {
    stats.wins += 1;
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }
    stats.totalGuessesOnWins += numGuesses;
    stats.guessDistribution[numGuesses] = (stats.guessDistribution[numGuesses] || 0) + 1;
  } else {
    stats.losses += 1;
    stats.currentStreak = 0;
  }

  stats.winPercentage = Math.round((stats.wins / stats.gamesPlayed) * 100);
  stats.averageGuesses = stats.wins > 0
    ? Math.round((stats.totalGuessesOnWins / stats.wins) * 10) / 10
    : 0;

  try {
    localStorage.setItem(`ewg_entity_stats_${slug}`, JSON.stringify(stats));
  } catch {
    // ignore quota errors
  }

  return stats;
}

export function formatShareCard(
  title: string,
  won: boolean,
  guesses: string[],
  maxAttempts: number = 6
): string {
  const count = won ? guesses.length : maxAttempts;
  const squares = Array.from({ length: count }, () => {
    return won ? "🟩" : "🟥";
  }).join("");

  return `${title}\n${squares}\nSolved in ${won ? guesses.length : "X"}/${maxAttempts}\neverywordgames.com`;
}
