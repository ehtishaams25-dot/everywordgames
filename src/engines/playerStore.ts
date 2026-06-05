export interface PlayerStats {
  played: number;
  wins: number;
  losses: number;
  currentStreak: number;
  longestStreak: number;
  fastestSolve: number | null;
  totalSolveSeconds: number;
  favoriteGame: string;
  gameCounts: Record<string, number>;
}

export const defaultStats: PlayerStats = {
  played: 0,
  wins: 0,
  losses: 0,
  currentStreak: 0,
  longestStreak: 0,
  fastestSolve: null,
  totalSolveSeconds: 0,
  favoriteGame: "None yet",
  gameCounts: {}
};

export const achievements = [
  { id: "first-win", name: "First Win", description: "Win any game once.", test: (s: PlayerStats) => s.wins >= 1 },
  { id: "ten-wins", name: "10 Wins", description: "Win ten games.", test: (s: PlayerStats) => s.wins >= 10 },
  { id: "fifty-wins", name: "50 Wins", description: "Win fifty games.", test: (s: PlayerStats) => s.wins >= 50 },
  { id: "hundred-wins", name: "100 Wins", description: "Win one hundred games.", test: (s: PlayerStats) => s.wins >= 100 },
  { id: "seven-streak", name: "7 Day Streak", description: "Reach a seven game streak.", test: (s: PlayerStats) => s.longestStreak >= 7 },
  { id: "thirty-streak", name: "30 Day Streak", description: "Reach a thirty game streak.", test: (s: PlayerStats) => s.longestStreak >= 30 },
  { id: "word-master", name: "Word Master", description: "Play twenty word games.", test: (s: PlayerStats) => s.played >= 20 },
  { id: "geography-expert", name: "Geography Expert", description: "Make geography your favorite game family.", test: (s: PlayerStats) => s.favoriteGame.toLowerCase().includes("guess") },
  { id: "movie-buff", name: "Movie Buff", description: "Play a movie guessing challenge.", test: (s: PlayerStats) => s.gameCounts["guess-movie"] > 0 }
];

export function loadStats(): PlayerStats {
  if (typeof localStorage === "undefined") return defaultStats;
  const saved = localStorage.getItem("ewg:stats");
  return saved ? { ...defaultStats, ...JSON.parse(saved) } : { ...defaultStats };
}

export function saveStats(stats: PlayerStats) {
  localStorage.setItem("ewg:stats", JSON.stringify(stats));
}

export function recordGame(gameSlug: string, won: boolean, seconds: number) {
  const stats = loadStats();
  stats.played += 1;
  stats.gameCounts[gameSlug] = (stats.gameCounts[gameSlug] ?? 0) + 1;
  stats.favoriteGame = Object.entries(stats.gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? gameSlug;
  if (won) {
    stats.wins += 1;
    stats.currentStreak += 1;
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.fastestSolve = stats.fastestSolve === null ? seconds : Math.min(stats.fastestSolve, seconds);
    stats.totalSolveSeconds += seconds;
  } else {
    stats.losses += 1;
    stats.currentStreak = 0;
  }
  saveStats(stats);
  return stats;
}
