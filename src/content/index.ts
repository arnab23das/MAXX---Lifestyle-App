import { GeneratedPath, HabitCategory, Level, TrackId } from '@/types/content';
import { TRACKS } from './tracks';
import { ADDICTION_CATEGORIES } from './categories';
import { DOOMSCROLLING_LEVELS } from './levels/doomscrolling';
import { FOOD_LEVELS } from './levels/food';
import { VAPING_LEVELS } from './levels/vaping';
import { SMOKING_LEVELS } from './levels/smoking';
import { ALCOHOL_LEVELS } from './levels/alcohol';
import { DRUGS_LEVELS } from './levels/drugs';
import { buildGeneralLevels } from './levels/general';

export { TRACKS, ADDICTION_CATEGORIES };

const FIXED_CATEGORY_LEVELS: Record<string, Level[]> = {
  doomscrolling: DOOMSCROLLING_LEVELS,
  food: FOOD_LEVELS,
  vaping: VAPING_LEVELS,
  smoking: SMOKING_LEVELS,
  alcohol: ALCOHOL_LEVELS,
  drugs: DRUGS_LEVELS,
};

export function getCategoriesForTrack(trackId: TrackId): HabitCategory[] {
  if (trackId === 'addictions') return ADDICTION_CATEGORIES;
  return [];
}

/**
 * Returns the levels for a category. Custom ("Other") categories generate a
 * general-purpose level set on the fly, keyed by the custom category's id, so
 * free-text habits get real content without needing a code change.
 */
export function getLevelsForCategory(category: HabitCategory): Level[] {
  if (category.isCustom) {
    return buildGeneralLevels(category.id, category.label);
  }
  return FIXED_CATEGORY_LEVELS[category.id] ?? [];
}

export function getAllLevelsById(): Map<string, Level> {
  const map = new Map<string, Level>();
  for (const category of ADDICTION_CATEGORIES) {
    for (const level of getLevelsForCategory(category)) {
      map.set(level.id, level);
    }
  }
  return map;
}

/**
 * Builds a user's path by round-robin interleaving levels from each selected
 * category, so early progress touches every chosen habit rather than
 * finishing one category before starting the next.
 */
export function generatePath(trackId: TrackId, categories: HabitCategory[]): GeneratedPath {
  const perCategoryLevels = categories.map((c) => [...getLevelsForCategory(c)].sort((a, b) => a.order - b.order));
  const levelIds: string[] = [];
  let index = 0;
  let remaining = perCategoryLevels.reduce((sum, l) => sum + l.length, 0);
  while (remaining > 0) {
    for (const levels of perCategoryLevels) {
      if (index < levels.length) {
        levelIds.push(levels[index].id);
        remaining -= 1;
      }
    }
    index += 1;
  }
  return { trackId, categoryIds: categories.map((c) => c.id), levelIds };
}
