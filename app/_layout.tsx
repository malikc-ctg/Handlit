import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import { useTaskStore } from '../stores/useTaskStore';
import { useUserStore } from '../stores/useUserStore';
import { calculateStreakOnLaunch, getTodayString } from '../lib/streak';
import { setupNotificationChannel } from '../lib/notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../lib/theme';

export default function RootLayout() {
  const loadUserState = useUserStore((s) => s.loadUserState);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const resetSessionFlags = useTaskStore((s) => s.resetSessionFlags);
  const setStreakOnLaunch = useUserStore((s) => s.setStreakOnLaunch);
  const userState = useUserStore((s) => s.userState);

  useEffect(() => {
    async function init() {
      await setupNotificationChannel();
      await loadUserState();
    }
    init();
  }, []);

  // Once userState is loaded, check streak and route
  useEffect(() => {
    if (!userState) return;

    async function postLoadInit() {
      if (!userState) return;
      const today = getTodayString();

      // Check and potentially reset streak
      const correctedStreak = calculateStreakOnLaunch(
        userState.last_active_date,
        today,
        userState.current_streak
      );
      if (correctedStreak !== userState.current_streak) {
        await setStreakOnLaunch(correctedStreak);
      }

      // Reset session pause flags if last active was not today
      if (userState.last_active_date !== today) {
        await resetSessionFlags();
      }

      // Load tasks with the (potentially corrected) streak
      await loadTasks(correctedStreak);

      // Route to onboarding or home
      if (!userState.onboarding_complete) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }

    postLoadInit();
  }, [userState?.id]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="execution"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="reward"
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
