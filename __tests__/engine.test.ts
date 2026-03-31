// __tests__/engine.test.ts
import { getRecommendation, REASON_STRINGS } from '../lib/engine';
import { Task } from '../lib/types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Test Task',
    estimated_minutes: 30,
    difficulty: 'medium',
    category: null,
    notes: null,
    status: 'open',
    created_at: new Date().toISOString(),
    completed_at: null,
    paused_at: null,
    session_paused_flag: 0,
    ...overrides,
  };
}

const baseCtx = { currentStreak: 0, availableMinutes: 30 };

describe('getRecommendation', () => {
  describe('empty pool', () => {
    it('returns null if no tasks', () => {
      expect(getRecommendation([], baseCtx)).toBeNull();
    });

    it('returns null if all tasks are completed', () => {
      const tasks = [makeTask({ status: 'completed' })];
      expect(getRecommendation(tasks, baseCtx)).toBeNull();
    });

    it('returns null if all tasks are archived', () => {
      const tasks = [makeTask({ status: 'archived' })];
      expect(getRecommendation(tasks, baseCtx)).toBeNull();
    });
  });

  describe('single task', () => {
    it('returns the only available task', () => {
      const tasks = [makeTask()];
      const result = getRecommendation(tasks, baseCtx);
      expect(result?.task.id).toBe('task-1');
    });

    it('returns paused task if it is the only option', () => {
      const tasks = [makeTask({ status: 'paused' })];
      const result = getRecommendation(tasks, baseCtx);
      expect(result?.task.id).toBe('task-1');
    });
  });

  describe('scoring factors', () => {
    it('overdue_bonus boosts score (+30) and sets reason', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const tasks = [
        makeTask({ id: 'overdue', created_at: yesterday }),
        makeTask({ id: 'fresh' }),
      ];
      const result = getRecommendation(tasks, baseCtx);
      expect(result?.task.id).toBe('overdue');
      expect(result?.reason).toBe(REASON_STRINGS.overdue);
    });

    it('time_fit_bonus applied when estimated_minutes <= availableMinutes', () => {
      const tasks = [makeTask({ id: 'fit', estimated_minutes: 15 }), makeTask({ id: 'too-long', estimated_minutes: 90 })];
      const result = getRecommendation(tasks, { ...baseCtx, availableMinutes: 30 });
      expect(result?.task.id).toBe('fit');
    });

    it('difficulty_easy_warmup when streak < 3', () => {
      const tasks = [
        makeTask({ id: 'easy', difficulty: 'easy', estimated_minutes: 5 }),
        makeTask({ id: 'medium', difficulty: 'medium', estimated_minutes: 30 }),
      ];
      const result = getRecommendation(tasks, { currentStreak: 0, availableMinutes: 5 });
      // easy: time_fit(+20) + easy_warmup(+15) = 35
      // medium: time_fit(+20) + medium(+10) = 30
      expect(result?.task.id).toBe('easy');
    });

    it('difficulty_hard_momentum when streak >= 3', () => {
      const tasks = [
        makeTask({ id: 'hard', difficulty: 'hard' }),
        makeTask({ id: 'easy', difficulty: 'easy' }),
      ];
      const result = getRecommendation(tasks, { currentStreak: 5, availableMinutes: 30 });
      // hard: time_fit(+20) + hard_momentum(+15) = 35
      // easy: time_fit(+20) — no warmup bonus (streak >= 3) = 20
      expect(result?.task.id).toBe('hard');
    });

    it('session_pause_penalty de-prioritizes paused task', () => {
      const tasks = [
        makeTask({ id: 'paused', status: 'paused', session_paused_flag: 1 }),
        makeTask({ id: 'fresh' }),
      ];
      const result = getRecommendation(tasks, baseCtx);
      expect(result?.task.id).toBe('fresh');
    });
  });

  describe('fallback behaviors', () => {
    it('all tasks paused: clears session penalties and re-ranks', () => {
      const tasks = [
        makeTask({ id: 'task-a', status: 'paused', session_paused_flag: 1, title: 'Alpha' }),
        makeTask({ id: 'task-b', status: 'paused', session_paused_flag: 1, title: 'Beta' }),
      ];
      const result = getRecommendation(tasks, baseCtx);
      // Should still return a result, not null
      expect(result).not.toBeNull();
    });

    it('equal scores: sorts alphabetically and picks first', () => {
      const tasks = [
        makeTask({ id: 'b', title: 'Zara', estimated_minutes: 30 }),
        makeTask({ id: 'a', title: 'Alpha', estimated_minutes: 30 }),
      ];
      const result = getRecommendation(tasks, baseCtx);
      expect(result?.task.title).toBe('Alpha');
    });
  });

  describe('reason strings', () => {
    it('all reason strings are non-empty', () => {
      Object.values(REASON_STRINGS).forEach((r) => {
        expect(r.length).toBeGreaterThan(0);
      });
    });
  });
});
