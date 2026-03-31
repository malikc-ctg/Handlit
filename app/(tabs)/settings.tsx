// app/(tabs)/settings.tsx — Settings Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useUserStore } from '../../stores/useUserStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../lib/theme';

const TIME_OPTIONS = ['06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '18:00', '20:00', '21:00'];

function formatTime12h(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      <View style={styles.settingRight}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const userState = useUserStore((s) => s.userState);
  const setNotificationTime = useUserStore((s) => s.setNotificationTime);
  const setDailyGoal = useUserStore((s) => s.setDailyGoal);
  const resetStreak = useUserStore((s) => s.resetStreak);
  const clearAllData = useUserStore((s) => s.clearAllData);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadUserState = useUserStore((s) => s.loadUserState);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [goalInput, setGoalInput] = useState(String(userState?.daily_task_goal ?? 3));

  const notifTime = userState?.notification_time ?? '08:00';

  function handleGoalChange(val: string) {
    setGoalInput(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= 20) {
      setDailyGoal(n);
    }
  }

  function handleResetStreak() {
    Alert.alert(
      'Reset Streak',
      'This will set your current streak to 0. Your XP and win log will not be affected. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Streak',
          style: 'destructive',
          onPress: () => resetStreak(),
        },
      ]
    );
  }

  function handleClearAll() {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your tasks, completions, XP, and streak. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await loadUserState();
            await loadTasks(0);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FOCUS</Text>

          <Pressable
            style={styles.settingRow}
            onPress={() => setShowTimePicker(!showTimePicker)}
            id="notification-time-setting"
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Daily Reminder</Text>
              <Text style={styles.settingDesc}>We'll nudge you at this time</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{formatTime12h(notifTime)}</Text>
            </View>
          </Pressable>

          {showTimePicker && (
            <View style={styles.timePicker}>
              {TIME_OPTIONS.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.timePill, notifTime === t && styles.timePillActive]}
                  onPress={() => { setNotificationTime(t); setShowTimePicker(false); }}
                  accessibilityLabel={`Set reminder to ${formatTime12h(t)}`}
                >
                  <Text style={[styles.timePillText, notifTime === t && styles.timePillTextActive]}>
                    {formatTime12h(t)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Daily Task Goal</Text>
              <Text style={styles.settingDesc}>Tasks you aim to complete per day</Text>
            </View>
            <View style={styles.settingRight}>
              <TextInput
                style={styles.goalInput}
                value={goalInput}
                onChangeText={handleGoalChange}
                keyboardType="number-pad"
                maxLength={2}
                id="daily-goal-input"
                accessibilityLabel="Daily task goal"
              />
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STATS</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total XP" value={userState?.total_xp?.toLocaleString() ?? '0'} />
            <StatCard label="Current Streak" value={`${userState?.current_streak ?? 0} days`} />
            <StatCard label="Best Streak" value={`${userState?.longest_streak ?? 0} days`} />
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DANGER ZONE</Text>
          <Pressable
            style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.8 }]}
            onPress={handleResetStreak}
            id="reset-streak-btn"
          >
            <Text style={styles.dangerBtnText}>Reset Streak</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.dangerBtnDestructive, pressed && { opacity: 0.8 }]}
            onPress={handleClearAll}
            id="clear-all-btn"
          >
            <Text style={styles.dangerBtnDestructiveText}>Clear All Data</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={styles.version}>Handlit v1.0.0 · Built with ❤️</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 60 },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.xs },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
  },
  settingLeft: { flex: 1, gap: 3 },
  settingRight: { marginLeft: Spacing.md },
  settingLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  settingDesc: { color: Colors.textMuted, fontSize: FontSize.xs },
  settingValue: { color: Colors.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  timePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingVertical: Spacing.sm },
  timePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  timePillActive: { backgroundColor: Colors.accent + '22', borderColor: Colors.accent },
  timePillText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  timePillTextActive: { color: Colors.accent, fontWeight: FontWeight.semibold },
  goalInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    width: 52,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
  },
  statValue: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },
  dangerBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dangerBtnText: { color: Colors.warning, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  dangerBtnDestructive: {
    backgroundColor: Colors.destructiveDim + '33',
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.destructiveDim,
  },
  dangerBtnDestructiveText: { color: Colors.destructive, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  version: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center', paddingTop: Spacing.md },
});
