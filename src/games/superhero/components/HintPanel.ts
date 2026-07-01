import type { HintStatus } from "@/engines/entityGuessingEngine";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderHintPanel(hints: HintStatus[]): string {
  const unlockedCount = hints.filter((h) => h.isUnlocked).length;
  return `
    <aside class="entity-hint-panel">
      <div class="hint-panel-header">
        <span class="hint-panel-title">Progressive Hints</span>
        <span class="hint-panel-subtitle">${unlockedCount} / ${hints.length}</span>
      </div>
      <div class="entity-hint-list">
        ${hints
          .map((item, index) => {
            const { hint, isUnlocked, isNew } = item;
            if (isUnlocked) {
              return `
                <div class="entity-hint-card unlocked ${isNew ? "hint-new-anim" : ""}">
                  <span class="hint-label">${escapeHtml(hint.label)}</span>
                  <strong class="hint-value">${escapeHtml(hint.value)}</strong>
                </div>
              `;
            }
            return `
              <div class="entity-hint-card locked">
                <span class="hint-locked-text">🔒 Hint ${index + 1} • Unlocks on Attempt ${index}</span>
              </div>
            `;
          })
          .join("")}
      </div>
    </aside>
  `;
}
