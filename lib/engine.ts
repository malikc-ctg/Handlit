// lib/engine.ts
// Rules-based recommendation engine. Pure functions only — no side effects.
// Input: Task[], UserState context. Output: { task: Task; reason: string } | null

import { Task } from './types';

export type ReasonKey =
  | 'overdue'
  | 'time_fit'
  | 'difficulty_easy_warmup'
  | 'difficulty_hard_momentum'
  | 'difficulty_medium'
  | 'momentum'
  | 'default';

export const REASON_STRINGS: Record<ReasonKey, string> = {
  overdue: 'This one has been waiting too long.',
  time_fit: 'You have time for this right now.',
  difficulty_easy_warmup: 'A quick win to get you started.',
  difficulty_hard_momentum: 'Your streak is strong. Take on the hard one.',
  difficulty_medium: 'A solid task to keep moving.',
  momentum: 'You are on a roll. Keep going.',
  default: 'You have time for this right now.',
};

export interface EngineContext {
  currentStreak: number;
  availableMinutes?: number; // defaults to 30
  lastCompletionTime?: string | null; // ISO timestamp of last completion
  sessionStartTime?: number; // Date.now() of session start (for session_paused_flag reset check)
}

export interface Recommendation {
  task: Task;
  reason: string;
  reasonKey: ReasonKey;
  score: number;
}

const TODAY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function isOverdue(task: Task): boolean {
  // A task is "overdue" if it was created on a day before today
  const createdDate = task.created_at.slice(0, 10);
  return createdDate < TODAY();
}

function hasMomentum(lastCompletionTime: string | null | undefined): boolean {
  if (!lastCompletionTime) return false;
  const diff = Date.now() - new Date(lastCompletionTime).getTime();
  return diff <= 60 * 60 * 1000; // within last 60 minutes
}

interface ScoredTask {
  task: Task;
  score: number;
  topFactor: ReasonKey;
}

function scoreTask(
  task: Task,
  ctx: EngineContext
): ScoredTask {
  const available = ctx.availableMinutes ?? 30;
  const streak = ctx.currentStreak;

  let score = 0;
  const factors: { key: ReasonKey; value: number }[] = [];

  // overdue_bonus
  if (isOverdue(task)) {
    score += 30;
    factors.push({ key: 'overdue', value: 30 });
  }

  // time_fit_bonus
  if (task.estimated_minutes <= available) {
    score += 20;
    factors.push({ key: 'time_fit', value: 20 });
  }

  // difficulty_bonus
  if (task.difficulty === 'easy' && streak < 3) {
    score += 15;
    factors.push({ key: 'difficulty_easy_warmup', value: 15 });
  } else if (task.difficulty === 'hard' && streak >= 3) {
    score += 15;
    factors.push({ key: 'difficulty_hard_momentum', value: 15 });
  } else if (task.difficulty === 'medium') {
    score += 10;
    factors.push({ key: 'difficulty_medium', value: 10 });
  }

  // momentum_bonus
  if (hasMomentum(ctx.lastCompletionTime)) {
    score += 10;
    factors.push({ key: 'momentum', value: 10 });
  }

  // session_pause_penalty
  if (task.session_paused_flag === 1) {
    score -= 25;
  }

  // recently_completed_penalty (sanity check)
  if (task.status === 'completed') {
    score -= 100;
  }

  // Determine top contributing factor (highest value among positive factors)
  let topFactor: ReasonKey = 'default';
  if (factors.length > 0) {
    const sorted = factors.slice().sort((a, b) => b.value - a.value);
    topFactor = sorted[0].key;
  }

  return { task, score, topFactor };
}

/**
 * Main recommendation function.
 * Returns null only when the task pool is empty.
 */
export function getRecommendation(
  tasks: Task[],
  ctx: EngineContext
): Recommendation | null {
  // Filter to actionable tasks
  const actionable = tasks.filter(
    (t) => t.status === 'open' || t.status === 'paused'
  );

  if (actionable.length === 0) return null;

  // Single task shortcut
  if (actionable.length === 1) {
    const scored = scoreTask(actionable[0], ctx);
    return {
      task: actionable[0],
      reason: REASON_STRINGS[scored.topFactor],
      reasonKey: scored.topFactor,
      score: scored.score,
    };
  }

  // Score all tasks
  let scoredTasks = actionable.map((t) => scoreTask(t, ctx));

  // Fallback: if all are paused, clear session penalties and re-rank
  const allPaused = actionable.every((t) => t.session_paused_flag === 1);
  if (allPaused) {
    scoredTasks = actionable.map((t) => scoreTask({ ...t, session_paused_flag: 0 }, ctx));
  }

  // Sort: descending score, then alphabetically by title for ties
  scoredTasks.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.task.title.localeCompare(b.task.title);
  });

  const top = scoredTasks[0];
  return {
    task: top.task,
    reason: REASON_STRINGS[top.topFactor],
    reasonKey: top.topFactor,
    score: top.score,
  };
}
