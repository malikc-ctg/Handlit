// lib/notifications.ts
// Local push notification scheduling for daily nudge.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const NUDGE_MESSAGES = [
  'Your next task is ready. Let\'s go. 🔥',
  'One task. That\'s all. You\'ve got this.',
  'Time to make progress. Open Handlit.',
];

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyNotification(timeString: string): Promise<void> {
  try {
    // Cancel existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const [hourStr, minStr] = timeString.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (isNaN(hour) || isNaN(minute)) return;

    const message = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Handlit',
        body: message,
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === 'android' ? 'daily-nudge' : undefined,
      },
    });
  } catch {
    // Graceful degradation — permissions may be denied
  }
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-nudge', {
      name: 'Daily Nudge',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    });
  }
}
