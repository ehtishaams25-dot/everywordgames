import confetti from "canvas-confetti";

export function showLanguageToast(container: HTMLElement, message: string, type: "info" | "warning" | "success" = "info", duration: number = 2500) {
  let toastEl = container.querySelector<HTMLDivElement>(".lang-toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "lang-toast";
    container.appendChild(toastEl);
  }

  toastEl.textContent = message;
  toastEl.className = `lang-toast show ${type}`;

  setTimeout(() => {
    if (toastEl) toastEl.classList.remove("show");
  }, duration);
}

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#BEFF00", "#639E42", "#ffffff", "#FFA666"],
    });
  } catch (err) {
    console.warn("Confetti error:", err);
  }
}
