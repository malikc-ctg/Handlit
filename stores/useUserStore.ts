// stores/useUserStore.ts
// Zustand store for user state (XP, streak, preferences).

import { create } from 'zustand';
import {
  UserState,
  getUserState,
  updateUserState,
  deleteAllTasks,
} from '../lib/db';
import { getTodayString } from '../lib/streak';
import { scheduleDailyNotification } from '../lib/notifications';

interface UserStore {
  userState: UserState | null;
  isLoading: boolean;

  loadUserState: () => Promise<void>;
  updateXPAndStreak: (
    newTotalXp: number,
    newStreak: number,
    newLongestStreak: number
  ) => Promise<void>;
  setNotificationTime: (time: string) => Promise<void>;
  setDailyGoal: (goal: number) => Promise<void>;
  resetStreak: () => Promise<void>;
  clearAllData: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
  setStreakOnLaunch: (newStreak: number) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  userState: null,
  isLoading: false,

  loadUserState: async () => {
    set({ isLoading: true });
    const state = await getUserState();
    set({ userState: state, isLoading: false });
  },

  updateXPAndStreak: async (newTotalXp, newStreak, newLongestStreak) => {
    const today = getTodayString();
    await updateUserState({
      total_xp: newTotalXp,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_active_date: today,
    });
    set((s) =>
      s.userState
        ? {
            userState: {
              ...s.userState,
              total_xp: newTotalXp,
              current_streak: newStreak,
              longest_streak: newLongestStreak,
              last_active_date: today,
            },
          }
        : {}
    );
  },

  setNotificationTime: async (time) => {
    await updateUserState({ notification_time: time });
    await scheduleDailyNotification(time);
    set((s) =>
      s.userState ? { userState: { ...s.userState, notification_time: time } } : {}
    );
  },

  setDailyGoal: async (goal) => {
    await updateUserState({ daily_task_goal: goal });
    set((s) =>
      s.userState ? { userState: { ...s.userState, daily_task_goal: goal } } : {}
    );
  },

  resetStreak: async () => {
    await updateUserState({ current_streak: 0 });
    set((s) =>
      s.userState ? { userState: { ...s.userState, current_streak: 0 } } : {}
    );
  },

  clearAllData: async () => {
    await deleteAllTasks();
    await updateUserState({
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: '',
    });
    set((s) =>
      s.userState
        ? {
            userState: {
              ...s.userState,
              total_xp: 0,
              current_streak: 0,
              longest_streak: 0,
              last_active_date: '',
            },
          }
        : {}
    );
  },

  markOnboardingComplete: async () => {
    await updateUserState({ onboarding_complete: 1 });
    set((s) =>
      s.userState ? { userState: { ...s.userState, onboarding_complete: 1 } } : {}
    );
  },

  setStreakOnLaunch: async (newStreak) => {
    if (newStreak === 0) {
      await updateUserState({ current_streak: 0 });
    }
    set((s) =>
      s.userState ? { userState: { ...s.userState, current_streak: newStreak } } : {}
    );
  },
}));
