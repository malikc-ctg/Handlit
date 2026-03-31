import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import TaskLoop from '../components/TaskLoop';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../lib/theme';

export default function WarmupScreen() {
  const [mode, setMode] = useState<'intro' | 'loop'>('intro');
  const [canExit, setCanExit] = useState(false);

  async function handleExit() {
    await AsyncStorage.setItem('hasCompletedWarmup', 'true');
    // Re-evaluate RootLayout initialization routing securely bypassing back-stack
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        {mode === 'intro' ? (
          <View style={styles.introContainer}>
            <Text style={styles.title}>Stuck?</Text>
            <Text style={styles.subtitle}>Start with one{"\n"}small action.</Text>
            <Pressable
              style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setMode('loop')}
            >
              <Text style={styles.startBtnText}>Start</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.loopContainer}>
            <View style={styles.spacer} />
            <TaskLoop onFirstComplete={() => setCanExit(true)} />
            <View style={styles.bottomSpacer}>
              {canExit && (
                <Pressable
                  style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.8 }]}
                  onPress={handleExit}
                >
                  <Text style={styles.exitBtnText}>Continue to App</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: Spacing.xl },
  introContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.xl },
  title: { color: Colors.textPrimary, fontSize: 48, fontWeight: FontWeight.extrabold },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.lg, textAlign: 'center', lineHeight: 28 },
  startBtn: { backgroundColor: Colors.accent, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl + 20, borderRadius: Radius.full, marginTop: Spacing.xxl },
  startBtnText: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  loopContainer: { flex: 1, justifyContent: 'space-between' },
  spacer: { flex: 1 },
  bottomSpacer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: Spacing.xl },
  exitBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  exitBtnText: { color: Colors.textMuted, fontSize: FontSize.md, fontWeight: FontWeight.semibold, textDecorationLine: 'underline' },
});
