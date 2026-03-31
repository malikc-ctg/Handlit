// lib/db.ts
// SQLite initialization, migrations, and all query helpers.
// All functions are async and return typed results.

import * as SQLite from 'expo-sqlite';
export * from './types';
import { Task, Completion, UserState } from './types';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('handlit.db');
  await initDb(_db);
  return _db;
}

async function initDb(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  // Migrations table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ max_version: number | null }>(
    `SELECT MAX(version) as max_version FROM migrations;`
  );
  const currentVersion = row?.max_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        estimated_minutes INTEGER NOT NULL DEFAULT 30,
        difficulty TEXT NOT NULL DEFAULT 'medium',
        category TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL,
        completed_at TEXT,
        paused_at TEXT,
        session_paused_flag INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS completions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        task_title TEXT NOT NULL,
        xp_earned INTEGER NOT NULL DEFAULT 0,
        time_spent_seconds INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      );

      CREATE TABLE IF NOT EXISTS user_state (
        id INTEGER PRIMARY KEY,
        total_xp INTEGER NOT NULL DEFAULT 0,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_active_date TEXT NOT NULL DEFAULT '',
        daily_task_goal INTEGER NOT NULL DEFAULT 3,
        notification_time TEXT NOT NULL DEFAULT '08:00',
        onboarding_complete INTEGER NOT NULL DEFAULT 0
      );

      INSERT OR IGNORE INTO user_state (id) VALUES (1);

      INSERT INTO migrations (version, applied_at) VALUES (1, datetime('now'));
    `);
  }
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDb();
  return db.getAllAsync<Task>(`SELECT * FROM tasks ORDER BY created_at DESC;`);
}

export async function getOpenTasks(): Promise<Task[]> {
  const db = await getDb();
  return db.getAllAsync<Task>(
    `SELECT * FROM tasks WHERE status = 'open' OR status = 'paused' ORDER BY created_at ASC;`
  );
}

export async function insertTask(task: Omit<Task, 'completed_at' | 'paused_at' | 'session_paused_flag'>): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO tasks (id, title, estimated_minutes, difficulty, category, notes, status, created_at, completed_at, paused_at, session_paused_flag)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 0);`,
    [task.id, task.title, task.estimated_minutes, task.difficulty, task.category, task.notes, task.status, task.created_at]
  );
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<void> {
  const db = await getDb();
  const keys = Object.keys(updates) as (keyof typeof updates)[];
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => updates[k] as string | number | null);
  await db.runAsync(`UPDATE tasks SET ${setClauses} WHERE id = ?;`, [...values, id]);
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
  const db = await getDb();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE tasks SET status = 'completed', completed_at = ? WHERE id = ?;`,
      [now, taskId]
    );
    await db.runAsync(
      `INSERT INTO completions (id, task_id, task_title, xp_earned, time_spent_seconds, completed_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [completionId, taskId, taskTitle, xpEarned, timeSpentSeconds, now]
    );
    await db.runAsync(
      `UPDATE user_state SET total_xp = ?, current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = 1;`,
      [newTotalXp, newStreak, newLongestStreak, today]
    );
  });
}

export async function clearSessionPauseFlags(): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE tasks SET session_paused_flag = 0 WHERE session_paused_flag = 1;`);
}

// ─── Completions ─────────────────────────────────────────────────────────────

export async function getAllCompletions(): Promise<Completion[]> {
  const db = await getDb();
  return db.getAllAsync<Completion>(
    `SELECT * FROM completions ORDER BY completed_at DESC;`
  );
}

export async function getCompletionsTodayCount(today: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM completions WHERE completed_at LIKE ?;`,
    [`${today}%`]
  );
  return row?.cnt ?? 0;
}

export async function getLastCompletionTime(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ completed_at: string }>(
    `SELECT completed_at FROM completions ORDER BY completed_at DESC LIMIT 1;`
  );
  return row?.completed_at ?? null;
}

// ─── User State ───────────────────────────────────────────────────────────────

export async function getUserState(): Promise<UserState> {
  const db = await getDb();
  const row = await db.getFirstAsync<UserState>(`SELECT * FROM user_state WHERE id = 1;`);
  if (!row) throw new Error('user_state row missing');
  return row;
}

export async function updateUserState(updates: Partial<Omit<UserState, 'id'>>): Promise<void> {
  const db = await getDb();
  const keys = Object.keys(updates) as (keyof typeof updates)[];
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => updates[k] as string | number);
  await db.runAsync(`UPDATE user_state SET ${setClauses} WHERE id = 1;`, [...values, 1]);
}

export async function deleteAllTasks(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`DELETE FROM tasks; DELETE FROM completions;`);
}
