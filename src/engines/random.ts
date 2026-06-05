export function hashSeed(seed: string) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: string) {
  let value = hashSeed(seed) || 1;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return ((value >>> 0) % 1000000) / 1000000;
  };
}

export function pickSeeded<T>(items: T[], seed: string): T {
  const rng = createRng(seed);
  return items[Math.floor(rng() * items.length)] ?? items[0];
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function shuffleSeeded<T>(items: T[], seed: string): T[] {
  const rng = createRng(seed);
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(rng() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}
