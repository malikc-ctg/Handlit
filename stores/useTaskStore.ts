// stores/useTaskStore.ts
// Zustand store for tasks and recommendation engine.

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  Difficulty,
  getAllTasks,
  insertTask,
  updateTask,
  clearSessionPauseFlags,
  getLastCompletionTime,
} from '../lib/db';
import { getRecommendation, Recommendation, EngineContext } from '../lib/engine';

export interface NewTaskInput {
  title: string;
  estimated_minutes: number;
  difficulty: Difficulty;
  category?: string;
  notes?: string;
}

interface TaskStore {
  tasks: Task[];
  recommendation: Recommendation | null;
  isLoading: boolean;

  // Actions
  loadTasks: (streak: number) => Promise<void>;
  addTask: (input: NewTaskInput, streak: number) => Promise<void>;
  editTask: (id: string, updates: Partial<NewTaskInput>, streak: number) => Promise<void>;
  archiveTask: (id: string, streak: number) => Promise<void>;
  pauseTask: (id: string, streak: number) => Promise<void>;
  skipTask: (id: string, streak: number) => Promise<void>;
  refreshRecommendation: (tasks: Task[], streak: number) => Promise<void>;
  resetSessionFlags: () => Promise<void>;
}

async function buildEngineCtx(streak: number): Promise<EngineContext> {
  const lastCompletion = await getLastCompletionTime();
  return {
    currentStreak: streak,
    availableMinutes: 30,
    lastCompletionTime: lastCompletion,
  };
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  recommendation: null,
  isLoading: false,

  loadTasks: async (streak) => {
    set({ isLoading: true });
    const tasks = await getAllTasks();
    const ctx = await buildEngineCtx(streak);
    const recommendation = getRecommendation(tasks, ctx);
    set({ tasks, recommendation, isLoading: false });
  },

  addTask: async (input, streak) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: uuidv4(),
      title: input.title.trim(),
      estimated_minutes: input.estimated_minutes,
      difficulty: input.difficulty,
      category: input.category?.trim() || null,
      notes: input.notes?.trim() || null,
      status: 'open',
      created_at: now,
      completed_at: null,
      paused_at: null,
      session_paused_flag: 0,
    };
    await insertTask(newTask);
    const tasks = await getAllTasks();
    const ctx = await buildEngineCtx(streak);
    const recommendation = getRecommendation(tasks, ctx);
    set({ tasks, recommendation });
  },

  editTask: async (id, updates, streak) => {
    const dbUpdates: Partial<Task> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
    if (updates.estimated_minutes !== undefined) dbUpdates.estimated_minutes = updates.estimated_minutes;
    if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;
    if (updates.category !== undefined) dbUpdates.category = updates.category?.trim() || null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes?.trim() || null;
    await updateTask(id, dbUpdates);
    const tasks = await getAllTasks();
    const ctx = await buildEngineCtx(streak);
    const recommendation = getRecommendation(tasks, ctx);
    set({ tasks, recommendation });
  },

  archiveTask: async (id, streak) => {
    await updateTask(id, { status: 'archived' });
    const tasks = await getAllTasks();
    const ctx = await buildEngineCtx(streak);
    const recommendation = getRecommendation(tasks, ctx);
    set({ tasks, recommendation });
  },

  pauseTask: async (id, streak) => {
    const now = new Date().toISOString();
    await updateTask(id, {
      status: 'paused',
      paused_at: now,
      session_paused_flag: 1,
    });
    const tasks = await getAllTasks();
    const ctx = await buildEngineCtx(streak);
    const recommendation = getRecommendation(tasks, ctx);
    set({ tasks, recommendation });
  },

  skipTask: async (id, streak) => {
    // Skip applies session de-prioritization (same as pause penalty) but doesn't change status
    await updateTask(id, { session_paused_flag: 1 });
    const tasks = await getAllTasks();
    const ctx = await buildEngineCtx(streak);
    const recommendation = getRecommendation(tasks, ctx);
    set({ tasks, recommendation });
  },

  refreshRecommendation: async (tasks, streak) => {
    const ctx = await buildEngineCtx(streak);
    const recommendation = getRecommendation(tasks, ctx);
    set({ recommendation });
  },

  resetSessionFlags: async () => {
    await clearSessionPauseFlags();
    const { tasks } = get();
    // Update local state to reflect cleared flags
    const updated = tasks.map((t) => ({ ...t, session_paused_flag: 0 }));
    set({ tasks: updated });
  },
}));
