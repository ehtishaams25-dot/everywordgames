import type { LanguageStats } from "../lib/statsStore";

export function renderStatsModal(stats: LanguageStats): string {
  return `
    <div class="lang-modal-overlay show" id="lang-stats-modal">
      <div class="lang-modal-card stats-card">
        <div class="lang-result-header">
          <span class="lang-status-emoji">📊</span>
          <h2 class="lang-status-title">Your Statistics</h2>
        </div>
        <div class="lang-stats-grid">
          <div class="stat-box">
            <span class="stat-num">${stats.gamesPlayed}</span>
            <span class="stat-lbl">Played</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">${stats.winPercentage}%</span>
            <span class="stat-lbl">Win Rate</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">${stats.currentStreak}</span>
            <span class="stat-lbl">Current Streak</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">${stats.bestStreak}</span>
            <span class="stat-lbl">Max Streak</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">${stats.totalPoints}</span>
            <span class="stat-lbl">Total Score</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">${stats.averageTimeSeconds}s</span>
            <span class="stat-lbl">Avg Response</span>
          </div>
        </div>
        <div class="lang-fav-diff">
          <span>🌟 Favorite Difficulty: <strong>${stats.favoriteDifficulty}</strong></span>
        </div>
        <div class="lang-result-actions">
          <button class="button button-outline lang-action-btn close" id="lang-close-stats">Close</button>
        </div>
      </div>
    </div>
  `;
}

export function renderSettingsModal(volume: number, isMuted: boolean): string {
  return `
    <div class="lang-modal-overlay show" id="lang-settings-modal">
      <div class="lang-modal-card settings-card">
        <div class="lang-result-header">
          <span class="lang-status-emoji">⚙️</span>
          <h2 class="lang-status-title">Game Settings</h2>
        </div>
        <div class="lang-settings-list">
          <div class="setting-row">
            <label for="settings-vol-slider">Audio Volume</label>
            <div class="slider-group">
              <span>${Math.round(volume * 100)}%</span>
              <input type="range" id="settings-vol-slider" min="0" max="100" value="${Math.round(volume * 100)}" />
            </div>
          </div>
          <div class="setting-row">
            <label>Mute All Sound</label>
            <button class="button button-outline small-btn ${isMuted ? "active" : ""}" id="settings-mute-toggle">
              ${isMuted ? "🔇 Muted" : "🔊 Unmuted"}
            </button>
          </div>
          <div class="setting-row">
            <label>Reset Player Statistics</label>
            <button class="button button-outline danger-btn small-btn" id="settings-reset-stats">Reset Data</button>
          </div>
        </div>
        <div class="lang-result-actions">
          <button class="button button-outline lang-action-btn close" id="lang-close-settings">Done</button>
        </div>
      </div>
    </div>
  `;
}

export function renderLeaderboardModal(recentSpeedScore?: number): string {
  const defaultBoard = [
    { rank: 1, name: "Polyglot Master 🌍", score: 18, time: "60s" },
    { rank: 2, name: "Linguist Pro 🗣️", score: 15, time: "60s" },
    { rank: 3, name: "Word Wizard ✨", score: 12, time: "60s" },
    { rank: 4, name: "Audio Scout 🎧", score: 9, time: "60s" },
    { rank: 5, name: "Language Novice 🌱", score: 6, time: "60s" },
  ];

  if (recentSpeedScore !== undefined && recentSpeedScore > 0) {
    defaultBoard.push({ rank: 6, name: "You (Recent Run) ⭐", score: recentSpeedScore, time: "60s" });
    defaultBoard.sort((a, b) => b.score - a.score);
    defaultBoard.forEach((item, idx) => item.rank = idx + 1);
  }

  const rowsHtml = defaultBoard
    .slice(0, 6)
    .map((item) => `
      <tr class="${item.name.includes("You") ? "highlight-row" : ""}">
        <td>#${item.rank}</td>
        <td>${item.name}</td>
        <td><strong>${item.score} langs</strong></td>
        <td>${item.time}</td>
      </tr>
    `)
    .join("");

  return `
    <div class="lang-modal-overlay show" id="lang-leaderboard-modal">
      <div class="lang-modal-card leaderboard-card">
        <div class="lang-result-header">
          <span class="lang-status-emoji">🏆</span>
          <h2 class="lang-status-title">Speed Mode Leaderboard</h2>
          <p class="lang-subtext">Most languages identified in 60 seconds</p>
        </div>
        <table class="lang-leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Mode</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="lang-result-actions">
          <button class="button button-outline lang-action-btn close" id="lang-close-leaderboard">Close</button>
        </div>
      </div>
    </div>
  `;
}

export function bindStatsModal(container: HTMLElement, onClose: () => void) {
  const closeBtn = container.querySelector<HTMLButtonElement>("#lang-close-stats");
  closeBtn?.addEventListener("click", () => onClose());
}

export function bindSettingsModal(
  container: HTMLElement,
  onVolumeChange: (vol: number) => void,
  onMuteToggle: () => void,
  onResetStats: () => void,
  onClose: () => void
) {
  const closeBtn = container.querySelector<HTMLButtonElement>("#lang-close-settings");
  closeBtn?.addEventListener("click", () => onClose());

  const volSlider = container.querySelector<HTMLInputElement>("#settings-vol-slider");
  volSlider?.addEventListener("input", (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    onVolumeChange(val / 100);
    const span = volSlider.previousElementSibling;
    if (span) span.textContent = `${val}%`;
  });

  const muteBtn = container.querySelector<HTMLButtonElement>("#settings-mute-toggle");
  muteBtn?.addEventListener("click", () => onMuteToggle());

  const resetBtn = container.querySelector<HTMLButtonElement>("#settings-reset-stats");
  resetBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all your statistics?")) {
      onResetStats();
      onClose();
    }
  });
}

export function bindLeaderboardModal(container: HTMLElement, onClose: () => void) {
  const closeBtn = container.querySelector<HTMLButtonElement>("#lang-close-leaderboard");
  closeBtn?.addEventListener("click", () => onClose());
}
