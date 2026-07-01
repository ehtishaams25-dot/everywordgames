export function renderPokemonImage(
  silhouetteUrl: string,
  artworkUrl: string,
  name: string,
  isRevealed: boolean,
  isWon: boolean = false
): string {
  const imgSrc = isRevealed ? artworkUrl : silhouetteUrl;
  const animClass = !isRevealed ? "silhouette-active" : isWon ? "artwork-revealed celebrate" : "artwork-revealed";

  return `
    <div class="pokemon-image-card">
      <div class="pokemon-glow-bg ${isRevealed && isWon ? "won" : ""}"></div>
      <div class="pokemon-img-wrapper ${animClass}">
        <img
          src="${imgSrc}"
          alt="${isRevealed ? name : "Mystery Pokémon Silhouette"}"
          class="pokemon-img"
          draggable="false"
          loading="${isRevealed ? "lazy" : "eager"}"
        />
      </div>
      ${!isRevealed ? "" : `<span class="pokemon-name-badge ${isWon ? "won" : ""}">${name}</span>`}
    </div>
  `;
}
