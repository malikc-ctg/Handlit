// __tests__/xp.test.ts
import { calculateXP } from '../lib/xp';

describe('calculateXP', () => {
  describe('streak 0 (no multiplier)', () => {
    it('easy at streak 0 yields 10', () => {
      expect(calculateXP('easy', 0)).toBe(10);
    });
    it('medium at streak 0 yields 20', () => {
      expect(calculateXP('medium', 0)).toBe(20);
    });
    it('hard at streak 0 yields 35', () => {
      expect(calculateXP('hard', 0)).toBe(35);
    });
  });

  describe('streak multiplier', () => {
    it('streak 1 multiplier = 1.05', () => {
      // hard: floor(35 * 1.05) = floor(36.75) = 36
      expect(calculateXP('hard', 1)).toBe(36);
    });
    it('streak 5 multiplier = 1.25', () => {
      // easy: floor(10 * 1.25) = 12
      expect(calculateXP('easy', 5)).toBe(12);
    });
    it('streak 20 multiplier caps at 2.0', () => {
      // hard: floor(35 * 2.0) = 70
      expect(calculateXP('hard', 20)).toBe(70);
    });
    it('streak 21 multiplier still capped at 2.0', () => {
      // hard: floor(35 * 2.0) = 70 (does not exceed cap)
      expect(calculateXP('hard', 21)).toBe(70);
    });
    it('streak 100 multiplier still capped at 2.0', () => {
      expect(calculateXP('medium', 100)).toBe(40);
    });
  });

  describe('floor behavior', () => {
    it('floors fractional results', () => {
      // medium streak 1: floor(20 * 1.05) = floor(21.0) = 21
      expect(calculateXP('medium', 1)).toBe(21);
    });
  });
});
