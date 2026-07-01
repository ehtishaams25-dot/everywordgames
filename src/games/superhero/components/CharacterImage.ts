export function renderCharacterImage(
  artworkUrl: string,
  name: string,
  attemptCount: number = 0,
  maxAttempts: number = 6,
  isRevealed: boolean = false,
  isWon: boolean = false
): string {
  // Define progressive blur/prism stages based on attempt count (0 to 5+)
  const blurStages = [
    { blur: 24, contrast: 165, saturate: 145, brightness: 90, scale: 1.12, label: "Stage 1: Chroma Aura" },
    { blur: 18, contrast: 150, saturate: 135, brightness: 95, scale: 1.09, label: "Stage 2: Color Palette" },
    { blur: 12, contrast: 135, saturate: 125, brightness: 98, scale: 1.07, label: "Stage 3: Form Emerging" },
    { blur: 7, contrast: 120, saturate: 115, brightness: 100, scale: 1.05, label: "Stage 4: Silhouette Focus" },
    { blur: 3.5, contrast: 108, saturate: 108, brightness: 100, scale: 1.03, label: "Stage 5: Detail Check" },
    { blur: 1.5, contrast: 102, saturate: 102, brightness: 100, scale: 1.01, label: "Stage 6: Final Clue" },
  ];

  const stageIndex = Math.min(attemptCount, blurStages.length - 1);
  const currentStage = blurStages[stageIndex];

  const filterStyle = isRevealed
    ? "filter: blur(0px) contrast(100%) saturate(100%) brightness(100%); transform: scale(1);"
    : `filter: blur(${currentStage.blur}px) contrast(${currentStage.contrast}%) saturate(${currentStage.saturate}%) brightness(${currentStage.brightness}%); transform: scale(${currentStage.scale});`;

  const stageBadge = isRevealed
    ? ""
    : `<div class="mystery-stage-badge">
         <span class="stage-dot pulse"></span>
         <span class="stage-text">🔮 ${currentStage.label} (${attemptCount + 1}/${maxAttempts})</span>
       </div>`;

  const animClass = !isRevealed ? "mystery-active" : isWon ? "artwork-revealed celebrate" : "artwork-revealed";

  return `
    <div class="entity-image-card pokemon-image-card superhero-mystery-card">
      <div class="entity-glow-bg pokemon-glow-bg ${isRevealed && isWon ? "won" : ""}"></div>
      <div class="entity-img-wrapper pokemon-img-wrapper ${animClass}" style="overflow: hidden; border-radius: 14px; position: relative; width: 88%; height: 88%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(30,38,52,0.85) 0%, rgba(12,15,22,0.95) 100%); border: 1px solid rgba(255,255,255,0.08); box-shadow: inset 0 0 20px rgba(0,0,0,0.6);">
        ${stageBadge}
        <img
          src="${artworkUrl}"
          alt="${isRevealed ? name : "Mystery Superhero Artwork"}"
          class="entity-img pokemon-img mystery-reveal-img"
          style="width: 100%; height: 100%; object-fit: contain; ${filterStyle}"
          draggable="false"
          loading="${isRevealed ? "lazy" : "eager"}"
        />
      </div>
      ${!isRevealed ? "" : `<span class="entity-name-badge pokemon-name-badge ${isWon ? "won" : ""}">${name}</span>`}
    </div>
  `;
}

