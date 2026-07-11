import { Platform } from 'react-native';
import { GamificationState } from '@/types/domain';
import { computeXpProgress } from '@/utils/gamification';
import { APP_GROUP_ID, WIDGET_SNAPSHOT_KEY, WIDGET_KIND } from './config';

export interface WidgetSnapshot {
  streak: number;
  xp: number;
  level: number;
  credits: number;
  xpFraction: number;
  updatedAt: string;
}

/**
 * Pushes the latest streak/XP/credits to the iOS home + lock screen widgets
 * (spec §8) via the shared App Group container. This is a no-op unless the
 * app has been prebuilt with the `targets/widget` WidgetKit extension (see
 * README "Widgets"); requires a Mac + Xcode and is not part of Expo Go.
 */
export function syncWidgetData(state: GamificationState) {
  if (Platform.OS !== 'ios') return;

  let ExtensionStorage: typeof import('@bacons/apple-targets').ExtensionStorage;
  try {
    // Lazy require: the native module only exists in a prebuilt iOS app.
    ExtensionStorage = require('@bacons/apple-targets').ExtensionStorage;
  } catch {
    return;
  }

  const progress = computeXpProgress(state.xp);
  const snapshot: WidgetSnapshot = {
    streak: state.currentStreak,
    xp: state.xp,
    level: progress.level,
    credits: state.credits,
    xpFraction: progress.fraction,
    updatedAt: new Date().toISOString(),
  };

  try {
    const storage = new ExtensionStorage(APP_GROUP_ID);
    storage.set(WIDGET_SNAPSHOT_KEY, snapshot as unknown as Record<string, string | number>);
    ExtensionStorage.reloadWidget(WIDGET_KIND);
  } catch (err) {
    console.warn('Widget sync failed', err);
  }
}
