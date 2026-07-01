import type { EntityItem } from "@/engines/entityGuessingEngine";
import { formatShareCard } from "../lib/stats";
import confetti from "canvas-confetti";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderResultModal(
  won: boolean,
  entity: EntityItem,
  attempts: string[],
  maxAttempts: number = 6,
  gameName: string = "Guess the Pokémon"
): string {
  const types = entity.metadata?.types ? entity.metadata.types.join(" / ") : "Unknown Type";
  const gen = entity.metadata?.generation ? `Generation ${entity.metadata.generation}` : "";

  return `
    <div class="entity-modal-overlay active" id="entity-result-modal">
      <div class="entity-modal-card ${won ? "modal-won" : "modal-lost"}">
        <button class="entity-modal-close" id="result-close-btn" aria-label="Close modal">&times;</button>
        
        <div class="modal-header">
          <span class="modal-status-badge ${won ? "badge-won" : "badge-lost"}">
            ${won ? "🏆 YOU GOT IT!" : "😢 BETTER LUCK NEXT TIME!"}
          </span>
          <h3 class="modal-entity-name">${escapeHtml(entity.name)}</h3>
        </div>

        <div class="modal-artwork-container ${won ? "celebrate" : ""}">
          <div class="modal-glow-bg ${won ? "won" : ""}"></div>
          <img src="${entity.image}" alt="${escapeHtml(entity.name)}" class="modal-artwork-img" draggable="false" />
        </div>

        <div class="modal-entity-details">
          <div class="detail-pill"><span class="pill-label">Type:</span> <strong>${escapeHtml(types)}</strong></div>
          ${gen ? `<div class="detail-pill"><span class="pill-label">Origin:</span> <strong>${escapeHtml(gen)}</strong></div>` : ""}
        </div>

        <p class="modal-summary-text">
          ${won ? `You correctly identified <strong>${escapeHtml(entity.name)}</strong> in <strong>${attempts.length} of ${maxAttempts}</strong> attempts!` : `The mystery Pokémon was <strong>${escapeHtml(entity.name)}</strong>.`}
        </p>

        <div class="modal-action-buttons">
          <button class="button modal-play-btn" id="modal-play-again-btn">
            🔄 Play Again
          </button>
          <button class="button button-outline modal-share-btn" id="modal-share-btn">
            📤 Share Result
          </button>
        </div>
      </div>
    </div>
  `;
}

export function bindResultModal(
  root: HTMLElement,
  won: boolean,
  entity: EntityItem,
  attempts: string[],
  maxAttempts: number = 6,
  gameName: string = "Guess the Pokémon",
  onPlayAgain: () => void
) {
  const modal = root.querySelector<HTMLDivElement>("#entity-result-modal");
  if (!modal) return;

  if (won) {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore if canvas-confetti fails
    }
  }

  const closeBtn = root.querySelector<HTMLButtonElement>("#result-close-btn");
  const playAgainBtn = root.querySelector<HTMLButtonElement>("#modal-play-again-btn");
  const shareBtn = root.querySelector<HTMLButtonElement>("#modal-share-btn");

  const closeModal = () => {
    modal.classList.remove("active");
  };

  closeBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  playAgainBtn?.addEventListener("click", () => {
    closeModal();
    onPlayAgain();
  });

  shareBtn?.addEventListener("click", async () => {
    const shareText = formatShareCard(gameName, won, attempts, maxAttempts);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        if (shareBtn) {
          const originalText = shareBtn.innerHTML;
          shareBtn.innerHTML = "✅ Copied to Clipboard!";
          shareBtn.style.borderColor = "var(--green)";
          setTimeout(() => {
            if (shareBtn) {
              shareBtn.innerHTML = originalText;
              shareBtn.style.borderColor = "";
            }
          }, 2000);
        }
      } else {
        alert(shareText);
      }
    } catch {
      alert(shareText);
    }
  });
}
