// components/RecommendationCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Recommendation } from '../lib/engine';
import { Colors, Spacing, Radius, FontSize, FontWeight, DIFFICULTY_COLORS, DIFFICULTY_LABELS, TIME_LABELS } from '../lib/theme';
import Svg, { Path } from 'react-native-svg';

interface Props {
  recommendation: Recommendation;
  onStart: () => void;
  onSkip: () => void;
}

function PlayIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="white">
      <Path d="M5 3l14 9-14 9V3z" />
    </Svg>
  );
}

export default function RecommendationCard({ recommendation, onStart, onSkip }: Props) {
  const { task, reason } = recommendation;
  const diffColor = DIFFICULTY_COLORS[task.difficulty] ?? Colors.textSecondary;
  const diffLabel = DIFFICULTY_LABELS[task.difficulty] ?? task.difficulty;
  const timeLabel = TIME_LABELS[task.estimated_minutes] ?? `${task.estimated_minutes} min`;

  return (
    <View style={styles.card}>
      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={[styles.diffBadge, { borderColor: diffColor }]}>
          <Text style={[styles.diffText, { color: diffColor }]}>{diffLabel}</Text>
        </View>
        <Text style={styles.timeText}>{timeLabel}</Text>
        {task.category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{task.category}</Text>
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={3}>{task.title}</Text>

      {/* Reason */}
      <Text style={styles.reason}>{reason}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
          onPress={onStart}
          accessibilityLabel="Start task"
          accessibilityRole="button"
          id="start-task-btn"
        >
          <PlayIcon />
          <Text style={styles.startBtnText}>Start</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.skipBtn, pressed && styles.skipBtnPressed]}
          onPress={onSkip}
          accessibilityLabel="Skip task"
          accessibilityRole="button"
          id="skip-task-btn"
        >
          <Text style={styles.skipBtnText}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  diffBadge: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  diffText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 34,
  },
  reason: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  startBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  startBtnPressed: {
    opacity: 0.85,
  },
  startBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  skipBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipBtnPressed: {
    backgroundColor: Colors.surfaceElevated,
  },
  skipBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});
