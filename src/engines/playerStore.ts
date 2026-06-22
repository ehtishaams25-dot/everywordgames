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
  highScores: Record<string, number>;
  fastestSolves: Record<string, number>;
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
  gameCounts: {},
  highScores: {},
  fastestSolves: {}
};

export interface Achievement {
  id: string;
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  test: (s: PlayerStats) => boolean;
}

export const achievements: Achievement[] = [
  // --- EASY ACHIEVEMENTS ---
  { id: "vibe-check", name: "Vibe Check", description: "Play any game once. Just testing the waters.", difficulty: "easy", test: (s: PlayerStats) => s.played >= 1 },
  { id: "first-win", name: "First Dub", description: "Won a game. You secured the bag, no cap.", difficulty: "easy", test: (s: PlayerStats) => s.wins >= 1 },
  { id: "three-wins", name: "Let Him Cook", description: "Won 3 games. The kitchen is officially heating up.", difficulty: "easy", test: (s: PlayerStats) => s.wins >= 3 },
  { id: "three-streak", name: "Locked In", description: "3-game win streak. Focus level: maxed.", difficulty: "easy", test: (s: PlayerStats) => s.longestStreak >= 3 },
  { id: "daily-regular", name: "Daily Grind", description: "Play a daily mode. Keeping the streak alive, respect.", difficulty: "easy", test: (s: PlayerStats) => Object.keys(s.gameCounts).some((slug) => slug.startsWith("daily")) },
  { id: "classic-five", name: "OG Player", description: "Play 5 Letter Word Guess. Respecting the classics.", difficulty: "easy", test: (s: PlayerStats) => (s.gameCounts["5-letter-word-guess"] ?? 0) > 0 },
  { id: "puzzle-runner", name: "Side Questing", description: "Play hangman, scramble, or word search. Casual gamer hours.", difficulty: "easy", test: (s: PlayerStats) => ["hangman", "word-scramble", "word-search"].some((slug) => (s.gameCounts[slug] ?? 0) > 0) },
  { id: "skill-issue", name: "Skill Issue", description: "Lost 5 games. It's giving skill issue, fr.", difficulty: "easy", test: (s: PlayerStats) => s.losses >= 5 },

  // --- MEDIUM ACHIEVEMENTS ---
  { id: "ten-wins", name: "W Rizz", description: "Won 10 games. You are literally him/her, fr fr.", difficulty: "medium", test: (s: PlayerStats) => s.wins >= 10 },
  { id: "twenty-five-wins", name: "Dub Farmer", description: "Won 25 games. Farming wins like it's a 9-to-5.", difficulty: "medium", test: (s: PlayerStats) => s.wins >= 25 },
  { id: "seven-streak", name: "Sheesh Mode", description: "7-game win streak. Unstoppable aura, honestly.", difficulty: "medium", test: (s: PlayerStats) => s.longestStreak >= 7 },
  { id: "word-master", name: "Certified Yapper", description: "Play 20 word games. You just love to yap, don't you?", difficulty: "medium", test: (s: PlayerStats) => s.played >= 20 },
  { id: "quick-solve", name: "Speedrun Any%", description: "Solve in 30 seconds or less. Fast AF, no delay.", difficulty: "medium", test: (s: PlayerStats) => s.fastestSolve !== null && s.fastestSolve <= 30 },
  { id: "multi-board", name: "Galaxy Brain", description: "Play a multi-board Word Guess mode. Big brain energy.", difficulty: "medium", test: (s: PlayerStats) => ["double-word-guess", "triple-word-guess", "quad-word-guess", "hex-word-guess", "octo-word-guess", "sedecordle"].some((slug) => (s.gameCounts[slug] ?? 0) > 0) },
  { id: "geography-expert", name: "Mr. Worldwide", description: "Make geography your favorite game. Certified atlas enjoyer.", difficulty: "medium", test: (s: PlayerStats) => s.favoriteGame.toLowerCase().includes("guess") },
  { id: "hustle-culture", name: "Hustle Culture", description: "Play 50 games total. Respect the grind.", difficulty: "medium", test: (s: PlayerStats) => s.played >= 50 },
  { id: "world-tour", name: "World Tour", description: "Play 5 different games. Side quests are your main quest.", difficulty: "medium", test: (s: PlayerStats) => Object.keys(s.gameCounts).filter((slug) => (s.gameCounts[slug] ?? 0) > 0).length >= 5 },

  // --- HARD ACHIEVEMENTS ---
  { id: "fifty-wins", name: "Built Different", description: "Won 50 games. A whole different breed.", difficulty: "hard", test: (s: PlayerStats) => s.wins >= 50 },
  { id: "hundred-wins", name: "Touch Grass", description: "Won 100 games. Absolutely goated, but please go outside.", difficulty: "hard", test: (s: PlayerStats) => s.wins >= 100 },
  { id: "thirty-streak", name: "Infinite Aura", description: "30-game win streak. Bro has infinite rizz and aura.", difficulty: "hard", test: (s: PlayerStats) => s.longestStreak >= 30 },
  { id: "fast-furious", name: "Speedrun Any% Pro", description: "Solve in 15 seconds or less. Bro is speedrunning life.", difficulty: "hard", test: (s: PlayerStats) => s.fastestSolve !== null && s.fastestSolve <= 15 },
  { id: "mega-mind", name: "Mega Mind", description: "Play Octo-Word Guess or Sedecordle. Absolutely massive brain energy.", difficulty: "hard", test: (s: PlayerStats) => (s.gameCounts["octo-word-guess"] ?? 0) > 0 || (s.gameCounts["sedecordle"] ?? 0) > 0 },
  { id: "no-life", name: "No Life", description: "Play 100 games total. Bro forgot what sunlight looks like.", difficulty: "hard", test: (s: PlayerStats) => s.played >= 100 }
];

