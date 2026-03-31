// app/reward.tsx — Reward overlay screen (transparent modal)
// Animated reward screen with XP count-up and streak badge

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { pendingReward } from './execution';
import StreakBadge from '../components/StreakBadge';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../lib/theme';

function useXPCounter(target: number, onDone?: () => void) {
  const [displayed, setDisplayed] = React.useState(0);

  useEffect(() => {
    if (target === 0) return;
    const duration = 800;
    const steps = 30;
    const stepTime = duration / steps;
    let current = 0;
    const increment = target / steps;

    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayed(target);
        clearInterval(interval);
        onDone?.();
      } else {
        setDisplayed(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [target]);

  return displayed;
}

export default function RewardScreen() {
  const { taskTitle, xpEarned, newStreak, prevXP, newXP } = pendingReward;

  // Animation values
  const cardScale = useSharedValue(0.6);
  const cardOpacity = useSharedValue(0);
  const particleScale1 = useSharedValue(0);
  const particleScale2 = useSharedValue(0);
  const particleScale3 = useSharedValue(0);
  const particle1Opacity = useSharedValue(0);
  const particle2Opacity = useSharedValue(0);
  const particle3Opacity = useSharedValue(0);

  const xpDisplayed = useXPCounter(xpEarned);

  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function goHome() {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    router.replace('/(tabs)');
  }

  useEffect(() => {
    // Card entrance
    cardScale.value = withSpring(1, { damping: 14, stiffness: 200 });
    cardOpacity.value = withTiming(1, { duration: 250 });

    // Particle burst
    const burst = (val: SharedValue<number>, opVal: SharedValue<number>, delay: number) => {
      val.value = withDelay(delay, withSequence(
        withSpring(1.4, { damping: 8, stiffness: 300 }),
        withTiming(0, { duration: 400 })
      ));
      opVal.value = withDelay(delay, withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(200, withTiming(0, { duration: 400 }))
      ));
    };

    burst(particleScale1, particle1Opacity, 100);
    burst(particleScale2, particle2Opacity, 200);
    burst(particleScale3, particle3Opacity, 300);

    // Auto-dismiss after 2.5s
    autoDismissRef.current = setTimeout(goHome, 2500);

    return () => {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const particle1Style = useAnimatedStyle(() => ({
    transform: [{ scale: particleScale1.value }],
    opacity: particle1Opacity.value,
  }));
  const particle2Style = useAnimatedStyle(() => ({
    transform: [{ scale: particleScale2.value }],
    opacity: particle2Opacity.value,
  }));
  const particle3Style = useAnimatedStyle(() => ({
    transform: [{ scale: particleScale3.value }],
    opacity: particle3Opacity.value,
  }));

  return (
    <Pressable style={styles.overlay} onPress={goHome} accessibilityLabel="Tap to continue">
      {/* Particle burst decorations */}
      <Animated.View style={[styles.particle, styles.particle1, particle1Style]} />
      <Animated.View style={[styles.particle, styles.particle2, particle2Style]} />
      <Animated.View style={[styles.particle, styles.particle3, particle3Style]} />

      <Animated.View style={[styles.card, cardStyle]}>
        {/* Checkmark */}
        <View style={styles.checkCircle}>
          <Text style={styles.checkEmoji}>✓</Text>
        </View>

        {/* Task title */}
        <Text style={styles.taskTitle} numberOfLines={3}>{taskTitle}</Text>
        <Text style={styles.completedLabel}>COMPLETED</Text>

        {/* XP gained */}
        <View style={styles.xpRow}>
          <Text style={styles.xpPlus}>+</Text>
          <Text style={styles.xpCount}>{xpDisplayed}</Text>
          <Text style={styles.xpLabel}> XP</Text>
        </View>
        <Text style={styles.totalXP}>{newXP.toLocaleString()} total</Text>

        {/* Streak */}
        <View style={styles.streakRow}>
          <StreakBadge streak={newStreak} size="lg" />
          <Text style={styles.streakText}>
            {newStreak === 1 ? 'day streak' : 'day streak 🔥'}
          </Text>
        </View>

        <Text style={styles.tapHint}>Tap anywhere to continue</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13,13,15,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  particle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: Colors.accent,
  },
  particle1: { width: 120, height: 120, top: '25%', left: '20%', opacity: 0 },
  particle2: { width: 80, height: 80, top: '20%', right: '15%', backgroundColor: Colors.success, opacity: 0 },
  particle3: { width: 60, height: 60, bottom: '30%', left: '30%', backgroundColor: Colors.warning, opacity: 0 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl + 4,
    padding: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.successDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  checkEmoji: { color: Colors.success, fontSize: 36, fontWeight: FontWeight.bold },
  taskTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  completedLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: Spacing.sm,
  },
  xpPlus: { color: Colors.accentLight, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  xpCount: { color: Colors.accentLight, fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold },
  xpLabel: { color: Colors.accentLight, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  totalXP: { color: Colors.textMuted, fontSize: FontSize.sm },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warningDim + '33',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  streakText: { color: Colors.warning, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  tapHint: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.sm },
});
