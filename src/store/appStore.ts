import { create } from 'zustand';
import { UserProfile, LevelProgress, GamificationState } from '@/types/domain';
import { HabitCategory, GeneratedPath, TrackId, Level } from '@/types/content';
import { getMyProfile, updateMyProfile, addCustomHabitCategory, getCustomHabitCategories } from '@/api/profile';
import { getProgressForUser } from '@/api/progress';
import { getGamificationState, completeLevelOnServer } from '@/api/gamification';
import { ADDICTION_CATEGORIES, getLevelsForCategory, generatePath, getAllLevelsById } from '@/content';
import { applyActiveDay, maybeAwardStreakFreeze, todayDateString } from '@/utils/gamification';
import { syncWidgetData } from '@/widgets/widgetData';
import { TERMS_VERSION } from '@/content/legal';

export const DEMO_USER_ID = 'demo-user';

interface AppState {
  loading: boolean;
  profile: UserProfile | null;
  progress: Record<string, LevelProgress>;
  gamification: GamificationState | null;
  categories: HabitCategory[]; // fixed + this user's custom categories
  path: GeneratedPath | null;
  levelsById: Map<string, Level>;
  isDemo: boolean;

  loadForUser: (userId: string) => Promise<void>;
  reset: () => void;

  selectTrackAndCategories: (userId: string, trackId: TrackId, categoryIds: string[], customLabels: string[]) => Promise<void>;
  acceptTerms: (userId: string, version: string) => Promise<void>;
  setRegion: (userId: string, region: string) => Promise<void>;

  completeLevel: (userId: string, levelId: string) => Promise<{ xpGained: number; creditsGained: number; usedFreeze: boolean }>;

