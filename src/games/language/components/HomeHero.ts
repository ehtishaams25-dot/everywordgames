export function renderHomeHero(
  currentMode: "classic" | "daily" | "endless" | "speed",
  currentDiff: "Easy" | "Medium" | "Hard" | "Expert"
): string {
  const modes = [
    { id: "classic", label: "🎮 Classic", desc: "One clip at a time" },
    { id: "daily", label: "📅 Daily Challenge", desc: "Same for everyone today" },
    { id: "endless", label: "♾️ Endless", desc: "3 lives survival run" },
    { id: "speed", label: "⚡ Speed Mode", desc: "60-second sprint" },
  ];

  const diffs = [
    { id: "Easy", label: "Easy", desc: "4 multiple choice" },
    { id: "Medium", label: "Medium", desc: "6 multiple choice" },
    { id: "Hard", label: "Hard", desc: "Type name (autocomplete)" },
    { id: "Expert", label: "Expert", desc: "No hints, grouped families" },
  ];

  return `
    <div class="lang-home-hero">
      <div class="hero-brand-header">
        <span class="hero-badge">🌍 GEOGRAPHY AUDIO PUZZLE</span>
        <h1 class="hero-title">Guess the Language</h1>
        <p class="hero-subtitle">Listen to short voice clips from around the globe and identify the spoken language. Test your ear against 35+ languages!</p>
      </div>

      <!-- Mode Selector -->
      <div class="selector-section">
        <h3 class="selector-heading">Select Game Mode</h3>
        <div class="mode-grid">
          ${modes
            .map(
              (m) => `
            <button 
              class="button lang-mode-card ${currentMode === m.id ? "active" : ""}" 
              type="button" 
              data-mode="${m.id}"
            >
              <span class="mode-lbl">${m.label}</span>
              <span class="mode-desc">${m.desc}</span>
            </button>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Difficulty Selector -->
      <div class="selector-section">
        <h3 class="selector-heading">Select Difficulty</h3>
        <div class="diff-grid">
          ${diffs
            .map(
              (d) => `
            <button 
              class="button lang-diff-pill ${currentDiff === d.id ? "active" : ""}" 
              type="button" 
              data-diff="${d.id}"
            >
              <span class="diff-lbl">${d.label}</span>
              <span class="diff-desc">${d.desc}</span>
            </button>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="hero-actions">
        <button class="button hero-play-btn" id="hero-play-btn" type="button">
          ▶️ Start Game (${currentMode.toUpperCase()})
        </button>
        <div class="hero-secondary-actions">
          <button class="button button-outline hero-sec-btn" id="hero-stats-btn" type="button">
            📊 Stats
          </button>
          <button class="button button-outline hero-sec-btn" id="hero-settings-btn" type="button">
            ⚙️ Settings
          </button>
          ${currentMode === "speed" ? `
            <button class="button button-outline hero-sec-btn" id="hero-leaderboard-btn" type="button">
              🏆 Leaderboard
            </button>
          ` : ""}
        </div>
      </div>
    </div>
  `;
}

export function bindHomeHero(
  container: HTMLElement,
  onModeSelect: (mode: "classic" | "daily" | "endless" | "speed") => void,
  onDiffSelect: (diff: "Easy" | "Medium" | "Hard" | "Expert") => void,
  onStartPlay: () => void,
  onOpenStats: () => void,
  onOpenSettings: () => void,
  onOpenLeaderboard: () => void
) {
  const modeBtns = container.querySelectorAll<HTMLButtonElement>(".lang-mode-card");
  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = btn.getAttribute("data-mode") as any;
      if (m) onModeSelect(m);
    });
  });

  const diffBtns = container.querySelectorAll<HTMLButtonElement>(".lang-diff-pill");
  diffBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = btn.getAttribute("data-diff") as any;
      if (d) onDiffSelect(d);
    });
  });

  const playBtn = container.querySelector<HTMLButtonElement>("#hero-play-btn");
  playBtn?.addEventListener("click", () => onStartPlay());

  const statsBtn = container.querySelector<HTMLButtonElement>("#hero-stats-btn");
  statsBtn?.addEventListener("click", () => onOpenStats());

  const settingsBtn = container.querySelector<HTMLButtonElement>("#hero-settings-btn");
  settingsBtn?.addEventListener("click", () => onOpenSettings());

  const leaderboardBtn = container.querySelector<HTMLButtonElement>("#hero-leaderboard-btn");
  leaderboardBtn?.addEventListener("click", () => onOpenLeaderboard());
}
