// app/(tabs)/index.tsx — Home Screen
// 3-zone layout: Status bar → Recommendation card → (Bottom nav from layout)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useTaskStore } from '../../stores/useTaskStore';
import { useUserStore } from '../../stores/useUserStore';
import RecommendationCard from '../../components/RecommendationCard';
import StreakBadge from '../../components/StreakBadge';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../lib/theme';
import { getCompletionsTodayCount } from '../../lib/db';
import { getTodayString } from '../../lib/streak';

// Global state for execution → reward handoff
let _pendingTaskId: string | null = null;
let _pendingTaskTitle: string | null = null;
let _pendingTimeSpent: number = 0;
export function setPendingCompletion(taskId: string, title: string, timeSpent: number) {
  _pendingTaskId = taskId;
  _pendingTaskTitle = title;
  _pendingTimeSpent = timeSpent;
}
export function consumePendingCompletion() {
  const r = { taskId: _pendingTaskId, title: _pendingTaskTitle, timeSpent: _pendingTimeSpent };
  _pendingTaskId = null;
  _pendingTaskTitle = null;
  _pendingTimeSpent = 0;
  return r;
}

export default function HomeScreen() {
  const tasks = useTaskStore((s) => s.tasks);
  const recommendation = useTaskStore((s) => s.recommendation);
  const skipTask = useTaskStore((s) => s.skipTask);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const userState = useUserStore((s) => s.userState);

  const [refreshing, setRefreshing] = useState(false);
  const [todayCount, setTodayCount] = useState(0);

  const streak = userState?.current_streak ?? 0;
  const totalXP = userState?.total_xp ?? 0;
  const dailyGoal = userState?.daily_task_goal ?? 3;

  const hour = new Date().getHours();
  const isMorning = hour < 12;

  useEffect(() => {
    loadTodayCount();
  }, [tasks]);

  async function loadTodayCount() {
    const count = await getCompletionsTodayCount(getTodayString());
    setTodayCount(count);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadTasks(streak);
    await loadTodayCount();
    setRefreshing(false);
  }

  function handleStart() {
    if (!recommendation) return;
    router.push({
      pathname: '/execution',
      params: {
        taskId: recommendation.task.id,
        taskTitle: recommendation.task.title,
        estimatedMinutes: recommendation.task.estimated_minutes,
      },
    });
  }

  async function handleSkip() {
    if (!recommendation) return;
    await skipTask(recommendation.task.id, streak);
  }

  const openTasks = tasks.filter((t) => t.status === 'open' || t.status === 'paused');
  const allCompletedToday = openTasks.length === 0 && todayCount >= 1;
  const noTasksAtAll = tasks.filter((t) => t.status !== 'archived').length === 0;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Zone 1: Status bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <StreakBadge streak={streak} size="md" />
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>{totalXP.toLocaleString()} XP</Text>
            </View>
          </View>
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              {todayCount}/{dailyGoal} today
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${Math.min((todayCount / dailyGoal) * 100, 100)}%` }]}
              />
            </View>
          </View>
        </View>

        {/* Morning greeting */}
        {isMorning && streak > 0 && (
          <View style={styles.greetingBanner}>
            <Text style={styles.greetingText}>
              Good morning 👋 Day {streak} — keep it going.
            </Text>
          </View>
        )}

        {/* Zone 2: Recommendation or empty states */}
        <View style={styles.zone2}>
          {noTasksAtAll ? (
            <EmptyStateNoTasks />
          ) : allCompletedToday ? (
            <EmptyStateAllDone todayCount={todayCount} />
          ) : recommendation ? (
            <>
              <Text style={styles.sectionLabel}>DO THIS NOW</Text>
              <RecommendationCard
                recommendation={recommendation}
                onStart={handleStart}
                onSkip={handleSkip}
              />
            </>
          ) : (
            <EmptyStateNoTasks />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyStateNoTasks() {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyEmoji}>📋</Text>
      <Text style={styles.emptyTitle}>No tasks yet.</Text>
      <Text style={styles.emptyBody}>Add one thing you need to do today and we'll tell you exactly where to start.</Text>
      <Pressable
        style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
        onPress={() => router.push('/(tabs)/tasks')}
        id="add-first-task-btn"
      >
        <Text style={styles.emptyBtnText}>Add a Task</Text>
      </Pressable>
    </View>
  );
}

function EmptyStateAllDone({ todayCount }: { todayCount: number }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyEmoji}>🎯</Text>
      <Text style={styles.emptyTitle}>You've cleared your list.</Text>
      <Text style={styles.emptyBody}>
        {todayCount} {todayCount === 1 ? 'task' : 'tasks'} done today. Add more or rest—you've earned it.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
        onPress={() => router.push('/(tabs)/tasks')}
        id="add-more-tasks-btn"
      >
        <Text style={styles.emptyBtnText}>Add More Tasks</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 40 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  xpBadge: {
    backgroundColor: Colors.accentDim + '55',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
  },
  xpText: { color: Colors.accentLight, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  progressSection: { alignItems: 'flex-end', gap: 4 },
  progressLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  progressBar: { width: 80, height: 4, backgroundColor: Colors.surfaceElevated, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
  greetingBanner: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  greetingText: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22 },
  zone2: { gap: Spacing.md },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 260,
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.xs },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  emptyBody: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  emptyBtnText: { color: Colors.textPrimary, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
});
