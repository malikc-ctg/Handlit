// app/onboarding.tsx
// Two-step onboarding: notification time → first task seed

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../stores/useUserStore';
import { useTaskStore } from '../stores/useTaskStore';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../lib/theme';
import { requestNotificationPermission, scheduleDailyNotification } from '../lib/notifications';

const TIME_OPTIONS = ['07:00', '08:00', '09:00', '10:00', '12:00'];

export default function OnboardingScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [taskTitle, setTaskTitle] = useState('');

  const markOnboardingComplete = useUserStore((s) => s.markOnboardingComplete);
  const setNotificationTime = useUserStore((s) => s.setNotificationTime);
  const addTask = useTaskStore((s) => s.addTask);

  async function handleStep1() {
    await setNotificationTime(selectedTime);
    const granted = await requestNotificationPermission();
    if (granted) {
      await scheduleDailyNotification(selectedTime);
    }
    setStep(2);
  }

  async function handleStep2() {
    if (!taskTitle.trim()) return;
    await addTask(
      { title: taskTitle.trim(), estimated_minutes: 30, difficulty: 'medium' },
      0
    );
    await markOnboardingComplete();
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Step indicator */}
        <View style={styles.steps}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>

        {step === 1 ? (
          <View style={styles.stepContent}>
            <Text style={styles.label}>STEP 1 OF 2</Text>
            <Text style={styles.title}>When should we remind you to focus?</Text>
            <Text style={styles.subtitle}>
              We'll send you a daily nudge at this time. You can change it later.
            </Text>

            <View style={styles.timeGrid}>
              {TIME_OPTIONS.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.timePill, selectedTime === t && styles.timePillActive]}
                  onPress={() => setSelectedTime(t)}
                  accessibilityLabel={`Focus time ${t}`}
                >
                  <Text style={[styles.timePillText, selectedTime === t && styles.timePillTextActive]}>
                    {formatTime12h(t)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={handleStep1}
              id="onboarding-next-btn"
            >
              <Text style={styles.btnText}>Next →</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.stepContent}>
            <Text style={styles.label}>STEP 2 OF 2</Text>
            <Text style={styles.title}>What's one thing you need to do today?</Text>
            <Text style={styles.subtitle}>
              Just one. We'll recommend it right away and you can add more later.
            </Text>

            <TextInput
              style={styles.taskInput}
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="e.g. Send that email, finish the report..."
              placeholderTextColor={Colors.textMuted}
              maxLength={200}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleStep2}
              id="onboarding-task-input"
            />

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                pressed && styles.btnPressed,
                !taskTitle.trim() && styles.btnDisabled,
              ]}
              onPress={handleStep2}
              disabled={!taskTitle.trim()}
              id="onboarding-done-btn"
            >
              <Text style={styles.btnText}>Let's go 🔥</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatTime12h(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  steps: { flexDirection: 'row', gap: Spacing.xs, justifyContent: 'center', marginBottom: Spacing.xxl },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surfaceElevated },
  stepDotActive: { backgroundColor: Colors.accent, width: 24 },
  stepContent: { gap: Spacing.lg },
  label: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: FontWeight.semibold, letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 34 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  timePill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  timePillActive: { backgroundColor: Colors.accent + '22', borderColor: Colors.accent },
  timePillText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  timePillTextActive: { color: Colors.accent, fontWeight: FontWeight.semibold },
  taskInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { backgroundColor: Colors.surfaceElevated },
  btnText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
