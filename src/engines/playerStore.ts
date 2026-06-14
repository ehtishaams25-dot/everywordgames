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
  { id: "three-wins", name: "Triple Start", description: "Win three games.", test: (s: PlayerStats) => s.wins >= 3 },
  { id: "ten-wins", name: "10 Wins", description: "Win ten games.", test: (s: PlayerStats) => s.wins >= 10 },
  { id: "twenty-five-wins", name: "25 Wins", description: "Win twenty-five games.", test: (s: PlayerStats) => s.wins >= 25 },
  { id: "fifty-wins", name: "50 Wins", description: "Win fifty games.", test: (s: PlayerStats) => s.wins >= 50 },
  { id: "hundred-wins", name: "100 Wins", description: "Win one hundred games.", test: (s: PlayerStats) => s.wins >= 100 },
  { id: "three-streak", name: "3 Game Streak", description: "Win three games in a row.", test: (s: PlayerStats) => s.longestStreak >= 3 },
  { id: "seven-streak", name: "7 Win Streak", description: "Win seven games in a row.", test: (s: PlayerStats) => s.longestStreak >= 7 },
  { id: "thirty-streak", name: "30 Win Streak", description: "Win thirty games in a row.", test: (s: PlayerStats) => s.longestStreak >= 30 },
  { id: "word-master", name: "Word Master", description: "Play twenty word games.", test: (s: PlayerStats) => s.played >= 20 },
  { id: "quick-solve", name: "Fast Hands", description: "Solve any game in 30 seconds or less.", test: (s: PlayerStats) => s.fastestSolve !== null && s.fastestSolve <= 30 },
  { id: "daily-regular", name: "Daily Regular", description: "Play any daily mode.", test: (s: PlayerStats) => Object.keys(s.gameCounts).some((slug) => slug.startsWith("daily")) },
  { id: "multi-board", name: "Board Splitter", description: "Play a multi-board Word Guess mode.", test: (s: PlayerStats) => ["double-word-guess", "triple-word-guess", "quad-word-guess", "hex-word-guess", "octo-word-guess", "sedecordle"].some((slug) => s.gameCounts[slug] > 0) },
  { id: "classic-five", name: "Classic Solver", description: "Play 5 Letter Word Guess.", test: (s: PlayerStats) => s.gameCounts["5-letter-word-guess"] > 0 },
  { id: "geography-expert", name: "Geography Expert", description: "Make geography your favorite game family.", test: (s: PlayerStats) => s.favoriteGame.toLowerCase().includes("guess") },
  { id: "movie-buff", name: "Movie Buff", description: "Play a movie guessing challenge.", test: (s: PlayerStats) => s.gameCounts["guess-movie"] > 0 },
  { id: "puzzle-runner", name: "Puzzle Runner", description: "Play hangman, scramble, or word search.", test: (s: PlayerStats) => ["hangman", "word-scramble", "word-search"].some((slug) => s.gameCounts[slug] > 0) }
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
