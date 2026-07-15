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

// Every fixed category follows the same five-chapter shape, and every
// chapter follows the same six-level type pattern: documentation, lesson,
// exercise, lesson, exercise, documentation (see e.g. doomscrolling.ts).
// Round-robining ONE level at a time across N selected categories means the
// user hits that same type N times in a row (three lessons back to back,
// three real-world exercise tasks back to back, etc.) — exactly the kind of
// multi-habit overwhelm the personalization flow should avoid. Round-robining
// in pairs instead keeps that from stacking: each category's two-level slice
// pairs a check-in/lesson with the next item in its own sequence, so the
// merged path naturally alternates types even as more categories are added.
const PATH_MERGE_CHUNK_SIZE = 2;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Builds a user's path by round-robin interleaving small chunks of levels
 * from each selected category (see PATH_MERGE_CHUNK_SIZE above), so early
 * progress still touches every chosen habit rather than finishing one
 * category before starting the next, while avoiding long same-type runs
 * when multiple categories are combined. For a single category this
 * produces the same order as a plain walk through that category's levels.
 */
export function generatePath(trackId: TrackId, categories: HabitCategory[]): GeneratedPath {
  const perCategoryChunks = categories.map((c) => chunk([...getLevelsForCategory(c)].sort((a, b) => a.order - b.order), PATH_MERGE_CHUNK_SIZE));
  const levelIds: string[] = [];
  let index = 0;
  let remaining = perCategoryChunks.reduce((sum, chunks) => sum + chunks.length, 0);
  while (remaining > 0) {
    for (const chunks of perCategoryChunks) {
      if (index < chunks.length) {
        for (const level of chunks[index]) levelIds.push(level.id);
        remaining -= 1;
      }
    }
    index += 1;
  }
  return { trackId, categoryIds: categories.map((c) => c.id), levelIds };
}
