// lib/db.web.ts
// In-memory mock of the database strictly for Web preview purposes.

import { Task, Completion, UserState } from './types';
import { v4 as uuidv4 } from 'uuid';

export * from './types';

let tasks: Task[] = [];
let completions: Completion[] = [];
let userState: UserState = {
  id: 1,
  total_xp: 0,
  current_streak: 0,
  longest_streak: 0,
  last_active_date: '',
  daily_task_goal: 3,
  notification_time: '08:00',
  onboarding_complete: 0,
};

// Seed initial data if needed, but we keep it empty to simulate first-load.

export async function getAllTasks(): Promise<Task[]> {
  return [...tasks].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getOpenTasks(): Promise<Task[]> {
  return tasks
    .filter((t) => t.status === 'open' || t.status === 'paused')
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function insertTask(task: Omit<Task, 'completed_at' | 'paused_at' | 'session_paused_flag'>): Promise<void> {
  const newTask: Task = {
    ...task,
    completed_at: null,
    paused_at: null,
    session_paused_flag: 0,
  };
  tasks.push(newTask);
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<void> {
  const index = tasks.findIndex((t) => t.id === id);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
  }
}

export async function completeTaskInTransaction(
  taskId: string,
  completionId: string,
  taskTitle: string,
  xpEarned: number,
  timeSpentSeconds: number,
  newTotalXp: number,
  newStreak: number,
  newLongestStreak: number,
  today: string
): Promise<void> {
  const now = new Date().toISOString();
  // Update task
  const tIndex = tasks.findIndex((t) => t.id === taskId);
  if (tIndex !== -1) {
    tasks[tIndex].status = 'completed';
    tasks[tIndex].completed_at = now;
  }
  
  // Insert completion
  completions.push({
    id: completionId,
    task_id: taskId,
    task_title: taskTitle,
    xp_earned: xpEarned,
    time_spent_seconds: timeSpentSeconds,
    completed_at: now,
  });

  // Update user state
  userState.total_xp = newTotalXp;
  userState.current_streak = newStreak;
  userState.longest_streak = newLongestStreak;
  userState.last_active_date = today;
}

export async function clearSessionPauseFlags(): Promise<void> {
  tasks = tasks.map((t) => t.session_paused_flag === 1 ? { ...t, session_paused_flag: 0 } : t);
}

export async function getAllCompletions(): Promise<Completion[]> {
  return [...completions].sort((a, b) => b.completed_at.localeCompare(a.completed_at));
}

export async function getCompletionsTodayCount(today: string): Promise<number> {
  return completions.filter((c) => c.completed_at.startsWith(today)).length;
}

export async function getLastCompletionTime(): Promise<string | null> {
  if (completions.length === 0) return null;
  const sorted = [...completions].sort((a, b) => b.completed_at.localeCompare(a.completed_at));
  return sorted[0].completed_at;
}

export async function getUserState(): Promise<UserState> {
  return { ...userState };
}

export async function updateUserState(updates: Partial<Omit<UserState, 'id'>>): Promise<void> {
  userState = { ...userState, ...updates };
}

export async function deleteAllTasks(): Promise<void> {
  tasks = [];
  completions = [];
  userState = {
    id: 1,
    total_xp: 0,
    current_streak: 0,
    longest_streak: 0,
    last_active_date: '',
    daily_task_goal: userState.daily_task_goal,
    notification_time: userState.notification_time,
    onboarding_complete: userState.onboarding_complete,
  };
}
