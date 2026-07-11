import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DAILY_STREAK_REMINDER_ID = 'maxx-daily-streak-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Daily streak-reminder notifications (spec §10 decision: enabled). */
export async function syncDailyReminder(enabled: boolean) {
  if (Platform.OS === 'web') return;

  await Notifications.cancelScheduledNotificationAsync(DAILY_STREAK_REMINDER_ID).catch(() => {});
  if (!enabled) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    if (requested !== 'granted') return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_STREAK_REMINDER_ID,
    content: {
      title: 'Keep your streak alive 🔥',
      body: 'A few minutes today keeps your progress going. Your next level is ready.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
    },
  });
}
