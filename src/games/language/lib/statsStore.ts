export interface LanguageStats {
  gamesPlayed: number;
  wins: number;
  winPercentage: number;
  currentStreak: number;
  bestStreak: number;
  totalPoints: number;
  averageTimeSeconds: number;
  totalTimeSeconds: number;
  favoriteDifficulty: "Easy" | "Medium" | "Hard" | "Expert";
  difficultyCounts: Record<string, number>;
  lastDailyDate?: string;
  lastDailyResult?: string;
}

const STATS_KEY = "everywordgames_guess_language_stats";

const defaultStats: LanguageStats = {
  gamesPlayed: 0,
  wins: 0,
  winPercentage: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalPoints: 0,
  averageTimeSeconds: 0,
  totalTimeSeconds: 0,
  favoriteDifficulty: "Medium",
  difficultyCounts: { Easy: 0, Medium: 0, Hard: 0, Expert: 0 },
};

export function getLanguageStats(): LanguageStats {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...defaultStats };
  }
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return { ...defaultStats };
    const parsed = JSON.parse(raw);
    const gamesPlayed = parsed.gamesPlayed || 0;
    const wins = parsed.wins || 0;
    const winPercentage = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
    const totalTimeSeconds = parsed.totalTimeSeconds || 0;
    const averageTimeSeconds = gamesPlayed > 0 ? Math.round(totalTimeSeconds / gamesPlayed) : 0;

    // Calculate favorite difficulty
    const diffs = parsed.difficultyCounts || { Easy: 0, Medium: 0, Hard: 0, Expert: 0 };
    let fav: "Easy" | "Medium" | "Hard" | "Expert" = "Medium";
    let maxCount = -1;
    for (const [key, val] of Object.entries(diffs)) {
      if ((val as number) > maxCount) {
        maxCount = val as number;
        fav = key as any;
      }
    }

    return {
      ...defaultStats,
      ...parsed,
      winPercentage,
      averageTimeSeconds,
      favoriteDifficulty: fav,
    };
  } catch {
    return { ...defaultStats };
  }
}

export function recordLanguageRound(
  won: boolean,
  points: number,
  timeSec: number,
  difficulty: "Easy" | "Medium" | "Hard" | "Expert",
  isDaily: boolean = false,
  emojiGrid: string = ""
): LanguageStats {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...defaultStats };
  }

  const current = getLanguageStats();
  const gamesPlayed = current.gamesPlayed + 1;
  const wins = won ? current.wins + 1 : current.wins;
  const currentStreak = won ? current.currentStreak + 1 : 0;
  const bestStreak = Math.max(current.bestStreak, currentStreak);
  const totalPoints = Math.max(0, current.totalPoints + points);
  const totalTimeSeconds = current.totalTimeSeconds + Math.max(1, Math.round(timeSec));
  
  const diffCounts = { ...current.difficultyCounts };
  diffCounts[difficulty] = (diffCounts[difficulty] || 0) + 1;

  let lastDailyDate = current.lastDailyDate;
  let lastDailyResult = current.lastDailyResult;
  if (isDaily) {
    lastDailyDate = new Date().toISOString().slice(0, 10);
    lastDailyResult = emojiGrid;
  }

  const updated: LanguageStats = {
    gamesPlayed,
    wins,
    winPercentage: Math.round((wins / gamesPlayed) * 100),
    currentStreak,
    bestStreak,
    totalPoints,
    totalTimeSeconds,
    averageTimeSeconds: Math.round(totalTimeSeconds / gamesPlayed),
    favoriteDifficulty: current.favoriteDifficulty,
    difficultyCounts: diffCounts,
    lastDailyDate,
    lastDailyResult,
  };

  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save language stats:", err);
  }

  return updated;
}

export function resetLanguageStats(): LanguageStats {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(STATS_KEY);
  }
  return { ...defaultStats };
}
