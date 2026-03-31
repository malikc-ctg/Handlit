// app/(tabs)/log.tsx — Win Log Screen

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { getAllCompletions } from '../../lib/db';
import { Completion } from '../../lib/db';
import WinLog from '../../components/WinLog';
import { Colors, Spacing, FontSize, FontWeight } from '../../lib/theme';
import { useTaskStore } from '../../stores/useTaskStore';

export default function LogScreen() {
  const [completions, setCompletions] = useState<Completion[]>([]);
  const tasks = useTaskStore((s) => s.tasks); // trigger refresh on task change

  useEffect(() => {
    loadCompletions();
  }, [tasks]);

  async function loadCompletions() {
    const data = await getAllCompletions();
    setCompletions(data);
  }

  const totalXP = completions.reduce((sum, c) => sum + c.xp_earned, 0);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Win Log</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{totalXP.toLocaleString()} XP total</Text>
        </View>
      </View>
      <WinLog completions={completions} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  totalBadge: {
    backgroundColor: Colors.accentDim + '44',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  totalText: { color: Colors.accentLight, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
