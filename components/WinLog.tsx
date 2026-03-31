// components/WinLog.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Completion } from '../lib/db';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../lib/theme';

interface Props {
  completions: Completion[];
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function CompletionItem({ item }: { item: Completion }) {
  return (
    <View style={styles.item}>
      <View style={styles.checkCircle}>
        <Text style={styles.checkmark}>✓</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.task_title}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.metaText}>{formatDate(item.completed_at)}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.metaText}>{formatDuration(item.time_spent_seconds)}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.xpText}>+{item.xp_earned} XP</Text>
        </View>
      </View>
    </View>
  );
}

export default function WinLog({ completions }: Props) {
  if (completions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No wins yet.</Text>
        <Text style={styles.emptyBody}>Complete your first task to start your log.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={completions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CompletionItem item={item} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.lg, gap: Spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.successDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  checkmark: { color: Colors.success, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  itemContent: { flex: 1, gap: 4 },
  itemTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium, lineHeight: 22 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  metaText: { color: Colors.textMuted, fontSize: FontSize.xs },
  dot: { color: Colors.textMuted, fontSize: FontSize.xs },
  xpText: { color: Colors.accentLight, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { color: Colors.textSecondary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  emptyBody: { color: Colors.textMuted, fontSize: FontSize.md, textAlign: 'center' },
});
