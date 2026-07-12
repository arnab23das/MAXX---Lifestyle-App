// Modular Track -> Path -> Level content model (spec §2, §4, §12 phase 1).
// New goal tracks (Track 2, Track 3) are added by inserting data that
// satisfies these types — never by branching app code per track.
//
// Level content shape follows the "MAXX — Level Design & Generation Prompt"
// spec: three distinct level types (documentation/lesson/exercise), each
// grouped into one of five chapters per addiction category.

export type LevelType = 'documentation' | 'lesson' | 'exercise';

export type TrackId = 'addictions' | 'track_2' | 'track_3';

export type Chapter = 'awareness' | 'triggers' | 'tools' | 'reflection' | 'maintenance';

export const CHAPTER_ORDER: Chapter[] = ['awareness', 'triggers', 'tools', 'reflection', 'maintenance'];

export const CHAPTER_LABELS: Record<Chapter, string> = {
  awareness: 'Awareness',
  triggers: 'Triggers',
  tools: 'Tools',
  reflection: 'Reflection',
  maintenance: 'Maintenance',
};

/** A top-level goal a user can pick on the Goal Selection screen. */
export interface Track {
  id: TrackId;
  title: string;
  subtitle: string;
  available: boolean; // only `addictions` is true in this build
  icon: string; // name used with the icon component
}

/** A category within a track's personalization checklist, e.g. "Vaping". */
export interface HabitCategory {
  id: string;
  trackId: TrackId;
  label: string;
  description: string;
  icon: string;
  isCustom?: boolean; // true for user-authored "Other" entries
}

// ---------------------------------------------------------------------------
// Documentation: a structured check-in, 2-4 fields + free text.
// ---------------------------------------------------------------------------

export type DocumentationInputType = 'number' | 'short_text' | 'long_text' | 'scale_1_5' | 'single_select';

export interface DocumentationField {
  key: string;
  label: string;
  input: DocumentationInputType;
  options?: string[]; // required when input === 'single_select'
}

export interface DocumentationContent {
  type: 'documentation';
  checkInPrompt: string;
  fields: DocumentationField[];
  shareableToCommunity: boolean;
}

// ---------------------------------------------------------------------------
// Lesson: one evidence-based fact, then 1-3 MCQs with per-answer feedback.
// ---------------------------------------------------------------------------

export interface LessonQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

export interface LessonContent {
  type: 'lesson';
  lessonText: string;
  questions: LessonQuestion[];
}

// ---------------------------------------------------------------------------
// Exercise: one practical action, doable in 1-5 minutes, no equipment.
// ---------------------------------------------------------------------------

export type ExerciseFormat = 'breathing_timer' | 'timed_reflection' | 'real_world_task' | 'countdown';

export interface ExerciseContent {
  type: 'exercise';
  instruction: string;
  format: ExerciseFormat;
  durationSeconds: number;
  completionPrompt: string;
}

export type LevelContent = DocumentationContent | LessonContent | ExerciseContent;

export interface Level {
  id: string; // {categoryId}_{chapter}_{nn}
  trackId: TrackId;
  categoryIds: string[]; // which HabitCategory selections surface this level
  chapter: Chapter;
  levelNumber: number; // order within the category's 30-level path
  order: number; // mirrors levelNumber; kept for path-generator compatibility
  type: LevelType;
  title: string;
  estimatedMinutes: number;
  xpReward: number;
  creditReward: number;
  content: LevelContent;
}

/** A user's generated path: an ordered slice of Levels for their selected categories. */
export interface GeneratedPath {
  trackId: TrackId;
  categoryIds: string[];
  levelIds: string[]; // ordered
}