export function loadStats(): PlayerStats {
  if (typeof localStorage === "undefined") return defaultStats;
  const saved = localStorage.getItem("ewg:stats");
  if (!saved) return { ...defaultStats };
  const parsed = JSON.parse(saved);
  return {
    ...defaultStats,
    ...parsed,
    highScores: parsed.highScores ?? {},
    fastestSolves: parsed.fastestSolves ?? {}
  };
}

export function saveStats(stats: PlayerStats) {
  localStorage.setItem("ewg:stats", JSON.stringify(stats));
}

export function recordGame(gameSlug: string, won: boolean, seconds: number, score?: number) {
  const stats = loadStats();
  
  const oldXp = (stats.wins * 50) + (stats.played * 10);
  const oldLevel = Math.floor(oldXp / 500) + 1;
  const oldLongestStreak = stats.longestStreak;
  const oldFastestSolve = stats.fastestSolves[gameSlug];
  const oldHighScore = stats.highScores[gameSlug] ?? 0;

  stats.played += 1;
  stats.gameCounts[gameSlug] = (stats.gameCounts[gameSlug] ?? 0) + 1;
  stats.favoriteGame = Object.entries(stats.gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? gameSlug;
  
  let newRecordType: "none" | "time" | "score" = "none";

  if (score !== undefined) {
    const prevScore = stats.highScores[gameSlug] ?? 0;
    if (score > prevScore) {
      stats.highScores[gameSlug] = score;
      newRecordType = "score";
    }
  }

  if (won) {
    stats.wins += 1;
    stats.currentStreak += 1;
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.fastestSolve = stats.fastestSolve === null ? seconds : Math.min(stats.fastestSolve, seconds);
    stats.totalSolveSeconds += seconds;

    const prevFastest = stats.fastestSolves[gameSlug];
    if (prevFastest === undefined || seconds < prevFastest) {
      stats.fastestSolves[gameSlug] = seconds;
      if (score === undefined) {
        newRecordType = "time";
      }
    }
  } else {
    stats.losses += 1;
    stats.currentStreak = 0;
  }

  saveStats(stats);

  // Dynamic activity logging
  if (typeof localStorage !== "undefined") {
    try {
      const activities = JSON.parse(localStorage.getItem("ewg:activities") || "[]");
      const readableName = gameSlug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const timestamp = Date.now();
      const activityId = () => Math.random().toString(36).substring(2, 11);

      // 1. Log the base game played / won activity
      activities.unshift({
        id: activityId(),
        type: won ? "win" : "play",
        gameSlug,
        gameName: readableName,
        text: won 
          ? `Won ${readableName}${score !== undefined ? ` with ${score} pts` : ` in ${seconds}s`}` 
          : `Played ${readableName}`,
        timestamp
      });

      // 2. Check for personal record milestones
      if (won && newRecordType === "time") {
        activities.unshift({
          id: activityId(),
          type: "record",
          gameSlug,
          gameName: readableName,
          text: `🏆 New Personal Best: ${seconds}s in ${readableName}`,
          timestamp: timestamp + 1
        });
      } else if (newRecordType === "score") {
        activities.unshift({
          id: activityId(),
          type: "record",
          gameSlug,
          gameName: readableName,
          text: `🏆 New Personal Best: ${score} pts in ${readableName}`,
          timestamp: timestamp + 1
        });
      }

      // 3. Check for streak milestones
      if (won && stats.currentStreak > oldLongestStreak) {
        activities.unshift({
          id: activityId(),
          type: "streak",
          gameSlug,
          gameName: readableName,
          text: `🔥 Reached new personal best streak of ${stats.currentStreak} games!`,
          timestamp: timestamp + 2
        });
      } else if (won && stats.currentStreak > 0 && stats.currentStreak % 5 === 0) {
        activities.unshift({
          id: activityId(),
          type: "streak",
          gameSlug,
          gameName: readableName,
          text: `🔥 Reached a ${stats.currentStreak} game win streak!`,
          timestamp: timestamp + 2
        });
      }

      // 4. Check for Level Up milestone
      const newXp = (stats.wins * 50) + (stats.played * 10);
      const newLevel = Math.floor(newXp / 500) + 1;
      if (newLevel > oldLevel) {
        activities.unshift({
          id: activityId(),
          type: "levelup",
          gameSlug,
          gameName: readableName,
          text: `⭐ Leveled Up to Level ${newLevel}!`,
          timestamp: timestamp + 3
        });
      }

      localStorage.setItem("ewg:activities", JSON.stringify(activities.slice(0, 30)));
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  }

  return stats;
}
