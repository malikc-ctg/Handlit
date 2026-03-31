// lib/streak.ts
// Pure streak logic. No side effects. Accepts date strings for easy mocking in tests.

export interface StreakResult {
  newStreak: number;
  newLongestStreak: number;
}

/**
 * Calculate updated streak on task completion.
 * @param lastActiveDate - YYYY-MM-DD of last completion, or '' if never
 * @param today - YYYY-MM-DD of current date
 * @param currentStreak - existing streak count
 * @param longestStreak - existing longest streak
 */
export function calculateStreakOnCompletion(
  lastActiveDate: string,
  today: string,
  currentStreak: number,
  longestStreak: number
): StreakResult {
  let newStreak: number;

  if (!lastActiveDate || lastActiveDate === '') {
    // First ever completion
    newStreak = 1;
  } else if (lastActiveDate === today) {
    // Already completed something today — streak unchanged
    newStreak = currentStreak;
  } else {
    const last = new Date(lastActiveDate);
    const curr = new Date(today);
    const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      newStreak = currentStreak + 1;
    } else {
      // Gap — reset to 1
      newStreak = 1;
    }
  }

  const newLongestStreak = Math.max(longestStreak, newStreak);
  return { newStreak, newLongestStreak };
}

/**
 * Calculate streak on app launch — may need to reset if user was inactive.
 * @param lastActiveDate - YYYY-MM-DD of last completion, or ''
 * @param today - YYYY-MM-DD of current date
 * @param currentStreak - existing streak count
 * Returns the streak value to write (0 if broken, else unchanged).
 */
export function calculateStreakOnLaunch(
  lastActiveDate: string,
  today: string,
  currentStreak: number
): number {
  if (!lastActiveDate || lastActiveDate === '') return currentStreak;

  const last = new Date(lastActiveDate);
  const curr = new Date(today);
  const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  // More than 1 day since last active — streak broken
  if (diffDays > 1) return 0;

  return currentStreak;
}

/**
 * Return today's date as YYYY-MM-DD in local time.
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
