import type { LanguageItem } from "../lib/languagePool";

function getCountryFlagUrl(country: string): string {
  const map: Record<string, string> = {
    "Japan": "jp",
    "France": "fr",
    "Germany": "de",
    "Spain": "es",
    "Italy": "it",
    "Portugal": "pt",
    "Brazil": "br",
    "Russia": "ru",
    "China": "cn",
    "United Kingdom": "gb",
    "USA": "us",
    "Saudi Arabia": "sa",
    "Egypt": "eg",
    "India": "in",
    "South Korea": "kr",
    "Turkey": "tr",
    "Netherlands": "nl",
    "Sweden": "se",
    "Poland": "pl",
    "Greece": "gr",
    "Vietnam": "vn",
    "Thailand": "th",
    "Indonesia": "id",
    "Finland": "fi",
    "Hungary": "hu",
    "Czechia": "cz",
    "Romania": "ro",
    "Ukraine": "ua",
    "Kenya": "ke",
    "Tanzania": "tz",
    "Philippines": "ph",
    "Israel": "il",
    "Denmark": "dk",
    "Norway": "no",
    "Bangladesh": "bd",
    "Iran": "ir",
    "Bulgaria": "bg",
    "Iceland": "is",
  };
  const code = map[country] || "un";
  return `https://flagcdn.com/w80/${code}.png`;
}

export function renderResultModal(
  isWon: boolean,
  item: LanguageItem,
  pointsEarned: number,
  replays: number,
  mode: string,
  streak: number,
  endlessLives: number
): string {
  const flagUrl = getCountryFlagUrl(item.country);
  const statusEmoji = isWon ? "🎉" : "❌";
  const statusText = isWon ? "Correct!" : "Wrong Answer";
  const statusClass = isWon ? "won" : "lost";

  let shareText = `Guess the Language (${mode.toUpperCase()})\n`;
  shareText += isWon ? `🟩 Solved in 1 try (${pointsEarned} pts)\n` : `🟥 Missed (${item.language})\n`;
  if (streak > 1) shareText += `🔥 Streak: ${streak}\n`;
  shareText += `Play free on EveryWordGames.com`;

  return `
    <div class="lang-modal-overlay show" id="lang-result-modal">
      <div class="lang-modal-card ${statusClass}">
        <div class="lang-result-header">
          <span class="lang-status-emoji">${statusEmoji}</span>
          <h2 class="lang-status-title">${statusText}</h2>
          ${pointsEarned > 0 ? `<span class="lang-points-badge">+${pointsEarned} pts</span>` : ""}
        </div>

        <div class="lang-result-body">
          <div class="lang-target-showcase">
            <img src="${flagUrl}" alt="${item.country} flag" class="lang-country-flag" onerror="this.style.display='none'" />
            <div class="lang-target-info">
              <h3 class="lang-target-name">${item.language}</h3>
              <p class="lang-target-meta">
                <span class="lang-badge country">📍 ${item.country}</span>
                <span class="lang-badge family">🌳 ${item.family} Family</span>
              </p>
            </div>
          </div>

          <div class="lang-fact-box">
            <span class="fact-icon">💡</span>
            <p class="fact-text"><strong>Did you know?</strong> ${item.fact}</p>
          </div>

          ${mode === "endless" ? `
            <div class="endless-status-row">
              <span>❤️ Lives Remaining: <strong>${endlessLives}</strong></span>
              <span>🔥 Current Streak: <strong>${streak}</strong></span>
            </div>
          ` : ""}
        </div>

        <div class="lang-result-actions">
          ${mode === "daily" ? `
            <button class="button lang-action-btn share" id="lang-share-btn" data-share="${encodeURIComponent(shareText)}">
              📋 Share Daily Result
            </button>
          ` : mode === "endless" && endlessLives <= 0 ? `
            <button class="button lang-action-btn primary" id="lang-next-btn">
              🔄 Play Again
            </button>
          ` : `
            <button class="button lang-action-btn primary" id="lang-next-btn">
              ▶️ Play Next
            </button>
          `}
          <button class="button button-outline lang-action-btn close" id="lang-close-modal">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}

export function bindResultModal(
  container: HTMLElement,
  onNextClick: () => void,
  onCloseClick: () => void,
  onShareSuccess: () => void
) {
  const nextBtn = container.querySelector<HTMLButtonElement>("#lang-next-btn");
  nextBtn?.addEventListener("click", () => onNextClick());

  const closeBtn = container.querySelector<HTMLButtonElement>("#lang-close-modal");
  closeBtn?.addEventListener("click", () => onCloseClick());

  const shareBtn = container.querySelector<HTMLButtonElement>("#lang-share-btn");
  shareBtn?.addEventListener("click", async () => {
    const raw = shareBtn.getAttribute("data-share");
    if (raw) {
      const text = decodeURIComponent(raw);
      try {
        await navigator.clipboard.writeText(text);
        shareBtn.textContent = "✅ Copied to Clipboard!";
        onShareSuccess();
        setTimeout(() => {
          shareBtn.textContent = "📋 Share Daily Result";
        }, 3000);
      } catch {
        alert(text);
      }
    }
  });
}
