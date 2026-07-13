// Server-side source of truth for "how much is this level worth", so a
// client can never claim its own XP/credit reward. Level *content* (text,
// questions, instructions) intentionally lives client-side only (see
// src/content/levels/*.ts) — nothing sensitive depends on it staying
// secret — but the reward VALUE must be computed here, independently of
// whatever the client reports, or a modified client/replayed request could
// grant itself unlimited XP and credits.
//
// Every one of the 6 fixed addiction categories was generated with the same
// structure (see src/content/levels/*.ts): 5 chapters x 6 levels, each
// chapter following the pattern [documentation, lesson, exercise, lesson,
// exercise, documentation], with rewards fixed strictly by level TYPE
// (never by category or individual level):
//   documentation = 15 XP / 1 credit
//   lesson        = 20 XP / 1 credit
//   exercise      = 25 XP / 1 credit
// Level ids look like `{categoryCode}_{chapter}_{01-06}`, e.g.
// `doom_awareness_01`. Custom ("Other") categories instead get the 3-level
// fallback from src/content/levels/general.ts — chapter is always
// 'awareness', and the type pattern there is [lesson, exercise, documentation]
// for levels 01/02/03, with the *category id* (a server-generated uuid, not
// attacker-controlled — see custom_habit_categories.id) as the prefix.
//
// If the content generation pattern in src/content/levels/ ever changes,
// this file must be updated to match, or the two will silently disagree.

export type LevelType = 'documentation' | 'lesson' | 'exercise';

export interface LevelReward {
  type: LevelType;
  xp: number;
  credits: number;
}

const REWARDS: Record<LevelType, LevelReward> = {
  documentation: { type: 'documentation', xp: 15, credits: 1 },
  lesson: { type: 'lesson', xp: 20, credits: 1 },
  exercise: { type: 'exercise', xp: 25, credits: 1 },
};

// Position 1-6 within a chapter -> level type, identical across all 6 fixed
// categories and all 5 chapters (see src/content/levels/doomscrolling.ts
// etc. — every category file follows this exact sequence).
const CHAPTER_TYPE_PATTERN: LevelType[] = [
  'documentation',
  'lesson',
  'exercise',
  'lesson',
  'exercise',
  'documentation',
];

// src/content/levels/general.ts's fallback for custom "Other" categories:
// always 3 levels, always chapter 'awareness', this exact type sequence.
const GENERAL_FALLBACK_PATTERN: Record<string, LevelType> = {
  '01': 'lesson',
  '02': 'exercise',
  '03': 'documentation',
};

const FIXED_CATEGORY_CODES = new Set(['doom', 'food', 'vape', 'smoke', 'alc', 'drug']);

const CHAPTERS = ['awareness', 'triggers', 'tools', 'reflection', 'maintenance'];

const LEVEL_ID_PATTERN = new RegExp(`^([a-z0-9-]+)_(${CHAPTERS.join('|')})_(\\d{2})$`);

/** Returns null for anything that isn't a recognizable, legitimate level id. */
export function resolveLevelReward(levelId: string): LevelReward | null {
  if (typeof levelId !== 'string' || levelId.length > 200) return null;
  const match = levelId.match(LEVEL_ID_PATTERN);
  if (!match) return null;
  const [, prefix, chapter, nn] = match;
  const position = parseInt(nn, 10);

  if (FIXED_CATEGORY_CODES.has(prefix)) {
    if (position < 1 || position > 6) return null;
    return REWARDS[CHAPTER_TYPE_PATTERN[position - 1]];
  }

  // Custom "Other" category: only the 3-level 'awareness' fallback exists.
  if (chapter === 'awareness' && GENERAL_FALLBACK_PATTERN[nn]) {
    return REWARDS[GENERAL_FALLBACK_PATTERN[nn]];
  }

  return null;
}
