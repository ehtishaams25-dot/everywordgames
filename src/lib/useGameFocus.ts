let activeGameFocusHandler: ((e: Event) => void) | null = null;
let currentInputSelector: string | null = null;
let currentRoot: HTMLElement | null = null;

export function useGameFocus(root: HTMLElement, inputSelector: string) {
  currentRoot = root;
  currentInputSelector = inputSelector;

  // 1. Focus immediately when a game loads or after rendering
  const focusInput = () => {
    const input = root.querySelector<HTMLInputElement>(inputSelector);
    if (input) {
      // A small timeout ensures the DOM has settled, which is especially helpful
      // for the mobile keyboard to remain active.
      setTimeout(() => input.focus(), 10);
    }
  };

  focusInput();

  // 3. Remove duplicate keyboard listeners
  if (activeGameFocusHandler) {
    document.removeEventListener("click", activeGameFocusHandler);
    document.removeEventListener("submit", activeGameFocusHandler);
  }

  activeGameFocusHandler = (e: Event) => {
    if (!currentRoot || !currentInputSelector) return;
    const input = currentRoot.querySelector<HTMLInputElement>(currentInputSelector);
    if (!input) return;

    if (e.type === "click") {
      const target = e.target as HTMLElement;
      // Do not steal focus if the user is interacting with another interactive element
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a")
      ) {
        return;
      }

      // If clicking anywhere else (outside or inside game area), restore focus
      input.focus();
    } else if (e.type === "submit") {
      // 2. Focus must never be lost after pressing Enter
      // The game usually calls render() which will re-run useGameFocus(), 
      // but as a fallback, we ensure focus is returned to the input after form submission.
      setTimeout(() => {
        const newInput = currentRoot?.querySelector<HTMLInputElement>(currentInputSelector!);
        if (newInput) newInput.focus();
      }, 10);
    }
  };

  document.addEventListener("click", activeGameFocusHandler);
  document.addEventListener("submit", activeGameFocusHandler);
}
