import { pickSeeded, todayKey } from "./random";

export interface EntityHint {
  label: string;
  value: string;
}

export interface EntityItem {
  id: string | number;
  name: string;
  aliases?: string[];
  image: string;       // Original artwork/image
  silhouette?: string; // Obfuscated/silhouette image
  hints: EntityHint[]; // Progressively unlocked hints
  categoryFilter?: string;
  metadata?: Record<string, any>;
}

export function normalizeEntityAnswer(val: string): string {
  return val
    .toLowerCase()
    .replace(/♀/g, "f")
    .replace(/♂/g, "m")
    .replace(/[^a-z0-9]/g, "");
}

export function evaluateEntityGuess(guess: string, entity: EntityItem): boolean {
  const normGuess = normalizeEntityAnswer(guess);
  if (!normGuess) return false;
  if (normalizeEntityAnswer(entity.name) === normGuess) return true;
  if (entity.aliases && entity.aliases.some((a) => normalizeEntityAnswer(a) === normGuess)) {
    return true;
  }
  return false;
}

export interface HintStatus {
  hint: EntityHint;
  isUnlocked: boolean;
  isNew: boolean;
}

export function getUnlockedHints(entity: EntityItem, attempts: string[]): HintStatus[] {
  return entity.hints.map((hint, index) => {
    const isUnlocked = index <= attempts.length;
    const isNew = index === attempts.length && attempts.length > 0;
    return {
      hint,
      isUnlocked,
      isNew,
    };
  });
}

export function isEntityGameWon(entity: EntityItem, attempts: string[]): boolean {
  return attempts.some((attempt) => evaluateEntityGuess(attempt, entity));
}

export function isEntityGameDone(
  entity: EntityItem,
  attempts: string[],
  maxAttempts: number = 6
): boolean {
  return isEntityGameWon(entity, attempts) || attempts.length >= maxAttempts;
}
