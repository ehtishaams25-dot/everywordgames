import type { EntityItem } from "@/engines/entityGuessingEngine";
import { normalizeEntityAnswer } from "@/engines/entityGuessingEngine";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderGuessHistory(
  attempts: string[],
  maxAttempts: number = 6,
  targetAnswer: string = ""
): string {
  const historyHtml = Array.from({ length: maxAttempts }, (_, i) => {
    const attempt = attempts[i];
    if (!attempt) {
      return `
        <div class="entity-guess-row empty">
          <span class="guess-index">${i + 1}</span>
          <span class="guess-name empty-dashes">---</span>
        </div>
      `;
    }
    const isCorrect = normalizeEntityAnswer(attempt) === normalizeEntityAnswer(targetAnswer);
    return `
      <div class="entity-guess-row ${isCorrect ? "correct" : "incorrect"}">
        <span class="guess-index">${i + 1}</span>
        <span class="guess-name">${escapeHtml(attempt)}</span>
      </div>
    `;
  }).join("");

  return `
    <aside class="entity-history-panel">
      <div class="hint-panel-header">
        <span class="hint-panel-title">Attempts</span>
        <span class="hint-panel-subtitle">${attempts.length} / ${maxAttempts}</span>
      </div>
      <div class="entity-guesses-list">
        ${historyHtml}
      </div>
    </aside>
  `;
}

export function renderGuessForm(
  attempts: string[],
  maxAttempts: number = 6,
  isDone: boolean = false,
  placeholder: string = "Type Superhero name..."
): string {
  const remaining = maxAttempts - attempts.length;
  if (isDone) return "";

  return `
    <form id="entity-guess-form" class="entity-guess-form" autocomplete="off" onsubmit="return false;">
      <div class="entity-input-wrapper">
        <input
          type="text"
          id="entity-guess-input"
          class="entity-answer-input"
          placeholder="${escapeHtml(placeholder)}"
          maxlength="50"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          aria-label="${escapeHtml(placeholder)}"
        />
        <div id="entity-suggestions-dropdown" class="entity-suggestions-dropdown" style="display: none;"></div>
      </div>
      <button type="submit" class="button entity-submit-btn">
        Guess (${remaining})
      </button>
    </form>
  `;
}

export function bindGuessInput(
  root: HTMLElement,
  pool: EntityItem[],
  onSubmit: (guess: string) => void
) {
  const form = root.querySelector<HTMLFormElement>("#entity-guess-form");
  const input = root.querySelector<HTMLInputElement>("#entity-guess-input");
  const dropdown = root.querySelector<HTMLDivElement>("#entity-suggestions-dropdown");

  if (!form || !input || !dropdown) return;

  let activeIndex = -1;
  let currentMatches: EntityItem[] = [];

  const closeDropdown = () => {
    dropdown.style.display = "none";
    dropdown.innerHTML = "";
    activeIndex = -1;
    currentMatches = [];
  };

  const renderSuggestions = (matches: EntityItem[]) => {
    currentMatches = matches;
    activeIndex = -1;
    if (matches.length === 0) {
      closeDropdown();
      return;
    }

    dropdown.innerHTML = matches
      .map((m, idx) => `
        <div class="entity-suggestion-item" data-index="${idx}" data-name="${escapeHtml(m.name)}" role="option">
          <span class="suggestion-name">${escapeHtml(m.name)}</span>
        </div>
      `)
      .join("");

    dropdown.style.display = "block";

    const items = dropdown.querySelectorAll<HTMLDivElement>(".entity-suggestion-item");
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const name = item.getAttribute("data-name");
        if (name) {
          input.value = name;
          closeDropdown();
          form.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      });
      item.addEventListener("mouseenter", () => {
        items.forEach((it) => it.classList.remove("active"));
        item.classList.add("active");
      });
    });
  };

  input.addEventListener("input", () => {
    const val = input.value.trim().toLowerCase();
    if (val.length < 1) {
      closeDropdown();
      return;
    }

    const normVal = normalizeEntityAnswer(val);
    const matches = pool
      .filter((item) => {
        if (item.name.toLowerCase().includes(val)) return true;
        if (normalizeEntityAnswer(item.name).includes(normVal)) return true;
        if (item.aliases && item.aliases.some((a) => a.toLowerCase().includes(val) || normalizeEntityAnswer(a).includes(normVal))) return true;
        return false;
      })
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(val);
        const bStarts = b.name.toLowerCase().startsWith(val);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);

    if (matches.length === 1 && normalizeEntityAnswer(matches[0].name) === normVal) {
      closeDropdown();
    } else {
      renderSuggestions(matches);
    }
  });

  input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (dropdown.style.display === "none" || currentMatches.length === 0) return;

    const items = dropdown.querySelectorAll<HTMLDivElement>(".entity-suggestion-item");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % currentMatches.length;
      updateActiveItem(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + currentMatches.length) % currentMatches.length;
      updateActiveItem(items);
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < currentMatches.length) {
      e.preventDefault();
      input.value = currentMatches[activeIndex].name;
      closeDropdown();
      form.dispatchEvent(new Event("submit", { cancelable: true }));
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown();
    }
  });

  function updateActiveItem(items: NodeListOf<HTMLDivElement>) {
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add("active");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("active");
      }
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    closeDropdown();
    const val = input.value.trim();
    if (!val) return;
    input.value = "";
    onSubmit(val);
  });

  const onClickOutside = (e: MouseEvent) => {
    if (!input.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
      closeDropdown();
    }
  };

  if ((root as any)._inputCleanup) {
    document.removeEventListener("click", (root as any)._inputCleanup);
  }
  (root as any)._inputCleanup = onClickOutside;
  document.addEventListener("click", onClickOutside);

  setTimeout(() => {
    input.focus({ preventScroll: true });
  }, 50);
}
