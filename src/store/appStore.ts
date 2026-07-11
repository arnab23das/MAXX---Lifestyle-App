import { create } from 'zustand';
import { UserProfile, LevelProgress, GamificationState } from '@/types/domain';
import { HabitCategory, GeneratedPath, TrackId, Level } from '@/types/content';
import { getMyProfile, updateMyProfile, addCustomHabitCategory, getCustomHabitCategories } from '@/api/profile';
import { getProgressForUser, upsertProgress } from '@/api/progress';
import { getGamificationState, saveGamificationState } from '@/api/gamification';
import { ADDICTION_CATEGORIES, getLevelsForCategory, generatePath, getAllLevelsById } from '@/content';
import { applyActiveDay, maybeAwardStreakFreeze, todayDateString } from '@/utils/gamification';
import { syncWidgetData } from '@/widgets/widgetData';

interface AppState {
  loading: boolean;
  profile: UserProfile | null;
  progress: Record<string, LevelProgress>;
  gamification: GamificationState | null;
  categories: HabitCategory[]; // fixed + this user's custom categories
  path: GeneratedPath | null;
  levelsById: Map<string, Level>;

  loadForUser: (userId: string) => Promise<void>;
  reset: () => void;

  selectTrackAndCategories: (userId: string, trackId: TrackId, categoryIds: string[], customLabels: string[]) => Promise<void>;
  acceptTerms: (userId: string, version: string) => Promise<void>;
  setRegion: (userId: string, region: string) => Promise<void>;

  completeLevel: (userId: string, levelId: string) => Promise<{ xpGained: number; creditsGained: number; usedFreeze: boolean }>;
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

  reset: () => set({ profile: null, progress: {}, gamification: null, path: null, loading: false }),

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
    await updateMyProfile(userId, { region });
    set((s) => (s.profile ? { profile: { ...s.profile, region } } : s));
  },

  completeLevel: async (userId, levelId) => {
    const level = get().levelsById.get(levelId);
    if (!level) throw new Error(`Unknown level: ${levelId}`);

    const prior = get().progress[levelId];
    await upsertProgress(userId, levelId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      attempts: (prior?.attempts ?? 0) + 1,
    });

    const gamification = get().gamification ?? (await getGamificationState(userId));
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
    await saveGamificationState(nextState);

    set((s) => ({
      progress: {
        ...s.progress,
        [levelId]: { userId, levelId, status: 'completed', completedAt: new Date().toISOString(), attempts: (prior?.attempts ?? 0) + 1 },
      },
      gamification: nextState,
    }));
    syncWidgetData(nextState);

    return { xpGained: level.xpReward, creditsGained: level.creditReward, usedFreeze: streakResult.usedFreeze };
  },
}));

export function selectNextLevelIndex(state: AppState): number {
  if (!state.path) return -1;
  return firstUnlockedOrNextIndex(state.path, state.progress);
}
