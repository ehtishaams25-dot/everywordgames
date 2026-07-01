import type { LanguageItem } from "../lib/languagePool";
import { normalizeLanguageName } from "../lib/languagePool";

export function renderAnswerPanel(
  difficulty: "Easy" | "Medium" | "Hard" | "Expert",
  options: LanguageItem[],
  isDone: boolean,
  selectedGuess?: string,
  correctLanguage?: string
): string {
  if (difficulty === "Hard") {
    return `
      <div class="lang-answer-panel hard-mode">
        <form class="lang-input-form" id="lang-input-form" autocomplete="off">
          <div class="lang-input-wrapper">
            <input 
              type="text" 
              class="lang-text-input" 
              id="lang-text-input" 
              placeholder="Type language name (e.g. Portuguese)..." 
              ${isDone ? "disabled" : ""}
              autofocus
            />
            <div class="lang-autocomplete-dropdown" id="lang-autocomplete-dropdown"></div>
          </div>
          <button class="button lang-submit-btn" type="submit" ${isDone ? "disabled" : ""}>
            Submit
          </button>
        </form>
        <p class="lang-input-hint">💡 Accents and capitalization are ignored. Type and press Enter.</p>
      </div>
    `;
  }

  // Multiple choice for Easy (4), Medium (6), Expert (8 with similar families)
  const gridClass = options.length <= 4 ? "cols-2" : options.length <= 6 ? "cols-3" : "cols-4";
  const buttonsHtml = options
    .map((item, index) => {
      let stateClass = "";
      if (isDone) {
        if (item.language === correctLanguage) {
          stateClass = "correct";
        } else if (item.language === selectedGuess) {
          stateClass = "wrong";
        }
      } else if (item.language === selectedGuess) {
        stateClass = "selected";
      }

      return `
        <button 
          class="button lang-mcq-btn ${stateClass}" 
          type="button" 
          data-lang="${item.language}" 
          ${isDone ? "disabled" : ""}
        >
          <span class="mcq-num">${index + 1}.</span>
          <span class="mcq-label">${item.language}</span>
        </button>
      `;
    })
    .join("");

  return `
    <div class="lang-answer-panel mcq-mode">
      <div class="lang-mcq-grid ${gridClass}">
        ${buttonsHtml}
      </div>
      <p class="lang-input-hint">💡 Use number keys 1-${options.length} or click to guess.</p>
    </div>
  `;
}

export function bindAnswerPanel(
  container: HTMLElement,
  difficulty: "Easy" | "Medium" | "Hard" | "Expert",
  allLanguages: LanguageItem[],
  onGuessSubmit: (guess: string) => void
) {
  if (difficulty === "Hard") {
    const form = container.querySelector<HTMLFormElement>("#lang-input-form");
    const input = container.querySelector<HTMLInputElement>("#lang-text-input");
    const dropdown = container.querySelector<HTMLDivElement>("#lang-autocomplete-dropdown");

    if (input && dropdown && form) {
      input.addEventListener("input", () => {
        const query = normalizeLanguageName(input.value);
        if (!query || query.length < 1) {
          dropdown.style.display = "none";
          dropdown.innerHTML = "";
          return;
        }

        const matches = allLanguages.filter((l) => {
          const norm = normalizeLanguageName(l.language);
          return norm.includes(query) || l.language.toLowerCase().includes(query);
        }).slice(0, 6);

        if (matches.length === 0) {
          dropdown.style.display = "none";
          dropdown.innerHTML = "";
          return;
        }

        dropdown.innerHTML = matches
          .map((m) => `<div class="autocomplete-item" data-val="${m.language}">${m.language} <span class="autocomplete-meta">(${m.country})</span></div>`)
          .join("");
        dropdown.style.display = "block";

        dropdown.querySelectorAll(".autocomplete-item").forEach((el) => {
          el.addEventListener("click", () => {
            const val = el.getAttribute("data-val");
            if (val) {
              input.value = val;
              dropdown.style.display = "none";
              onGuessSubmit(val);
            }
          });
        });
      });

      // Hide dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (!container.contains(e.target as Node)) {
          dropdown.style.display = "none";
        }
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = input.value.trim();
        if (val) {
          dropdown.style.display = "none";
          onGuessSubmit(val);
        }
      });
    }
  } else {
    // MCQ buttons click handler
    const btns = container.querySelectorAll<HTMLButtonElement>(".lang-mcq-btn");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        if (lang) onGuessSubmit(lang);
      });
    });
  }
}
