import createGlobe from "cobe";

export interface GlobeController {
  destroy: () => void;
  focusOn: (lat: number, lng: number) => void;
  resetFocus: () => void;
}

export interface GuessLocation {
  name: string;
  lat: number;
  lng: number;
}

export async function initCountryGlobe(
  container: HTMLElement,
  answerLat: number,
  answerLng: number,
  answerCode: string,
  answerName: string,
  guesses: GuessLocation[] = [],
): Promise<GlobeController> {
  // Clean container
  container.innerHTML = "";

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "width: 100%; height: 100%; display: block; cursor: grab; touch-action: none;";
  container.appendChild(canvas);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = (container.clientWidth || 400) * dpr;
  const height = (container.clientHeight || 340) * dpr;

  let currentPhi = (answerLng * Math.PI) / 180;
  let currentTheta = (answerLat * Math.PI) / 180;
  let targetPhi = currentPhi;
  let targetTheta = currentTheta;
  let isHovering = false;

  let pointerInteracting = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerStartPhi = 0;
  let pointerStartTheta = 0;

  const onPointerDown = (e: PointerEvent) => {
    pointerInteracting = true;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    pointerStartPhi = currentPhi;
    pointerStartTheta = currentTheta;
    canvas.style.cursor = "grabbing";
  };

  const onPointerUp = () => {
    if (pointerInteracting) {
      pointerInteracting = false;
      canvas.style.cursor = "grab";
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (pointerInteracting) {
      const dx = e.clientX - pointerStartX;
      const dy = e.clientY - pointerStartY;
      currentPhi = pointerStartPhi + dx * 0.006;
      currentTheta = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, pointerStartTheta + dy * 0.006),
      );
      targetPhi = currentPhi;
      targetTheta = currentTheta;
    }
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointermove", onPointerMove);

  // Prepare markers: answer gets a larger marker, guesses get smaller markers
  const markers: { location: [number, number]; size: number }[] = [
    { location: [answerLat, answerLng], size: 0.12 },
    ...guesses.map((g) => ({
      location: [g.lat, g.lng] as [number, number],
      size: 0.06,
    })),
  ];

  const globe = createGlobe(canvas, {
    devicePixelRatio: dpr,
    width,
    height,
    phi: currentPhi,
    theta: currentTheta,
    dark: 1,
    diffuse: 1.2,
    mapSamples: 16000,
    mapBrightness: 6,
    baseColor: [0.08, 0.08, 0.18], // Cyberpunk dark navy/indigo
    markerColor: [0.1, 0.95, 0.65], // Glowing cyan/green beacon
    glowColor: [0.05, 0.05, 0.15],
    markers,
    onRender: (state) => {
      if (!pointerInteracting) {
        // Smooth lerp towards target
        const phiDiff = targetPhi - currentPhi;
        const thetaDiff = targetTheta - currentTheta;
        currentPhi += phiDiff * 0.08;
        currentTheta += thetaDiff * 0.08;

        // If close to target and not actively hovering on a specific guess, slowly spin
        if (
          !isHovering &&
          Math.abs(phiDiff) < 0.01 &&
          Math.abs(thetaDiff) < 0.01
        ) {
          targetPhi += 0.002;
        }
      }
      state.phi = currentPhi;
      state.theta = currentTheta;
      state.width = (container.clientWidth || 400) * dpr;
      state.height = (container.clientHeight || 340) * dpr;
    },
  });

  return {
    destroy: () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      globe.destroy();
    },
    focusOn: (lat: number, lng: number) => {
      isHovering = true;
      targetPhi = (lng * Math.PI) / 180;
      targetTheta = (lat * Math.PI) / 180;
    },
    resetFocus: () => {
      isHovering = false;
      targetPhi = (answerLng * Math.PI) / 180;
      targetTheta = (answerLat * Math.PI) / 180;
    },
  };
}
