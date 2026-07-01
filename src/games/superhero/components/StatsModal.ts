import type { EntityGameStats } from "../lib/stats";

export function renderStatsModal(stats: EntityGameStats, gameName: string = "Guess the Superhero"): string {
  const maxDist = Math.max(...Object.values(stats.guessDistribution), 1);

  const distributionBars = [1, 2, 3, 4, 5, 6]
    .map((num) => {
      const count = stats.guessDistribution[num] || 0;
      const widthPct = Math.max(8, Math.round((count / maxDist) * 100));
      return `
        <div class="dist-row">
          <span class="dist-label">${num}</span>
          <div class="dist-bar-wrapper">
            <div class="dist-bar ${count > 0 ? "has-val" : ""}" style="width: ${widthPct}%;">
              <span class="dist-count">${count}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="entity-modal-overlay" id="entity-stats-modal">
      <div class="entity-modal-card stats-modal-card">
        <button class="entity-modal-close" id="stats-close-btn" aria-label="Close modal">&times;</button>
        
        <div class="modal-header">
          <h3 class="modal-entity-name">📊 ${gameName} Statistics</h3>
        </div>

        <div class="stats-grid-top">
          <div class="stat-box">
            <span class="stat-number">${stats.gamesPlayed}</span>
            <span class="stat-label">Played</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">${stats.winPercentage}%</span>
            <span class="stat-label">Win %</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">${stats.currentStreak}</span>
            <span class="stat-label">Current Streak</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">${stats.bestStreak}</span>
            <span class="stat-label">Best Streak</span>
          </div>
          <div class="stat-box" style="grid-column: span 2;">
            <span class="stat-number">${stats.averageGuesses}</span>
            <span class="stat-label">Avg Guesses</span>
          </div>
        </div>

        <div class="stats-distribution-section">
          <h4 class="dist-title">Guess Distribution</h4>
          <div class="dist-chart">
            ${distributionBars}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindStatsModal(root: HTMLElement) {
  const modal = root.querySelector<HTMLDivElement>("#entity-stats-modal");
  if (!modal) return;

  const closeBtn = root.querySelector<HTMLButtonElement>("#stats-close-btn");
  const closeModal = () => {
    modal.classList.remove("active");
  };

  closeBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

export function openStatsModal(root: HTMLElement) {
  const modal = root.querySelector<HTMLDivElement>("#entity-stats-modal");
  if (modal) modal.classList.add("active");
}
