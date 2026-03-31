export type TaskStatus = 'open' | 'paused' | 'completed' | 'archived';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Task {
  id: string;
  title: string;
  estimated_minutes: number;
  difficulty: Difficulty;
  category: string | null;
  notes: string | null;
  status: TaskStatus;
  created_at: string;
  completed_at: string | null;
  paused_at: string | null;
  session_paused_flag: number; // 0 or 1 (SQLite has no boolean)
}

export interface Completion {
  id: string;
  task_id: string;
  task_title: string;
  xp_earned: number;
  time_spent_seconds: number;
  completed_at: string;
}

export interface UserState {
  id: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  daily_task_goal: number;
  notification_time: string;
  onboarding_complete: number; // 0 or 1
}
