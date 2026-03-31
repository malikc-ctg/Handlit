// lib/xp.ts
// Pure XP calculation. No side effects.

import { Difficulty } from './types';

export const XP_BASE: Record<Difficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 35,
};

/**
 * Calculate XP earned for completing a task.
 * Formula: floor(base[difficulty] * min(1 + streak * 0.05, 2.0))
 * Multiplier caps at 2.0 (reached at streak 20).
 */
export function calculateXP(difficulty: Difficulty, currentStreak: number): number {
  const base = XP_BASE[difficulty];
  const multiplier = Math.min(1 + currentStreak * 0.05, 2.0);
  return Math.floor(base * multiplier);
}
