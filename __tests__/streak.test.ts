// __tests__/streak.test.ts
import {
  calculateStreakOnCompletion,
  calculateStreakOnLaunch,
} from '../lib/streak';

describe('calculateStreakOnCompletion', () => {
  describe('first-ever completion', () => {
    it('returns streak 1 if lastActiveDate is empty', () => {
      const { newStreak } = calculateStreakOnCompletion('', '2025-01-10', 0, 0);
      expect(newStreak).toBe(1);
    });
  });

  describe('same-day completion', () => {
    it('does not increment streak when already active today', () => {
      const { newStreak } = calculateStreakOnCompletion('2025-01-10', '2025-01-10', 5, 5);
      expect(newStreak).toBe(5);
    });
  });

  describe('consecutive-day completion', () => {
    it('increments streak by 1 on next day', () => {
      const { newStreak } = calculateStreakOnCompletion('2025-01-10', '2025-01-11', 5, 5);
      expect(newStreak).toBe(6);
    });
    it('updates longestStreak if exceeded', () => {
      const { newLongestStreak } = calculateStreakOnCompletion('2025-01-10', '2025-01-11', 10, 10);
      expect(newLongestStreak).toBe(11);
    });
  });

  describe('gap scenario (broken streak)', () => {
    it('resets to 1 after 2-day gap', () => {
      const { newStreak } = calculateStreakOnCompletion('2025-01-08', '2025-01-10', 7, 10);
      expect(newStreak).toBe(1);
    });
    it('resets to 1 after long gap', () => {
      const { newStreak } = calculateStreakOnCompletion('2024-12-01', '2025-01-10', 30, 30);
      expect(newStreak).toBe(1);
    });
    it('longestStreak is preserved if reset is lower', () => {
      const { newLongestStreak } = calculateStreakOnCompletion('2025-01-08', '2025-01-10', 7, 30);
      expect(newLongestStreak).toBe(30);
    });
  });

  describe('year boundary', () => {
    it('handles year boundary (Dec 31 → Jan 1) as consecutive', () => {
      const { newStreak } = calculateStreakOnCompletion('2024-12-31', '2025-01-01', 3, 3);
      expect(newStreak).toBe(4);
    });
  });
});

describe('calculateStreakOnLaunch', () => {
  it('returns unchanged streak if last active was yesterday', () => {
    const result = calculateStreakOnLaunch('2025-01-09', '2025-01-10', 5);
    expect(result).toBe(5);
  });

  it('returns unchanged streak if last active was today', () => {
    const result = calculateStreakOnLaunch('2025-01-10', '2025-01-10', 5);
    expect(result).toBe(5);
  });

  it('returns 0 if last active was 2+ days ago', () => {
    const result = calculateStreakOnLaunch('2025-01-08', '2025-01-10', 5);
    expect(result).toBe(0);
  });

  it('returns 0 after long gap', () => {
    const result = calculateStreakOnLaunch('2024-01-01', '2025-01-10', 365);
    expect(result).toBe(0);
  });

  it('returns unchanged if lastActiveDate is empty', () => {
    const result = calculateStreakOnLaunch('', '2025-01-10', 0);
    expect(result).toBe(0);
  });
});
