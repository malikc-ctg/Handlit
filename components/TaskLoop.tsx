import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../lib/theme';

const TASKS = [
  'Stand up',
  'Take a deep breath',
  'Drink water',
  'Stretch your arms',
];

interface TaskLoopProps {
  onFirstComplete: () => void;
}

export default function TaskLoop({ onFirstComplete }: TaskLoopProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [winCount, setWinCount] = useState(0);

  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Initial entrance animation
    cardScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, []);

  function handleDone() {
    // Fast visual feedback (<300ms)
    cardScale.value = withSequence(
      withTiming(0.95, { duration: 50 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    cardOpacity.value = withSequence(
      withTiming(0.5, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );

    const newWins = winCount + 1;
    setWinCount(newWins);

    // Progress bar visually caps at 1.0
    const progress = Math.min(newWins * 0.25, 1.0);
    progressWidth.value = withSpring(progress, { damping: 20, stiffness: 100 });

    // Instantly queue next task natively
    setTimeout(() => {
      setCurrentTaskIndex((prev) => (prev + 1) % TASKS.length);
      if (newWins === 1) {
        onFirstComplete();
      }
    }, 150);
  }

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <View style={styles.container} testID="task-loop-module">
      {/* Stats Header */}
      <View style={styles.header}>
        <View style={styles.winsBadge}>
          <Text style={styles.winsText}>{winCount} {winCount === 1 ? 'win' : 'wins'}</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
        </View>
      </View>

      {/* Task Card */}
      <Animated.View style={[styles.card, animatedCardStyle]}>
        <Text style={styles.taskText}>{TASKS[currentTaskIndex]}</Text>
        
        <Pressable
          style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
          onPress={handleDone}
          accessibilityLabel="Mark task as done"
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: Spacing.xl },
  header: { gap: Spacing.sm },
  winsBadge: { alignSelf: 'flex-start' },
  winsText: { color: Colors.accentLight, fontSize: FontSize.md, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: Radius.full },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskText: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    lineHeight: 34,
  },
  doneBtn: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.lg,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnPressed: { opacity: 0.8 },
  doneBtnText: { color: Colors.background, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
