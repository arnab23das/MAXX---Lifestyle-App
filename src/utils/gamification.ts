import { GamificationState } from '@/types/domain';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function todayDateString(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10); // yyyy-mm-dd, UTC-based day boundary
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

/**
 * Applies "today was active" to a streak, including the streak-freeze safety
 * net (spec §5 decision): missing exactly one day auto-consumes a freeze
 * instead of resetting the streak. Missing 2+ days resets it.
 */
export function applyActiveDay(state: GamificationState, today: string = todayDateString()): StreakUpdateResult {
  if (state.lastActiveDate === today) {
    // Already counted today — no-op.
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
    // Exactly one missed day, covered by a freeze: streak continues.
    const currentStreak = state.currentStreak + 1;
    return {
      currentStreak,
      longestStreak: Math.max(currentStreak, state.longestStreak),
      streakFreezesAvailable: state.streakFreezesAvailable - 1,
      streakFreezesUsedTotal: state.streakFreezesUsedTotal + 1,
      usedFreeze: true,
    };
  }

  // Two or more missed days (or no freeze available): streak resets.
  return {
    currentStreak: 1,
    longestStreak: state.longestStreak,
    streakFreezesAvailable: state.streakFreezesAvailable,
    streakFreezesUsedTotal: state.streakFreezesUsedTotal,
    usedFreeze: false,
  };
}

/** XP required to reach the *next* level from a given level, for the progress bar. */
export function xpForLevel(level: number): number {
  return 50 + (level - 1) * 25;
}

export interface XpProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  fraction: number;
}

export function computeXpProgress(totalXp: number): XpProgress {
  let level = 1;
  let remaining = totalXp;
  let needed = xpForLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpForLevel(level);
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: needed, fraction: remaining / needed };
}

/** One freeze earned every 7-day streak milestone, capped at 3 stored freezes. */
export function maybeAwardStreakFreeze(streak: number, freezesAvailable: number): number {
  if (streak > 0 && streak % 7 === 0 && freezesAvailable < 3) {
    return freezesAvailable + 1;
  }
  return freezesAvailable;
}