  /**
   * Bypasses Supabase entirely and drops the app into the real level path
   * with in-memory-only fake data — for previewing the app without a
   * working backend. Nothing here is persisted anywhere.
   */
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

function firstUnlockedOrNextIndex(path: GeneratedPath, progress: Record<string, LevelProgress>): number {
  for (let i = 0; i < path.levelIds.length; i++) {
    const p = progress[path.levelIds[i]];
    if (!p || p.status !== 'completed') return i;
  }
  return path.levelIds.length;
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: false,
  profile: null,
  progress: {},
  gamification: null,
  categories: ADDICTION_CATEGORIES,
  path: null,
  levelsById: getAllLevelsById(),
  isDemo: false,

  reset: () => set({ profile: null, progress: {}, gamification: null, path: null, loading: false, isDemo: false }),

  loadForUser: async (userId: string) => {
    set({ loading: true });
    const [profile, progressList, gamification, customCategories] = await Promise.all([
      getMyProfile(userId),
      getProgressForUser(userId),
      getGamificationState(userId),
      getCustomHabitCategories(userId),
    ]);

    const customAsHabitCategories: HabitCategory[] = customCategories.map((c) => ({
      id: c.id,
      trackId: 'addictions',
      label: c.label,
      description: 'Custom entry',
      icon: 'star',
      isCustom: true,
    }));
    const categories = [...ADDICTION_CATEGORIES.filter((c) => !c.isCustom), ...customAsHabitCategories];

    const levelsById = new Map(get().levelsById);
    for (const category of customAsHabitCategories) {
      for (const level of getLevelsForCategory(category)) {
        levelsById.set(level.id, level);
      }
    }

    const progress: Record<string, LevelProgress> = {};
    for (const p of progressList) progress[p.levelId] = p;

    let path: GeneratedPath | null = null;
    if (profile?.selectedTrackId && profile.selectedCategoryIds.length > 0) {
      const selectedCategories = categories.filter((c) => profile.selectedCategoryIds.includes(c.id));
      path = generatePath(profile.selectedTrackId, selectedCategories);
    }

    set({ profile, progress, gamification, categories, path, levelsById, loading: false });
    syncWidgetData(gamification);
  },

  selectTrackAndCategories: async (userId, trackId, categoryIds, customLabels) => {
    const created = await Promise.all(customLabels.map((label) => addCustomHabitCategory(userId, label)));
    const allCategoryIds = [...categoryIds, ...created.map((c) => c.id)];
    await updateMyProfile(userId, { selectedTrackId: trackId, selectedCategoryIds: allCategoryIds });
    await get().loadForUser(userId);
  },

  acceptTerms: async (userId, version) => {
    await updateMyProfile(userId, { acceptedTermsAt: new Date().toISOString(), acceptedTermsVersion: version });
    await get().loadForUser(userId);
  },

  setRegion: async (userId, region) => {
    if (get().isDemo) {
      set((s) => (s.profile ? { profile: { ...s.profile, region } } : s));
      return;
    }
    await updateMyProfile(userId, { region });
    set((s) => (s.profile ? { profile: { ...s.profile, region } } : s));
  },

  completeLevel: async (userId, levelId) => {
    const level = get().levelsById.get(levelId);
    if (!level) throw new Error(`Unknown level: ${levelId}`);
    const isDemo = get().isDemo;
    const prior = get().progress[levelId];

    if (isDemo) {
      // Demo mode has no backend at all — this is a local, client-computed
      // simulation for previewing the app with fake in-memory data, never a
      // real user, so there's no anti-cheat concern with computing rewards
      // client-side here the way real users' completions used to be.
      const gamification = get().gamification;
      if (!gamification) throw new Error('No gamification state available.');
      const today = todayDateString();
      const streakResult = applyActiveDay(gamification, today);
      const streakFreezesAvailable = maybeAwardStreakFreeze(streakResult.currentStreak, streakResult.streakFreezesAvailable);
      const nextState: GamificationState = {
        ...gamification,
        xp: gamification.xp + level.xpReward,
        credits: gamification.credits + level.creditReward,
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastActiveDate: today,
        streakFreezesAvailable,
        streakFreezesUsedTotal: streakResult.streakFreezesUsedTotal,
      };
      set((s) => ({
        progress: {
          ...s.progress,
          [levelId]: { userId, levelId, status: 'completed', completedAt: new Date().toISOString(), attempts: (prior?.attempts ?? 0) + 1 },
        },
        gamification: nextState,
      }));
      return { xpGained: level.xpReward, creditsGained: level.creditReward, usedFreeze: streakResult.usedFreeze };
    }

    // Real users: the complete-level Edge Function is the sole authority on
    // rewards (see migration 0004_security_hardening.sql and
    // supabase/functions/complete-level) — it independently derives the
    // XP/credit value from the level id and writes gamification_state with
    // the service-role key. The client only reports "I finished this level"
    // and reflects back whatever the server decided actually happened.
    const result = await completeLevelOnServer(levelId);
    const nextGamification: GamificationState = {
      userId,
      xp: result.gamification.xp,
      credits: result.gamification.credits,
      currentStreak: result.gamification.current_streak,
      longestStreak: result.gamification.longest_streak,
      lastActiveDate: result.gamification.last_active_date,
      streakFreezesAvailable: result.gamification.streak_freezes_available,
      streakFreezesUsedTotal: result.gamification.streak_freezes_used_total,
    };
    set((s) => ({
      progress: {
        ...s.progress,
        [levelId]: { userId, levelId, status: 'completed', completedAt: new Date().toISOString(), attempts: (prior?.attempts ?? 0) + 1 },
      },
      gamification: nextGamification,
    }));
    syncWidgetData(nextGamification);

    return { xpGained: result.xpGained, creditsGained: result.creditsGained, usedFreeze: result.usedFreeze };
  },

  enterDemoMode: () => {
    const categories = ADDICTION_CATEGORIES.filter((c) => !c.isCustom).slice(0, 2);
    const path = generatePath('addictions', categories);
    const profile: UserProfile = {
      id: DEMO_USER_ID,
      email: null,
      displayName: 'Demo User',
      createdAt: new Date().toISOString(),
      selectedTrackId: 'addictions',
      selectedCategoryIds: categories.map((c) => c.id),
      region: 'US - Northeast',
      acceptedTermsAt: new Date().toISOString(),
      acceptedTermsVersion: TERMS_VERSION,
      notificationsEnabled: false,
    };
    const gamification: GamificationState = {
      userId: DEMO_USER_ID,
      xp: 0,
      credits: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      streakFreezesAvailable: 1,
      streakFreezesUsedTotal: 0,
    };
    set({
      isDemo: true,
      profile,
      gamification,
      progress: {},
      categories: ADDICTION_CATEGORIES,
      path,
      loading: false,
    });
  },

  exitDemoMode: () => {
    set({ isDemo: false, profile: null, progress: {}, gamification: null, path: null });
  },
}));

export function selectNextLevelIndex(state: AppState): number {
  if (!state.path) return -1;
  return firstUnlockedOrNextIndex(state.path, state.progress);
}
