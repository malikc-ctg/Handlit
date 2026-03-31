// app/execution.tsx — Full-screen Execution Mode modal

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTaskStore } from '../stores/useTaskStore';
import { useUserStore } from '../stores/useUserStore';
import Timer from '../components/Timer';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../lib/theme';
import { calculateStreakOnCompletion } from '../lib/streak';
import { calculateXP } from '../lib/xp';
import { getTodayString } from '../lib/streak';
import { completeTaskInTransaction } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { Difficulty } from '../lib/db';

// Shared state for the reward screen
export const pendingReward = {
  taskId: '',
  taskTitle: '',
  xpEarned: 0,
  timeSpent: 0,
  newStreak: 0,
  prevXP: 0,
  newXP: 0,
};

export default function ExecutionScreen() {
  const params = useLocalSearchParams<{
    taskId: string;
    taskTitle: string;
    estimatedMinutes: string;
  }>();

  const { taskId, taskTitle, estimatedMinutes } = params;
  const estimatedMins = parseInt(estimatedMinutes ?? '30', 10);

  const [timerRunning, setTimerRunning] = useState(true);
  const timeSpentRef = useRef(0);

  const tasks = useTaskStore((s) => s.tasks);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const pauseTask = useTaskStore((s) => s.pauseTask);
  const userState = useUserStore((s) => s.userState);
  const updateXPAndStreak = useUserStore((s) => s.updateXPAndStreak);

  const task = tasks.find((t) => t.id === taskId);
  const difficulty: Difficulty = (task?.difficulty as Difficulty) ?? 'medium';
  const streak = userState?.current_streak ?? 0;

  function handleTick(seconds: number) {
    timeSpentRef.current = seconds;
  }

  async function handleDone() {
    setTimerRunning(false);
    const timeSpent = timeSpentRef.current;
    const today = getTodayString();

    const xpEarned = calculateXP(difficulty, streak);
    const { newStreak, newLongestStreak } = calculateStreakOnCompletion(
      userState?.last_active_date ?? '',
      today,
      streak,
      userState?.longest_streak ?? 0
    );
    const prevXP = userState?.total_xp ?? 0;
    const newTotalXP = prevXP + xpEarned;

    // Atomic transaction
    const completionId = uuidv4();
    await completeTaskInTransaction(
      taskId,
      completionId,
      taskTitle,
      xpEarned,
      timeSpent,
      newTotalXP,
      newStreak,
      newLongestStreak,
      today
    );

    // Update store
    await updateXPAndStreak(newTotalXP, newStreak, newLongestStreak);
    await loadTasks(newStreak);

    // Pass data to reward screen
    pendingReward.taskId = taskId;
    pendingReward.taskTitle = taskTitle;
    pendingReward.xpEarned = xpEarned;
    pendingReward.timeSpent = timeSpent;
    pendingReward.newStreak = newStreak;
    pendingReward.prevXP = prevXP;
    pendingReward.newXP = newTotalXP;

    // Navigate to reward screen
    router.replace('/reward');
  }

  function handleQuit() {
    Alert.alert(
      'Leave Task?',
      'Mark as paused and come back later?',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Pause & Exit',
          onPress: async () => {
            setTimerRunning(false);
            if (taskId) {
              await pauseTask(taskId, streak);
            }
            router.back();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <SafeAreaView style={styles.safeArea}>
        {/* Task title */}
        <View style={styles.titleWrapper}>
          <Text style={styles.estimatedBadge}>
            ~{estimatedMins} min estimated
          </Text>
          <Text style={styles.title} numberOfLines={4}>
            {taskTitle}
          </Text>
        </View>

        {/* Timer */}
        <View style={styles.timerWrapper}>
          <Timer running={timerRunning} onTick={handleTick} />
          <Text style={styles.timerLabel}>elapsed</Text>
        </View>

        {/* Done button */}
        <View style={styles.bottomActions}>
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
            onPress={handleDone}
            accessibilityRole="button"
            accessibilityLabel="Mark task as done"
            id="execution-done-btn"
          >
            <Text style={styles.doneBtnText}>Done ✓</Text>
          </Pressable>

          <Pressable
            onPress={handleQuit}
            style={styles.quitBtn}
            accessibilityRole="button"
            accessibilityLabel="Quit task"
            id="execution-quit-btn"
          >
            <Text style={styles.quitBtnText}>Quit</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1, justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  titleWrapper: { flex: 1, justifyContent: 'center', gap: Spacing.md, paddingTop: Spacing.xxl },
  estimatedBadge: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: FontSize.xxl + 4,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
  },
  timerWrapper: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
  },
  timerLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  bottomActions: {
    gap: Spacing.md,
    alignItems: 'center',
  },
  doneBtn: {
    width: '100%',
    backgroundColor: Colors.success,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  doneBtnPressed: { opacity: 0.85 },
  doneBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  quitBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  quitBtnText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});
