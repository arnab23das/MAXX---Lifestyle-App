// Ported from src/utils/gamification.ts (pure functions, no RN dependency) so
// the server-side complete-level function computes streaks/XP identically to
// the client's own display logic. Keep these two copies in sync by hand —
// there is no shared package between the Expo app and Deno Edge Functions.

export interface GamificationLike {
  xp: number;
  credits: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakFreezesAvailable: number;
  streakFreezesUsedTotal: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function todayDateString(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / MS_PER_DAY);
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  streakFreezesAvailable: number;
  streakFreezesUsedTotal: number;
  usedFreeze: boolean;
}

export function applyActiveDay(state: GamificationLike, today: string = todayDateString()): StreakUpdateResult {
  if (state.lastActiveDate === today) {
    return {
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      streakFreezesAvailable: state.streakFreezesAvailable,
      streakFreezesUsedTotal: state.streakFreezesUsedTotal,
      usedFreeze: false,
    };
  }

  if (!state.lastActiveDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, state.longestStreak),
      streakFreezesAvailable: state.streakFreezesAvailable,
      streakFreezesUsedTotal: state.streakFreezesUsedTotal,
      usedFreeze: false,
    };
  }

  const gap = daysBetween(state.lastActiveDate, today);

  if (gap === 1) {
    const currentStreak = state.currentStreak + 1;
    return {
      currentStreak,
      longestStreak: Math.max(currentStreak, state.longestStreak),
      streakFreezesAvailable: state.streakFreezesAvailable,
      streakFreezesUsedTotal: state.streakFreezesUsedTotal,
      usedFreeze: false,
    };
  }

  if (gap === 2 && state.streakFreezesAvailable > 0) {
    const currentStreak = state.currentStreak + 1;
    return {
      currentStreak,
      longestStreak: Math.max(currentStreak, state.longestStreak),
      streakFreezesAvailable: state.streakFreezesAvailable - 1,
      streakFreezesUsedTotal: state.streakFreezesUsedTotal + 1,
      usedFreeze: true,
    };
  }

  return {
    currentStreak: 1,
    longestStreak: state.longestStreak,
    streakFreezesAvailable: state.streakFreezesAvailable,
    streakFreezesUsedTotal: state.streakFreezesUsedTotal,
    usedFreeze: false,
  };
}

export function maybeAwardStreakFreeze(streak: number, freezesAvailable: number): number {
  if (streak > 0 && streak % 7 === 0 && freezesAvailable < 3) {
    return freezesAvailable + 1;
  }
  return freezesAvailable;
}
