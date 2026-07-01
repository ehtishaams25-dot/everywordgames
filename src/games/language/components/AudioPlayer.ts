export function renderAudioPlayer(
  isPlaying: boolean,
  isMuted: boolean,
  volume: number,
  waveformBars: number[],
  replays: number,
  isDone: boolean,
  mode: string
): string {
  const barsHtml = waveformBars
    .map((height, i) => {
      const activeClass = isPlaying ? "active" : "";
      return `<div class="waveform-bar ${activeClass}" style="height: ${height}%; animation-delay: ${i * 40}ms;"></div>`;
    })
    .join("");

  return `
    <div class="lang-audio-card">
      <!-- Waveform Animation Display -->
      <div class="waveform-container" aria-hidden="true">
        ${barsHtml}
      </div>

      <!-- Main Play Button -->
      <div class="play-btn-wrapper">
        <button 
          class="button lang-play-btn ${isPlaying ? "playing" : ""}" 
          id="lang-play-btn" 
          type="button"
          aria-label="${isPlaying ? "Pause audio" : "Play audio sample"}"
        >
          <span class="play-icon">${isPlaying ? "⏸️" : "▶️"}</span>
          <span class="play-label">${isPlaying ? "Listening..." : "Play Audio"}</span>
        </button>
      </div>

      <!-- Secondary Controls: Replay, Volume, Skip -->
      <div class="audio-secondary-controls">
        <button 
          class="button button-outline lang-ctrl-btn" 
          id="lang-replay-btn" 
          type="button" 
          ${isPlaying || isDone ? "disabled" : ""}
          title="Replay audio (-10 points)"
        >
          🔄 Replay ${replays > 0 ? `(${replays})` : ""} <span class="penalty-tag">-10pts</span>
        </button>

        <div class="lang-volume-ctrl" title="Volume control">
          <button class="lang-mute-btn" id="lang-mute-btn" type="button" aria-label="Toggle mute">
            ${isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
          </button>
          <input 
            type="range" 
            class="lang-volume-slider" 
            id="lang-volume-slider" 
            min="0" 
            max="100" 
            value="${Math.round(volume * 100)}" 
            aria-label="Volume" 
          />
        </div>

        ${!isDone && mode !== "daily" ? `
          <button 
            class="button button-outline lang-ctrl-btn skip-btn" 
            id="lang-skip-btn" 
            type="button"
            title="Skip this language (0 points)"
          >
            ⏭️ Skip <span class="penalty-tag">0pts</span>
          </button>
        ` : ""}
      </div>
    </div>
  `;
}

export function bindAudioPlayer(
  container: HTMLElement,
  onPlayClick: () => void,
  onReplayClick: () => void,
  onVolumeChange: (vol: number) => void,
  onMuteToggle: () => void,
  onSkipClick: () => void
) {
  const playBtn = container.querySelector<HTMLButtonElement>("#lang-play-btn");
  playBtn?.addEventListener("click", () => onPlayClick());

  const replayBtn = container.querySelector<HTMLButtonElement>("#lang-replay-btn");
  replayBtn?.addEventListener("click", () => onReplayClick());

  const muteBtn = container.querySelector<HTMLButtonElement>("#lang-mute-btn");
  muteBtn?.addEventListener("click", () => onMuteToggle());

  const volSlider = container.querySelector<HTMLInputElement>("#lang-volume-slider");
  volSlider?.addEventListener("input", (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    onVolumeChange(val / 100);
  });

  const skipBtn = container.querySelector<HTMLButtonElement>("#lang-skip-btn");
  skipBtn?.addEventListener("click", () => onSkipClick());
}
